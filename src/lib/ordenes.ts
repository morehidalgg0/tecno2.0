import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cotizarEnvio } from "@/lib/andreani";
import { enviarEmailConfirmacion } from "@/lib/email";

export class CheckoutError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export interface DatosCheckout {
  productos: Array<{ id: string; cantidad: number }>;
  tipoEnvio?: string;
  domicilio?: string | null;
  codigoPostal?: string | null;
  telefono?: string | null;
  cuponCode?: string | null;
  contactoNombre?: string | null;
  contactoEmail?: string | null;
}

interface ClienteLogueado {
  id: string;
  email: string;
  nombre: string;
}

// type (no interface) para que sea asignable al campo Json de Prisma
type ProductoOrden = {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
};

const CP_ORIGEN = process.env.CP_ORIGEN || "7600";

async function calcularCostoEnvio(codigoPostal: string | null | undefined): Promise<number> {
  const fijo = Number(process.env.NEXT_PUBLIC_ENVIO_FIJO) || 5000;
  if (!codigoPostal || codigoPostal.length < 4) return fijo;

  // Igual que el checkout del front: se toma la cotización más barata
  const cotizaciones = await cotizarEnvio(CP_ORIGEN, codigoPostal, 1);
  if (cotizaciones.length === 0) return fijo;
  return Math.min(...cotizaciones.map((c) => c.precio));
}

/**
 * Crea una orden PENDIENTE calculando todos los montos en el servidor (precios de la base,
 * descuento del cupón y costo de envío). No confía en ningún importe que venga del cliente.
 */
export async function crearOrdenPendiente(datos: DatosCheckout, cliente: ClienteLogueado | null) {
  const tipoEnvio = datos.tipoEnvio ?? "RETIRO";
  if (tipoEnvio !== "RETIRO" && tipoEnvio !== "ENVIO") {
    throw new CheckoutError("Tipo de envío inválido", 400);
  }
  if (!Array.isArray(datos.productos) || datos.productos.length === 0) {
    throw new CheckoutError("Productos son requeridos", 400);
  }
  if (tipoEnvio === "ENVIO" && !datos.domicilio) {
    throw new CheckoutError("Dirección requerida para envío", 400);
  }
  if (!datos.contactoNombre || !datos.contactoEmail) {
    throw new CheckoutError("Nombre y email de contacto son requeridos", 400);
  }

  // Unificar ítems repetidos y validar cantidades
  const cantidades = new Map<string, number>();
  for (const item of datos.productos) {
    if (!item?.id || !Number.isInteger(item.cantidad) || item.cantidad < 1) {
      throw new CheckoutError("Cantidad inválida en el carrito", 400);
    }
    cantidades.set(item.id, (cantidades.get(item.id) ?? 0) + item.cantidad);
  }

  const dbProductos = await db.producto.findMany({
    where: { id: { in: [...cantidades.keys()] } },
    include: { stocks: true },
  });
  const porId = new Map(dbProductos.map((p) => [p.id, p]));

  const productos: ProductoOrden[] = [];
  let subtotal = 0;

  for (const [id, cantidad] of cantidades) {
    const prod = porId.get(id);
    if (!prod) {
      throw new CheckoutError(`Producto con ID ${id} no encontrado`, 404);
    }
    if (!prod.activo) {
      throw new CheckoutError(`El producto ${prod.nombre} no está activo para la venta`, 400);
    }
    const stockTotal = prod.stocks.reduce((sum, s) => sum + s.cantidad, 0);
    if (stockTotal < cantidad) {
      throw new CheckoutError(
        `Stock insuficiente para ${prod.nombre}. Disponible: ${stockTotal}, Solicitado: ${cantidad}`,
        400
      );
    }
    productos.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad });
    subtotal += prod.precio * cantidad;
  }

  // Cupón: el uso se contabiliza recién cuando el pago se aprueba
  let descuento = 0;
  let cuponCode: string | null = null;
  if (datos.cuponCode) {
    const codigo = datos.cuponCode.toUpperCase().trim();
    const cupon = await db.cupon.findUnique({ where: { codigo } });
    const ahora = new Date();

    if (!cupon) throw new CheckoutError("Cupón no encontrado", 404);
    if (!cupon.activo) throw new CheckoutError("Este cupón ya no está activo", 400);
    if (cupon.usoMaximo && cupon.usoActual >= cupon.usoMaximo) {
      throw new CheckoutError("Este cupón ha alcanzado su límite de uso", 400);
    }
    if (cupon.validoDesde && ahora < cupon.validoDesde) {
      throw new CheckoutError("Este cupón aún no está vigente", 400);
    }
    if (cupon.validoHasta && ahora > cupon.validoHasta) {
      throw new CheckoutError("Este cupón ha expirado", 400);
    }
    if (cupon.montoMinimo > 0 && subtotal < cupon.montoMinimo) {
      throw new CheckoutError(
        `El monto mínimo para este cupón es $${cupon.montoMinimo.toLocaleString("es-AR")}`,
        400
      );
    }

    descuento = Math.round((subtotal * cupon.descuento) / 100);
    cuponCode = cupon.codigo;
  }

  const costoEnvio = tipoEnvio === "ENVIO" ? await calcularCostoEnvio(datos.codigoPostal) : 0;
  const monto = Math.round((subtotal - descuento + costoEnvio) * 100) / 100;
  if (monto <= 0) {
    throw new CheckoutError("El monto a pagar debe ser mayor a cero", 400);
  }

  const orden = await db.orden.create({
    data: {
      productos,
      monto,
      descuento,
      costoEnvio,
      tipoEnvio,
      domicilio: datos.domicilio ?? null,
      codigoPostal: datos.codigoPostal ?? null,
      telefono: datos.telefono ?? null,
      estado: "PENDIENTE",
      sucursalId: null,
      cuponCode,
      clienteId: cliente?.id ?? null,
      clienteEmail: cliente?.email ?? datos.contactoEmail,
      clienteNombre: cliente?.nombre ?? datos.contactoNombre,
    },
  });

  return orden;
}

