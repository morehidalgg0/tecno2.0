import { NextRequest, NextResponse } from "next/server";
import { cotizarEnvio } from "@/lib/andreani";

const CP_ORIGEN = process.env.CP_ORIGEN || "7600";

export async function POST(req: NextRequest) {
  try {
    const { codigoPostal, pesoKg } = await req.json();

    if (!codigoPostal) {
      return NextResponse.json(
        { error: "Código postal requerido" },
        { status: 400 }
      );
    }

    const cotizaciones = await cotizarEnvio(
      CP_ORIGEN,
      codigoPostal,
      pesoKg || 1
    );

    return NextResponse.json({ cotizaciones });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al cotizar envío";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
