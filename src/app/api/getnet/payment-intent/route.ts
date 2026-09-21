import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyClienteToken } from "@/lib/auth";
import { crearPaymentIntent, getnetConfigurado } from "@/lib/getnet";
import { crearOrdenPendiente, CheckoutError, type DatosCheckout } from "@/lib/ordenes";

// POST /api/getnet/payment-intent - Crea la orden y el payment intent en Getnet.
// Devuelve la checkout_url a la que hay que redirigir al cliente.
export async function POST(req: NextRequest) {
  if (!getnetConfigurado()) {
    console.error("Getnet no está configurado: faltan GETNET_CLIENT_ID / GETNET_CLIENT_SECRET");
    return NextResponse.json({ error: "El pago con Getnet no está disponible" }, { status: 503 });
  }

  let datos: DatosCheckout;
  try {
    datos = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  let ordenId: string | null = null;

  try {
    // Datos del cliente logueado, si lo hay
    let cliente: { id: string; email: string; nombre: string } | null = null;
    try {
      const token = await verifyClienteToken(req);
      if (token) {
        cliente = await db.cliente.findUnique({
          where: { id: token.id },
          select: { id: true, email: true, nombre: true },
        });
      }
    } catch {
      // No autenticado, seguimos como invitado
    }

    // 1. Crear orden (order_id) con el monto calculado en el servidor
    const orden = await crearOrdenPendiente(datos, cliente);
    ordenId = orden.id;

    // 2. Llamar a Getnet
    const intent = await crearPaymentIntent({
      orderId: orden.id,
      nombreCompleto: orden.clienteNombre ?? "",
      email: orden.clienteEmail ?? "",
      monto: orden.monto,
    });

    // 3. Guardar el payment_intent_id: el webhook lo contrasta contra este valor
    await db.orden.update({
      where: { id: orden.id },
      data: { getnetPaymentIntentId: intent.paymentIntentId },
    });

    // 4. El front redirige al checkout de Getnet
    return NextResponse.json({ checkoutUrl: intent.checkoutUrl, orderId: orden.id });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error creando payment intent de Getnet:", error);

    // Si Getnet nunca llegó a tener el pago, no dejamos una orden PENDIENTE huérfana
    if (ordenId) {
      await db.orden.delete({ where: { id: ordenId } }).catch(() => {});
    }

    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}
