"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingBag, Plus, Minus, Loader2, ArrowRight } from "lucide-react";

export default function CheckoutPage() {
  const {
    carrito,
    quitarDelCarrito,
    actualizarCantidad,
    sucursalSeleccionada,
    precioTotal,
  } = useCart();

  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePagar = async () => {
    if (!sucursalSeleccionada) {
      setError("Por favor, selecciona una sucursal en el encabezado.");
      return;
    }
    if (carrito.length === 0) return;

    setProcesando(true);
    setError(null);

    try {
      // Llamar al endpoint local para generar la preferencia de Mercado Pago
      const res = await fetch("/api/mercadopago/preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productos: carrito.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
          })),
          sucursalId: sucursalSeleccionada.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al procesar el pago");
      }

      // Redirigir a Mercado Pago
      // Preferimos sandboxInitPoint para pruebas y initPoint como fallback para producción
      const redirectUrl = data.sandboxInitPoint || data.initPoint;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error("No se obtuvo la URL de pago de Mercado Pago");
      }
    } catch (err) {
      console.error("Error al procesar checkout:", err);
      const errMsg = err instanceof Error ? err.message : "Error al iniciar el pago con Mercado Pago";
      setError(errMsg);
      setProcesando(false);
    }
  };

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
                  {/* Photo */}
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

                  {/* Details */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                      {item.nombre}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
                      ${item.precio.toLocaleString("es-AR")}
                    </p>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-2 border border-zinc-850 rounded-lg bg-zinc-950 p-1">
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-white text-xs font-bold w-6 text-center select-none">
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => quitarDelCarrito(item.id)}
                      className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-zinc-900/50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/60 flex flex-col justify-between h-fit space-y-6">
              <h3 className="text-base font-bold text-white uppercase tracking-wider border-b border-zinc-900 pb-3">
                Resumen de Compra
              </h3>

              <div className="space-y-4 text-sm text-gray-400">
                {sucursalSeleccionada && (
                  <div className="flex justify-between">
                    <span>Retiro en sucursal:</span>
                    <span className="text-white font-semibold">
                      {sucursalSeleccionada.nombre}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Envío / Retiro:</span>
                  <span className="text-green-500 font-semibold">Gratis</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-4 text-base">
                  <span className="text-white font-bold">Total:</span>
                  <span className="text-white font-extrabold text-lg">
                    ${precioTotal.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-950/10 rounded-lg">
                  {error}
                </div>
              )}

              <button
                disabled={procesando}
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
