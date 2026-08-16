"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingBag, Plus, Minus, Loader2, ArrowRight, Truck, MapPin, Tag, X, Check, User } from "lucide-react";

export default function CheckoutPage() {
  const {
    carrito,
    quitarDelCarrito,
    actualizarCantidad,
    sucursalSeleccionada,
    precioTotal,
  } = useCart();

  // Auth / contacto
  const [autenticado, setAutenticado] = useState(false);
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoEmail, setContactoEmail] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Envío
  const [tipoEnvio, setTipoEnvio] = useState<"RETIRO" | "ENVIO">("RETIRO");
  const [domicilio, setDomicilio] = useState("");
  const costoEnvio = tipoEnvio === "ENVIO" ? (precioTotal >= 100000 ? 0 : 5000) : 0;

  // Cupón
  const [cuponCode, setCuponCode] = useState("");
  const [cuponValidando, setCuponValidando] = useState(false);
  const [cuponAplicado, setCuponAplicado] = useState<{ codigo: string; descuento: number; descuentoMonto: number } | null>(null);
  const [cuponError, setCuponError] = useState<string | null>(null);

  const descuentoMonto = cuponAplicado ? cuponAplicado.descuentoMonto : 0;
  const montoFinal = precioTotal - descuentoMonto + costoEnvio;

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/clientes/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.cliente) {
            setAutenticado(true);
            setContactoNombre(data.cliente.nombre || "");
            setContactoEmail(data.cliente.email || "");
            setContactoTelefono(data.cliente.telefono || "");
          }
        }
      } catch {
        // Guest
      }
    }
    checkAuth();
  }, []);

  const handleValidarCupon = async () => {
    if (!cuponCode.trim()) return;
    setCuponValidando(true);
    setCuponError(null);
    setCuponAplicado(null);

    try {
      const res = await fetch("/api/cupones/validar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cuponCode, montoCarrito: precioTotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCuponAplicado(data.cupon);
    } catch (err) {
      setCuponError(err instanceof Error ? err.message : "Error al validar cupón");
    } finally {
      setCuponValidando(false);
    }
  };

  const handlePagar = async () => {
    if (carrito.length === 0) return;

    if (!contactoNombre.trim() || !contactoEmail.trim()) {
      setError("Completá tu nombre y email para continuar.");
      return;
    }

    if (tipoEnvio === "ENVIO" && !domicilio.trim()) {
      setError("Por favor, ingresá tu dirección de envío.");
      return;
    }

    setProcesando(true);
    setError(null);

    try {
      const res = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productos: carrito.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
          })),
          sucursalId: sucursalSeleccionada?.id,
          tipoEnvio,
          domicilio: tipoEnvio === "ENVIO" ? domicilio : null,
          costoEnvio,
          cuponCode: cuponAplicado?.codigo || null,
          descuento: descuentoMonto,
          contactoNombre: contactoNombre.trim(),
          contactoEmail: contactoEmail.trim(),
          contactoTelefono: contactoTelefono.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar el pago");

      const redirectUrl = data.sandboxInitPoint || data.initPoint;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("No se obtuvo la URL de pago de Mercado Pago");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar el pago");
      setProcesando(false);
    }
  };

  const contactoCompleto = contactoNombre.trim() && contactoEmail.trim();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <h1 className="text-3xl font-heading font-extrabold text-white mb-8">Tu Carrito de Compra</h1>

        {carrito.length === 0 ? (
          <div className="text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-950/20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 mb-6 text-gray-500">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <p className="text-gray-400 text-lg mb-6">Tu carrito está vacío.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-orange-500 transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Products List */}
            <div className="lg:col-span-2 space-y-4">
              {carrito.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl border border-zinc-900 bg-zinc-950/40"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <img
                      src={item.imagenUrl}
                      alt={item.nombre}
                      className="object-cover h-full w-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500";
                      }}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">{item.nombre}</h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">${item.precio.toLocaleString("es-AR")}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-2 border border-zinc-800 rounded-lg bg-zinc-950 p-1">
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad - 1)} className="p-1 text-gray-400 hover:text-white transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-white text-xs font-bold w-6 text-center select-none">{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.id, item.cantidad + 1)} className="p-1 text-gray-400 hover:text-white transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => quitarDelCarrito(item.id)} className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-zinc-900/50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between h-fit space-y-5">
              <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-3">
                Resumen de Compra
              </h3>

              {/* Datos de contacto - estilo Tiendanube */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos de contacto</span>
                  {autenticado && (
                    <div className="flex items-center gap-1.5 text-[10px] text-primary">
                      <User className="h-3 w-3" />
                      <span>Sesión activa</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={contactoNombre}
                    onChange={(e) => setContactoNombre(e.target.value)}
                    placeholder="Nombre y apellido"
                    readOnly={autenticado}
                    className={`w-full bg-black border border-zinc-900 rounded-lg py-2.5 px-3 text-xs text-white placeholder:text-gray-600 focus:border-primary focus:outline-none ${
                      autenticado ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <input
                    type="email"
                    value={contactoEmail}
                    onChange={(e) => setContactoEmail(e.target.value)}
                    placeholder="Email"
                    readOnly={autenticado}
                    className={`w-full bg-black border border-zinc-900 rounded-lg py-2.5 px-3 text-xs text-white placeholder:text-gray-600 focus:border-primary focus:outline-none ${
                      autenticado ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                  <input
                    type="tel"
                    value={contactoTelefono}
                    onChange={(e) => setContactoTelefono(e.target.value)}
                    placeholder="Teléfono (opcional)"
                    readOnly={autenticado}
                    className={`w-full bg-black border border-zinc-900 rounded-lg py-2.5 px-3 text-xs text-white placeholder:text-gray-600 focus:border-primary focus:outline-none ${
                      autenticado ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  />
                </div>

                <p className="text-[10px] text-gray-500">
                  Usamos estos datos para enviarte la confirmación de tu compra.
                </p>
              </div>

              {/* Tipo de Envío */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Modalidad de entrega</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTipoEnvio("RETIRO")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      tipoEnvio === "RETIRO"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <MapPin className="h-4 w-4" />
                    <div className="text-left">
                      <span className="block">Retiro</span>
                      <span className="block text-[10px] font-normal text-gray-500">Gratis</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setTipoEnvio("ENVIO")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      tipoEnvio === "ENVIO"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-800 text-gray-400 hover:border-zinc-700"
                    }`}
                  >
                    <Truck className="h-4 w-4" />
                    <div className="text-left">
                      <span className="block">Envío</span>
                      <span className="block text-[10px] font-normal text-gray-500">
                        {precioTotal >= 100000 ? "Gratis" : "$5.000"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Domicilio si envío */}
              {tipoEnvio === "ENVIO" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Dirección de envío
                  </label>
                  <input
                    type="text"
                    value={domicilio}
                    onChange={(e) => setDomicilio(e.target.value)}
                    placeholder="Calle número, piso, depto, localidad"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-2.5 px-3 text-xs text-white focus:border-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    {precioTotal >= 100000
                      ? "Envío gratis en compras superiores a $100.000"
                      : "Costo de envío: $5.000"}
                  </p>
                </div>
              )}

              {/* Sucursal si retiro */}
              {tipoEnvio === "RETIRO" && sucursalSeleccionada && (
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Retiro en sucursal:</span>
                  <span className="text-white font-semibold">{sucursalSeleccionada.nombre}</span>
                </div>
              )}

              {/* Cupón */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  <Tag className="h-3 w-3 inline mr-1" />
                  Cupón de descuento
                </label>
                {cuponAplicado ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-xs font-bold text-green-400">{cuponAplicado.codigo}</span>
                      <span className="text-[10px] text-gray-500">-{cuponAplicado.descuento}%</span>
                    </div>
                    <button onClick={() => { setCuponAplicado(null); setCuponCode(""); }} className="text-gray-500 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cuponCode}
                      onChange={(e) => setCuponCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="flex-1 bg-black border border-zinc-900 rounded-xl py-2.5 px-3 text-xs text-white uppercase focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={handleValidarCupon}
                      disabled={cuponValidando || !cuponCode.trim()}
                      className="px-3 rounded-xl border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {cuponValidando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Aplicar"}
                    </button>
                  </div>
                )}
                {cuponError && <p className="text-[10px] text-red-400 mt-1">{cuponError}</p>}
              </div>

              {/* Totales */}
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="text-white font-semibold">${precioTotal.toLocaleString("es-AR")}</span>
                </div>
                {descuentoMonto > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Descuento ({cuponAplicado?.descuento}%):</span>
                    <span className="font-semibold">-${descuentoMonto.toLocaleString("es-AR")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Envío:</span>
                  <span className={`font-semibold ${costoEnvio === 0 ? "text-green-500" : "text-white"}`}>
                    {costoEnvio === 0 ? "Gratis" : `$${costoEnvio.toLocaleString("es-AR")}`}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-3 text-base">
                  <span className="text-white font-bold">Total:</span>
                  <span className="text-white font-extrabold text-lg">
                    ${Math.max(0, montoFinal).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-950/10 rounded-lg">
                  {error}
                </div>
              )}

              <button
                disabled={procesando || !contactoCompleto}
                onClick={handlePagar}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {procesando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando pago...
                  </>
                ) : (
                  <>
                    Pagar con Mercado Pago <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
