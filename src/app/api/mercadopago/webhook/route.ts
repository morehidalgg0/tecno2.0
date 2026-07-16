import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializar cliente Mercado Pago
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Mercado Pago puede enviar la información tanto en el body (Webhooks) como en query params (IPN)
    let paymentId = searchParams.get("id") || searchParams.get("data.id");
    let type = searchParams.get("topic") || searchParams.get("type");

    // Si viene en el body
    try {
      const body = await req.json();
      if (body.data?.id) {
        paymentId = body.data.id;
      }
      if (body.type) {
        type = body.type;
      }
    } catch {
      // El body podría estar vacío en algunas peticiones, no pasa nada
    }

    console.log(`Webhook MP recibido: type=${type}, paymentId=${paymentId}`);

    // Solo nos interesan las notificaciones de tipo "payment"
    if (type === "payment" && paymentId) {
      const payment = new Payment(mpClient);
      
      // Obtener el detalle del pago desde Mercado Pago
      const paymentData = await payment.get({ id: paymentId });
      const status = paymentData.status; // approved, rejected, in_process, etc.
      const orderId = paymentData.external_reference; // ID de nuestra Orden en la BD

      console.log(`Pago MP detalle: orden=${orderId}, status=${status}`);

      if (orderId) {
        const orden = await db.orden.findUnique({
          where: { id: orderId },
        });

        if (!orden) {
          console.error(`Orden ${orderId} no encontrada en la base de datos.`);
          return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
        }

        // Si el pago es aprobado y la orden no estaba ya aprobada
        if (status === "approved") {
          if (orden.estado !== "APROBADO") {
            const productos = orden.productos as Array<{
              id: string;
              nombre: string;
              precio: number;
              cantidad: number;
            }>;

            // Transacción: actualizar estado de orden y decrementar stock por sucursal
            await db.$transaction(async (tx) => {
              // 1. Marcar la orden como APROBADO
              await tx.orden.update({
                where: { id: orderId },
                data: {
                  estado: "APROBADO",
                },
              });

              // 2. Descontar stock para cada producto en la sucursal de la orden
              if (orden.sucursalId) {
                for (const prod of productos) {
                  // Verificamos si existe el registro de stock primero
                  const stockRegistro = await tx.stock.findUnique({
                    where: {
                      productoId_sucursalId: {
                        productoId: prod.id,
                        sucursalId: orden.sucursalId,
                      },
                    },
                  });

                  if (stockRegistro) {
                    await tx.stock.update({
                      where: {
                        productoId_sucursalId: {
                          productoId: prod.id,
                          sucursalId: orden.sucursalId,
                        },
                      },
                      data: {
                        cantidad: {
                          decrement: prod.cantidad,
                        },
                      },
                    });
                    console.log(`Stock decrementado: ${prod.cantidad} unidades para producto=${prod.id} en sucursal=${orden.sucursalId}`);
                  }
                }
              }
            });
            console.log(`Orden ${orderId} procesada y APROBADA exitosamente.`);
          } else {
            console.log(`La orden ${orderId} ya estaba APROBADA. Se omite actualización.`);
          }
        } 
        // Si el pago es rechazado o cancelado, marcamos la orden como RECHAZADA
        else if (status === "rejected" || status === "cancelled") {
          if (orden.estado === "PENDIENTE") {
            await db.orden.update({
              where: { id: orderId },
              data: {
                estado: "RECHAZADO",
              },
            });
            console.log(`Orden ${orderId} marcada como RECHAZADA.`);
          }
        }
      }
    }

    // Mercado Pago requiere un status HTTP 200/201 como respuesta para confirmar recepción
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Error en Webhook Mercado Pago:", error);
    // Retornamos 200 igualmente para que MP no siga reintentando infinitamente ante un fallo de código,
    // pero guardando logs detallados para debug.
    const errMsg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: errMsg, received: true }, { status: 200 });
  }
}
