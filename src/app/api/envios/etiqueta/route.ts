import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ordenId = searchParams.get("ordenId");

    if (!ordenId) {
      return NextResponse.json({ error: "ordenId requerido" }, { status: 400 });
    }

    const orden = await db.orden.findUnique({ where: { id: ordenId } });
    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (!orden.etiquetaPdf) {
      return NextResponse.json(
        { error: "Etiqueta no disponible. Generá el envío primero." },
        { status: 404 }
      );
    }

    const pdfBuffer = Buffer.from(orden.etiquetaPdf, "base64");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="etiqueta-${orden.id.slice(-8).toUpperCase()}.pdf"`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al obtener etiqueta";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
