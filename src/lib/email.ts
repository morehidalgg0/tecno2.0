export async function enviarEmailConfirmacion(
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
