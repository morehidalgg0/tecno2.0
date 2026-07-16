"use client";

import React, { useEffect, use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { CheckCircle2 } from "lucide-react";

export default function SuccessPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { vaciarCarrito } = useCart();
  const resolvedParams = use(searchParams);
  const orderId = resolvedParams.orderId;

  // Vaciar el carrito ya que la compra fue exitosa
  useEffect(() => {
    vaciarCarrito();
  }, [vaciarCarrito]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-md mx-auto px-4 py-20 flex-grow flex flex-col justify-center items-center text-center">
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mb-8 border border-green-500/20 text-green-500">
          <CheckCircle2 className="h-12 w-12 animate-bounce" />
        </div>

        <h1 className="text-3xl font-heading font-extrabold text-white mb-4">
          ¡Pago Aprobado!
        </h1>
        
        <p className="text-gray-400 mb-6">
          Muchas gracias por tu compra. Tu orden ha sido recibida y se está procesando.
        </p>

        {orderId && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 w-full mb-8 text-left text-xs font-mono space-y-1">
            <span className="text-gray-500">Código de Orden:</span>
            <span className="text-white block font-bold break-all">{orderId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-orange-500 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
