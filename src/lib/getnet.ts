import { createHash, timingSafeEqual } from "crypto";

// Web Checkout de Getnet. Ver "Manual Web Checkout Getnet (UAT y Prod)".
const BASE_URLS = {
  uat: "https://api.pre.globalgetnet.com",
  prod: "https://api.globalgetnet.com",
} as const;

const REQUEST_TIMEOUT_MS = 15000;

function baseUrl(): string {
  // Por defecto UAT: nunca se cobra de verdad sin pedir explícitamente producción.
  return process.env.GETNET_ENV === "prod" ? BASE_URLS.prod : BASE_URLS.uat;
}

export function getnetConfigurado(): boolean {
  return Boolean(process.env.GETNET_CLIENT_ID && process.env.GETNET_CLIENT_SECRET);
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function obtenerToken(forzar = false): Promise<string> {
  if (!forzar && tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const res = await fetch(`${baseUrl()}/authentication/oauth2/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.GETNET_CLIENT_ID || "",
      client_secret: process.env.GETNET_CLIENT_SECRET || "",
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`Getnet auth error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) {
    throw new Error("Getnet auth: la respuesta no incluye access_token");
  }

  // Margen de 60s para no usar un token a punto de vencer
  const expiresIn = data.expires_in ?? 3600;
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(expiresIn - 60, 0) * 1000,
  };
  return tokenCache.token;
}

export interface CrearPagoParams {
  orderId: string;
  nombreCompleto: string;
  email: string;
  monto: number;
}

export interface PaymentIntent {
  paymentIntentId: string;
  checkoutUrl: string;
}

// Getnet pide first_name y last_name; en el checkout tenemos un único campo "Nombre y apellido".
function separarNombre(nombreCompleto: string): { firstName: string; lastName: string } {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length === 1) return { firstName: partes[0], lastName: "-" };
  const lastName = partes.pop() as string;
  return { firstName: partes.join(" "), lastName };
}

export async function crearPaymentIntent(params: CrearPagoParams): Promise<PaymentIntent> {
  const { firstName, lastName } = separarNombre(params.nombreCompleto);
  const body = JSON.stringify({
    order_id: params.orderId,
    customer: { first_name: firstName, last_name: lastName, email: params.email },
    payment: { currency: "ARS", amount: params.monto },
  });

  const enviar = async (token: string) =>
    fetch(`${baseUrl()}/digital-checkout/v1/payment-intent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let res = await enviar(await obtenerToken());
  if (res.status === 401) {
    // El token pudo haber sido revocado antes de vencer: pedimos uno nuevo y reintentamos una vez
    res = await enviar(await obtenerToken(true));
  }

  if (!res.ok) {
    throw new Error(`Getnet payment-intent error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as { payment_intent_id?: string; checkout_url?: string };
  if (!data.payment_intent_id || !data.checkout_url) {
    throw new Error("Getnet payment-intent: la respuesta no incluye payment_intent_id o checkout_url");
  }

  return { paymentIntentId: data.payment_intent_id, checkoutUrl: data.checkout_url };
}

// El manual solo documenta APPROVED. Los estados de rechazo son los esperables; cualquier otro
// valor se ignora (la orden queda PENDIENTE) y se loguea para poder ajustarlo tras las pruebas en UAT.
const ESTADOS_RECHAZO = new Set([
  "DENIED",
  "REJECTED",
  "DECLINED",
  "CANCELED",
  "CANCELLED",
  "ERROR",
  "FAILED",
  "EXPIRED",
]);

export function clasificarEstado(status: string): "APROBADO" | "RECHAZADO" | "DESCONOCIDO" {
  const normalizado = status.trim().toUpperCase();
  if (normalizado === "APPROVED") return "APROBADO";
  if (ESTADOS_RECHAZO.has(normalizado)) return "RECHAZADO";
  return "DESCONOCIDO";
}

// Getnet no documenta firma en el webhook y la URL de callback es fija (se carga en el portal),
// así que se autentica con un secreto en la query string: /api/getnet/webhook?token=...
export function webhookTokenValido(token: string | null): boolean {
  const esperado = process.env.GETNET_WEBHOOK_SECRET;
  if (!esperado || !token) return false;
  const a = createHash("sha256").update(token).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}
