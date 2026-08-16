const ANDREANI_API_URL =
  process.env.ANDREANI_API_URL || "https://api.andreani.com/v1";
const ANDREANI_CONTRATO = process.env.ANDREANI_CONTRATO || "";
const ANDREANI_USER = process.env.ANDREANI_USER || "";
const ANDREANI_PASS = process.env.ANDREANI_PASS || "";

function authHeaders(): string {
  return (
    "Basic " + Buffer.from(`${ANDREANI_USER}:${ANDREANI_PASS}`).toString("base64")
  );
}

async function andreaniFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${ANDREANI_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: authHeaders(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Andreani API error ${res.status}: ${err}`);
  }

  return res.json() as Promise<T>;
}

export interface CotizacionEnvio {
  servicio: string;
  precio: number;
  diasEstimados: number;
  servicioId: number;
}

interface AndreaniCotizacionResponse {
  servicios?: Array<{
    codigo: string;
    descripcion: string;
    precio: number;
    diasEstimadosEntrega: number;
    tipo: string;
  }>;
}

export interface AndreaniEnvioResponse {
  estado: string | null;
  tipo: string | null;
  fechaCreacion: string | null;
  etiquetaRemito: string | null;
  bultos: Array<{
    numeroDeBulto: string | null;
    numeroDeEnvio: string | null;
  }> | null;
  fechaEstimadaDeEntrega: string | null;
}

export interface AndreaniEnvioRequest {
  contrato: string;
  tipoDeServicio: string;
  origen: {
    postal: {
      codigoPostal: string;
      calle: string;
      numero: string;
      localidad: string;
      region: string;
      pais: string;
    };
  };
  destino: {
    postal: {
      codigoPostal: string;
      calle: string;
      numero: string;
      localidad: string;
      region: string;
      pais: string;
    };
  };
  remitente: {
    nombreCompleto: string;
    email: string;
    telefonos: Array<{ tipo: number; numero: string }>;
  };
  destinatario: Array<{
    nombreCompleto: string;
    email: string;
    telefonos: Array<{ tipo: number; numero: string }>;
  }>;
  remito: {
    numeroRemito: string;
    productoAEntregar: string;
    tipoProducto: string;
    valorACobrar: number;
    bultos: Array<{
      kilos: number;
      largoCm: number;
      altoCm: number;
      anchoCm: number;
      volumenCm: number;
      valorDeclarado: number;
      descripcion: string;
    }>;
  };
}

export async function cotizarEnvio(
  codigoPostalOrigen: string,
  codigoPostalDestino: string,
  pesoKg: number = 1
): Promise<CotizacionEnvio[]> {
  if (!ANDREANI_CONTRATO || !ANDREANI_USER) {
    return [
      { servicio: "Estándar", precio: 5000, diasEstimados: 3, servicioId: 0 },
    ];
  }

  try {
    const params = new URLSearchParams({
      codigoPostalOrigen,
      codigoPostalDestino,
      kilos: String(pesoKg),
      contrato: ANDREANI_CONTRATO,
    });

    const data = await andreaniFetch<AndreaniCotizacionResponse>(
      `/envios/cotizar?${params.toString()}`
    );

    if (data.servicios && data.servicios.length > 0) {
      return data.servicios.map((s) => ({
        servicio: s.descripcion,
        precio: s.precio,
        diasEstimados: s.diasEstimadosEntrega,
        servicioId: Number(s.codigo) || 0,
      }));
    }

    return [
      { servicio: "Estándar", precio: 5000, diasEstimados: 3, servicioId: 0 },
    ];
  } catch {
    console.warn("Error cotizando con Andreani, usando precio fallback");
    return [
      { servicio: "Estándar", precio: 5000, diasEstimados: 3, servicioId: 0 },
    ];
  }
}

export async function crearEnvio(
  envioData: AndreaniEnvioRequest
): Promise<AndreaniEnvioResponse> {
  return andreaniFetch<AndreaniEnvioResponse>("/envios", {
    method: "POST",
    body: JSON.stringify(envioData),
  });
}

export async function obtenerEtiquetaPdf(
  numeroAndreani: string
): Promise<string | null> {
  try {
    const res = await fetch(
      `${ANDREANI_API_URL}/envios/${numeroAndreani}/etiquetas?formato=pdf`,
      {
        headers: {
          Authorization: authHeaders(),
          Accept: "application/pdf",
        },
      }
    );

    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  } catch {
    return null;
  }
}

export async function trackearEnvio(
  numeroAndreani: string
): Promise<Record<string, unknown> | null> {
  try {
    return await andreaniFetch<Record<string, unknown>>(
      `/envios/${numeroAndreani}`
    );
  } catch {
    return null;
  }
}

export function estaConfigurado(): boolean {
  return Boolean(ANDREANI_CONTRATO && ANDREANI_USER && ANDREANI_PASS);
}
