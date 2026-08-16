import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/cupones/validar - Validar un cupón de descuento
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { codigo, montoCarrito } = body;

    if (!codigo) {
      return NextResponse.json(
        { error: "El código del cupón es requerido" },
        { status: 400 }
      );
    }

    const cupon = await db.cupon.findUnique({
      where: { codigo: codigo.toUpperCase().trim() },
    });

    if (!cupon) {
      return NextResponse.json(
        { error: "Cupón no encontrado" },
        { status: 404 }
      );
    }

    if (!cupon.activo) {
      return NextResponse.json(
        { error: "Este cupón ya no está activo" },
        { status: 400 }
      );
    }

    if (cupon.usoMaximo && cupon.usoActual >= cupon.usoMaximo) {
      return NextResponse.json(
        { error: "Este cupón ha alcanzado su límite de uso" },
        { status: 400 }
      );
    }

    const ahora = new Date();
    if (cupon.validoDesde && ahora < cupon.validoDesde) {
      return NextResponse.json(
        { error: "Este cupón aún no está vigente" },
        { status: 400 }
      );
    }

    if (cupon.validoHasta && ahora > cupon.validoHasta) {
      return NextResponse.json(
        { error: "Este cupón ha expirado" },
        { status: 400 }
      );
    }

    if (montoCarrito && cupon.montoMinimo > 0 && montoCarrito < cupon.montoMinimo) {
      return NextResponse.json(
        {
          error: `El monto mínimo para este cupón es $${cupon.montoMinimo.toLocaleString("es-AR")}`,
        },
        { status: 400 }
      );
    }

    const descuentoMonto = montoCarrito
      ? Math.round((montoCarrito * cupon.descuento) / 100)
      : 0;

    return NextResponse.json({
      success: true,
      cupon: {
        codigo: cupon.codigo,
        descuento: cupon.descuento,
        descuentoMonto,
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Error al validar el cupón" },
      { status: 500 }
    );
  }
}
