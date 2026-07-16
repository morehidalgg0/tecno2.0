"use client";

import React, { use } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { XCircle } from "lucide-react";

export default function FailurePage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const resolvedParams = use(searchParams);
  const orderId = resolvedParams.orderId;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-md mx-auto px-4 py-20 flex-grow flex flex-col justify-center items-center text-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20 text-red-500">
          <XCircle className="h-12 w-12" />
        </div>

        <h1 className="text-3xl font-heading font-extrabold text-white mb-4">
          Pago Rechazado
        </h1>
        
        <p className="text-gray-400 mb-8">
          No pudimos procesar tu pago. Por favor, intenta nuevamente con otro medio de pago o ponte en contacto con nosotros.
        </p>

        {orderId && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 w-full mb-8 text-left text-xs font-mono space-y-1">
            <span className="text-gray-500">Código de Orden:</span>
            <span className="text-white block font-bold break-all">{orderId}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/checkout"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-orange-500 transition-colors"
          >
            Reintentar Compra
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl border border-zinc-800 text-white font-semibold text-sm hover:bg-zinc-900 transition-colors"
          >
            Volver al Inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
