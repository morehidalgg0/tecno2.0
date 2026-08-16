import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

// GET /api/cupones - Listar cupones (admin)
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const cupones = await db.cupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cupones);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Error al obtener cupones" },
      { status: 500 }
    );
  }
}

// POST /api/cupones - Crear cupón (admin)
export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { codigo, descuento, montoMinimo, usoMaximo, validoDesde, validoHasta } = body;

    if (!codigo || !descuento) {
      return NextResponse.json(
        { error: "Código y descuento son requeridos" },
        { status: 400 }
      );
    }

    if (descuento <= 0 || descuento > 100) {
      return NextResponse.json(
        { error: "El descuento debe estar entre 1 y 100" },
        { status: 400 }
      );
    }

    const existente = await db.cupon.findUnique({
      where: { codigo: codigo.toUpperCase().trim() },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un cupón con ese código" },
        { status: 409 }
      );
    }

    const cupon = await db.cupon.create({
      data: {
        codigo: codigo.toUpperCase().trim(),
        descuento: parseFloat(descuento),
        montoMinimo: montoMinimo ? parseFloat(montoMinimo) : 0,
        usoMaximo: usoMaximo ? parseInt(usoMaximo) : null,
        validoDesde: validoDesde ? new Date(validoDesde) : null,
        validoHasta: validoHasta ? new Date(validoHasta) : null,
      },
    });

    return NextResponse.json(cupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Error al crear el cupón" },
      { status: 500 }
    );
  }
}

// DELETE /api/cupones?id=xxx - Eliminar cupón (admin)
export async function DELETE(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    await db.cupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Error al eliminar el cupón" },
      { status: 500 }
    );
  }
}
