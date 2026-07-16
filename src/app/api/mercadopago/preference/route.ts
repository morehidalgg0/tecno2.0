import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializar cliente Mercado Pago
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    if (!MP_ACCESS_TOKEN || MP_ACCESS_TOKEN.startsWith("TEST-1234567890")) {
      console.warn("Mercado Pago Access Token is not set or is a placeholder.");
    }

    const body = await req.json();
    const { productos, sucursalId } = body as {
      productos: Array<{ id: string; cantidad: number }>;
      sucursalId: string;
    };

    if (!productos || productos.length === 0 || !sucursalId) {
      return NextResponse.json(
        { error: "Productos y sucursalId son requeridos" },
        { status: 400 }
      );
    }

    // 1. Validar stock de todos los productos en la sucursal seleccionada
    const dbProductos = [];
    let montoTotal = 0;

    for (const item of productos) {
      const dbProd = await db.producto.findUnique({
        where: { id: item.id },
        include: {
          stocks: {
            where: { sucursalId },
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

      const stockSucursal = dbProd.stocks[0]?.cantidad || 0;
      if (stockSucursal < item.cantidad) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para ${dbProd.nombre}. Disponible: ${stockSucursal}, Solicitado: ${item.cantidad}`,
          },
          { status: 400 }
        );
      }

      dbProductos.push({
        id: dbProd.id,
        nombre: dbProd.nombre,
        precio: dbProd.precio,
        cantidad: item.cantidad,
      });

      montoTotal += dbProd.precio * item.cantidad;
    }

    // 2. Crear la Orden en la base de datos (estado inicial PENDIENTE)
    const orden = await db.orden.create({
      data: {
        productos: dbProductos,
        monto: montoTotal,
        estado: "PENDIENTE",
        sucursalId,
      },
    });

    // 3. Crear preferencia de pago en Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Mercado Pago requiere que la notification_url sea HTTPS. Si es localhost, MP la ignorará o fallará al notificar.
    // Para entornos locales, se puede probar simulando el webhook manualmente o usando herramientas como ngrok.
    const notificationUrl = `${appUrl}/api/mercadopago/webhook`;

    const preference = new Preference(mpClient);
    
    const mpPreference = await preference.create({
      body: {
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
        notification_url: appUrl.includes("localhost") ? undefined : notificationUrl, // Omitir en localhost para evitar errores en la API de MP si se exige https
        external_reference: orden.id,
      },
    });

    // 4. Actualizar la orden con el ID de la preferencia de Mercado Pago
    await db.orden.update({
      where: { id: orden.id },
      data: {
        mercadoPagoId: mpPreference.id,
      },
    });

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
