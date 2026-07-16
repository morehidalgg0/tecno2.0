import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Validar token de admin
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener órdenes ordenadas por fecha de creación decreciente
    const ordenes = await db.orden.findMany({
      include: {
        sucursal: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Error al obtener las órdenes" },
      { status: 500 }
    );
  }
}
