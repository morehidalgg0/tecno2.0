import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clasificarEstado, webhookTokenValido } from "@/lib/getnet";
import { aprobarOrden, rechazarOrden } from "@/lib/ordenes";

// POST /api/getnet/webhook?token=<GETNET_WEBHOOK_SECRET>
// Es la fuente de verdad del resultado del pago (el redirect del navegador es solo UX).
// Esta URL se carga en el Getnet Portal (Productos Digitales > Checkout), en UAT y en producción.
export async function POST(req: NextRequest) {
  if (!webhookTokenValido(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let payload: { order_id?: unknown; payment_intent_id?: unknown; status?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { order_id: orderId, payment_intent_id: paymentIntentId, status } = payload;
  if (typeof orderId !== "string" || typeof paymentIntentId !== "string" || typeof status !== "string") {
    return NextResponse.json({ error: "Faltan order_id, payment_intent_id o status" }, { status: 400 });
  }

  console.log(`Webhook Getnet: order_id=${orderId}, payment_intent_id=${paymentIntentId}, status=${status}`);

  try {
    const orden = await db.orden.findUnique({ where: { id: orderId } });
    if (!orden) {
      console.error(`Webhook Getnet: orden ${orderId} no encontrada`);
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // El payment_intent_id debe ser el que Getnet nos devolvió al crear el pago
    if (orden.getnetPaymentIntentId && orden.getnetPaymentIntentId !== paymentIntentId) {
      console.error(
        `Webhook Getnet: payment_intent_id ${paymentIntentId} no coincide con el de la orden ${orderId}`
      );
      return NextResponse.json({ error: "payment_intent_id no coincide" }, { status: 409 });
    }

    // Si el guardado posterior a crear el pago falló, lo recuperamos desde el webhook
    if (!orden.getnetPaymentIntentId) {
      await db.orden.update({
        where: { id: orderId },
        data: { getnetPaymentIntentId: paymentIntentId },
      });
    }

    switch (clasificarEstado(status)) {
      case "APROBADO": {
        const aprobada = await aprobarOrden(orderId);
        console.log(
          aprobada
            ? `Orden ${orderId} APROBADA`
            : `Orden ${orderId} ya estaba aprobada, se omite actualización`
        );
        break;
      }
      case "RECHAZADO": {
        const rechazada = await rechazarOrden(orderId);
        console.log(rechazada ? `Orden ${orderId} RECHAZADA` : `Orden ${orderId} no estaba PENDIENTE, sin cambios`);
        break;
      }
      default:
        console.warn(`Webhook Getnet: estado desconocido "${status}" para la orden ${orderId}, sin cambios`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    // 500 (no 200) para que Getnet pueda reintentar: si respondiéramos OK se perdería la aprobación
    console.error("Error en webhook de Getnet:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