/**
 * Marca la orden como APROBADA una única vez, aunque el webhook llegue repetido o en paralelo:
 * el updateMany condicional actúa como cerrojo y solo quien logra el cambio de estado
 * descuenta stock, contabiliza el cupón y envía el email.
 * Devuelve false si la orden ya estaba aprobada (o despachada).
 */
export async function aprobarOrden(orderId: string): Promise<boolean> {
  const orden = await db.orden.findUnique({ where: { id: orderId } });
  if (!orden) return false;

  const aprobada = await db.$transaction(async (tx: Prisma.TransactionClient) => {
    const { count } = await tx.orden.updateMany({
      where: { id: orderId, estado: { in: ["PENDIENTE", "RECHAZADO"] } },
      data: { estado: "APROBADO" },
    });
    if (count === 0) return false;

    // Igual que el webhook de Mercado Pago: el stock se descuenta de la sucursal de la orden
    if (orden.sucursalId) {
      const productos = orden.productos as unknown as ProductoOrden[];
      for (const prod of productos) {
        await tx.stock.updateMany({
          where: { productoId: prod.id, sucursalId: orden.sucursalId },
          data: { cantidad: { decrement: prod.cantidad } },
        });
      }
    }

    if (orden.cuponCode) {
      await tx.cupon.updateMany({
        where: { codigo: orden.cuponCode },
        data: { usoActual: { increment: 1 } },
      });
    }

    return true;
  });

  if (aprobada && orden.clienteEmail) {
    // No bloquea ni falla la respuesta al webhook
    void enviarEmailConfirmacion(
      orden.clienteEmail,
      orden.clienteNombre ?? "",
      orden.id,
      orden.productos as unknown as ProductoOrden[],
      orden.monto,
      orden.tipoEnvio,
      orden.domicilio
    );
  }

  return aprobada;
}

/** Solo rechaza órdenes que siguen PENDIENTES: una orden aprobada nunca vuelve atrás. */
export async function rechazarOrden(orderId: string): Promise<boolean> {
  const { count } = await db.orden.updateMany({
    where: { id: orderId, estado: "PENDIENTE" },
    data: { estado: "RECHAZADO" },
  });
  return count > 0;
}
