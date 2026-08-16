import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { verifyClienteToken } from "@/lib/auth";

const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

async function enviarEmailConfirmacion(
  email: string,
  nombre: string,
  orderId: string,
  productos: Array<{ nombre: string; cantidad: number; precio: number }>,
  monto: number,
  tipoEnvio: string,
  domicilio: string | null
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const itemsHtml = productos
      .map((p) => `<li>${p.cantidad}x ${p.nombre} - $${(p.precio * p.cantidad).toLocaleString("es-AR")}</li>`)
      .join("");

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "Tecno Güemes <notificaciones@tecnoguemes.com>",
        to: email,
        subject: `Confirmación de compra - Orden #${orderId.slice(-8).toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #E88D00;">¡Gracias por tu compra, ${nombre}!</h1>
            <p>Tu orden <strong>#${orderId.slice(-8).toUpperCase()}</strong> fue recibida correctamente.</p>
            <h2>Resumen:</h2>
            <ul>${itemsHtml}</ul>
            <p style="font-size: 18px; font-weight: bold;">Total: $${monto.toLocaleString("es-AR")}</p>
            <p><strong>Modalidad:</strong> ${tipoEnvio === "ENVIO" ? `Envío a ${domicilio}` : "Retiro en sucursal"}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">Tecno Güemes - Mar del Plata, Argentina</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      console.warn("Error sending confirmation email:", await resendRes.text());
    }
  } catch (err) {
    console.warn("Failed to send confirmation email:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-1234567890")) {
      console.warn("Mercado Pago Access Token is not set or is a placeholder.");
    }

    const body = await req.json();
    const {
      productos,
      sucursalId,
      tipoEnvio = "RETIRO",
      domicilio = null,
      codigoPostal = null,
      telefono = null,
      costoEnvio = 0,
      cuponCode = null,
      descuento = 0,
      contactoNombre = null,
      contactoEmail = null,
    } = body as {
      productos: Array<{ id: string; cantidad: number }>;
      sucursalId: string;
      tipoEnvio?: string;
      domicilio?: string | null;
      codigoPostal?: string | null;
      telefono?: string | null;
      costoEnvio?: number;
      cuponCode?: string | null;
      descuento?: number;
      contactoNombre?: string | null;
      contactoEmail?: string | null;
    };

    if (!productos || productos.length === 0) {
      return NextResponse.json(
        { error: "Productos son requeridos" },
        { status: 400 }
      );
    }

    if (tipoEnvio === "RETIRO" && !sucursalId) {
      return NextResponse.json(
        { error: "Sucursal requerida para retiro" },
        { status: 400 }
      );
    }

    if (tipoEnvio === "ENVIO" && !domicilio) {
      return NextResponse.json(
        { error: "Dirección requerida para envío" },
        { status: 400 }
      );
    }

    if (!contactoNombre || !contactoEmail) {
      return NextResponse.json(
        { error: "Nombre y email de contacto son requeridos" },
        { status: 400 }
      );
    }

    // Intentar obtener datos del cliente logueado
    let clienteData: { id: string; email: string; nombre: string } | null = null;
    try {
      const cliente = await verifyClienteToken(req);
      if (cliente) {
        const clienteDb = await db.cliente.findUnique({
          where: { id: cliente.id },
          select: { id: true, email: true, nombre: true },
        });
        clienteData = clienteDb;
      }
    } catch {
      // No autenticado, seguimos sin datos de cliente
    }

    const dbProductos = [];
    let montoTotal = 0;

    for (const item of productos) {
      const dbProd = await db.producto.findUnique({
        where: { id: item.id },
        include: {
          stocks: {
            where: sucursalId ? { sucursalId } : undefined,
          },
        },
      });

      if (!dbProd) {
        return NextResponse.json(
          { error: `Producto con ID ${item.id} no encontrado` },
          { status: 404 }
        );
      }

      if (!dbProd.activo) {
        return NextResponse.json(
          { error: `El producto ${dbProd.nombre} no está activo para la venta` },
          { status: 400 }
        );
      }

      // Validar stock solo para retiro
      if (tipoEnvio === "RETIRO" && sucursalId) {
        const stockSucursal = dbProd.stocks[0]?.cantidad || 0;
        if (stockSucursal < item.cantidad) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para ${dbProd.nombre}. Disponible: ${stockSucursal}, Solicitado: ${item.cantidad}`,
            },
            { status: 400 }
          );
        }
      }

      dbProductos.push({
        id: dbProd.id,
        nombre: dbProd.nombre,
        precio: dbProd.precio,
        cantidad: item.cantidad,
      });

      montoTotal += dbProd.precio * item.cantidad;
    }

    // Validar y aplicar cupón
    let descuentoMonto = 0;
    if (cuponCode) {
      const cupon = await db.cupon.findUnique({
        where: { codigo: cuponCode.toUpperCase() },
      });

      if (cupon && cupon.activo) {
        descuentoMonto = Math.round((montoTotal * cupon.descuento) / 100);
        // Incrementar uso del cupón
        await db.cupon.update({
          where: { id: cupon.id },
          data: { usoActual: { increment: 1 } },
        });
      }
    }

    const montoFinal = montoTotal - (descuento > 0 ? descuento : descuentoMonto) + costoEnvio;

    // Crear la Orden
    const orden = await db.orden.create({
      data: {
        productos: dbProductos,
        monto: montoFinal,
        descuento: descuento > 0 ? descuento : descuentoMonto,
        costoEnvio,
        tipoEnvio,
        domicilio,
        codigoPostal,
        telefono,
        estado: "PENDIENTE",
        sucursalId: tipoEnvio === "RETIRO" ? sucursalId : null,
        cuponCode: cuponCode?.toUpperCase() || null,
        clienteId: clienteData?.id || null,
        clienteEmail: clienteData?.email || contactoEmail,
        clienteNombre: clienteData?.nombre || contactoNombre,
      },
    });

    // Crear preferencia de pago en Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const notificationUrl = `${appUrl}/api/mercadopago/webhook`;

    const preference = new Preference(mpClient);

    const preferenceBody: Record<string, unknown> = {
      items: dbProductos.map((p) => ({
        id: p.id,
        title: p.nombre,
        unit_price: p.precio,
        quantity: p.cantidad,
        currency_id: "ARS",
      })),
      back_urls: {
        success: `${appUrl}/checkout/success?orderId=${orden.id}`,
        failure: `${appUrl}/checkout/failure?orderId=${orden.id}`,
        pending: `${appUrl}/checkout/pending?orderId=${orden.id}`,
      },
      auto_return: "approved",
      notification_url: appUrl.includes("localhost") ? undefined : notificationUrl,
      external_reference: orden.id,
    };

    const mpPreference = await preference.create({
      body: preferenceBody as never,
    });

    // Actualizar la orden con el ID de la preferencia
    await db.orden.update({
      where: { id: orden.id },
      data: {
        mercadoPagoId: mpPreference.id,
      },
    });

    // Enviar email de confirmación (async, no bloquea)
    const emailDestino = clienteData?.email || contactoEmail;
    const nombreDestino = clienteData?.nombre || contactoNombre;
    if (emailDestino) {
      enviarEmailConfirmacion(
        emailDestino,
        nombreDestino,
        orden.id,
        dbProductos,
        montoFinal,
        tipoEnvio,
        domicilio
      );
    }

    return NextResponse.json({
      preferenceId: mpPreference.id,
      initPoint: mpPreference.init_point,
      sandboxInitPoint: mpPreference.sandbox_init_point,
      orderId: orden.id,
    });
  } catch (error) {
    console.error("Error creating Mercado Pago preference:", error);
    const errMsg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al procesar el pago", details: errMsg },
      { status: 500 }
    );
  }
}
