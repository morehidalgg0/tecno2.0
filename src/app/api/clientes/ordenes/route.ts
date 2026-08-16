import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyClienteToken } from "@/lib/auth";

// GET /api/clientes/ordenes - Historial de pedidos del cliente
export async function GET(req: NextRequest) {
  try {
    const cliente = await verifyClienteToken(req);
    if (!cliente) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ordenes = await db.orden.findMany({
      where: {
        OR: [
          { clienteId: cliente.id },
          { clienteEmail: cliente.email },
        ],
      },
      include: {
        sucursal: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error fetching cliente orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
