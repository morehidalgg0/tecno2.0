import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { crearEnvio, obtenerEtiquetaPdf, estaConfigurado, type AndreaniEnvioRequest } from "@/lib/andreani";

const CP_ORIGEN = process.env.CP_ORIGEN || "7600";
const DIRECCION_ORIGEN = process.env.DIRECCION_ORIGEN || "Av. Independencia 1234";
const LOCALIDAD_ORIGEN = process.env.LOCALIDAD_ORIGEN || "Mar del Plata";
const PROVINCIA_ORIGEN = process.env.PROVINCIA_ORIGEN || "Buenos Aires";
const CONTRATO = process.env.ANDREANI_CONTRATO || "";

export async function POST(req: NextRequest) {
  try {
    const { ordenId } = await req.json();

    if (!ordenId) {
      return NextResponse.json({ error: "ordenId requerido" }, { status: 400 });
    }

    const orden = await db.orden.findUnique({ where: { id: ordenId } });
    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (orden.tipoEnvio !== "ENVIO") {
      return NextResponse.json({ error: "La orden no es de tipo ENVIO" }, { status: 400 });
    }

    if (!orden.domicilio || !orden.codigoPostal) {
      return NextResponse.json(
        { error: "Falta domicilio o código postal en la orden" },
        { status: 400 }
      );
    }

    if (!estaConfigurado()) {
      return NextResponse.json(
        { error: "Andreani no está configurado. Definí ANDREANI_CONTRATO, ANDREANI_USER y ANDREANI_PASS" },
        { status: 500 }
      );
    }

    const domicilioParts = parseDomicilio(orden.domicilio);

    const productos = orden.productos as Array<{
      id: string;
      nombre: string;
      precio: number;
      cantidad: number;
    }>;

    const descripcionProductos = productos
      .map((p) => `${p.cantidad}x ${p.nombre}`)
      .join(", ");

    const pesoTotal = Math.max(1, productos.reduce((acc, p) => acc + p.cantidad, 0));

    const envioData: AndreaniEnvioRequest = {
      contrato: CONTRATO,
      tipoDeServicio: "mismod",
      origen: {
        postal: {
          codigoPostal: CP_ORIGEN,
          calle: DIRECCION_ORIGEN,
          numero: "0",
          localidad: LOCALIDAD_ORIGEN,
          region: PROVINCIA_ORIGEN,
          pais: "AR",
        },
      },
      destino: {
        postal: {
          codigoPostal: orden.codigoPostal,
          calle: domicilioParts.calle,
          numero: domicilioParts.numero,
          localidad: domicilioParts.localidad || LOCALIDAD_ORIGEN,
          region: "Buenos Aires",
          pais: "AR",
        },
      },
      remitente: {
        nombreCompleto: "Tecno Güemes",
        email: "envios@tecnoguemes.com",
        telefonos: [{ tipo: 1, numero: "2234567890" }],
      },
      destinatario: [
        {
          nombreCompleto: orden.clienteNombre || "Cliente",
          email: orden.clienteEmail || "",
          telefonos: [{ tipo: 1, numero: orden.telefono || "0000000000" }],
        },
      ],
      remito: {
        numeroRemito: orden.id.slice(-8).toUpperCase(),
        productoAEntregar: descripcionProductos,
        tipoProducto: " ecommerce",
        valorACobrar: 0,
        bultos: [
          {
            kilos: pesoTotal,
            largoCm: 30,
            altoCm: 20,
            anchoCm: 15,
            volumenCm: 9000,
            valorDeclarado: orden.monto,
            descripcion: descripcionProductos,
          },
        ],
      },
    };

    const envioResponse = await crearEnvio(envioData);

    const etiquetaPdf = await obtenerEtiquetaPdf(
      envioResponse.bultos?.[0]?.numeroDeEnvio || ""
    );

    await db.orden.update({
      where: { id: ordenId },
      data: {
        andreaniEnvioId: envioResponse.bultos?.[0]?.numeroDeEnvio || null,
        etiquetaPdf: etiquetaPdf || null,
        trackingNumber: envioResponse.bultos?.[0]?.numeroDeEnvio || null,
        estado: "DESPACHADO",
      },
    });

    return NextResponse.json({
      success: true,
      envioId: envioResponse.bultos?.[0]?.numeroDeEnvio,
      estado: envioResponse.estado,
      etiquetaGenerada: Boolean(etiquetaPdf),
      fechaEstimada: envioResponse.fechaEstimadaDeEntrega,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al crear envío";
    console.error("Error creando envío Andreani:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function parseDomicilio(domicilio: string) {
  const parts = domicilio.split(",").map((s) => s.trim());
  const calleNumero = parts[0] || domicilio;
  const localidad = parts[parts.length - 1] || "";

  const match = calleNumero.match(/^(.+?)\s+(\S+)$/);
  return {
    calle: match ? match[1] : calleNumero,
    numero: match ? match[2] : "0",
    localidad: localidad !== calleNumero ? localidad : "",
  };
}
