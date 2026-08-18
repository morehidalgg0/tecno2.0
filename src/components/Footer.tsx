"use client";

import React from "react";
import Link from "next/link";
import { Lock, Package } from "lucide-react";

export default function Footer() {
  const mediosPago = ["MERCADO PAGO", "VISA", "MASTERCARD", "AMERICAN EXPRESS"];

  return (
    <footer className="w-full bg-[#030303] border-t border-zinc-900 text-gray-400 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-12 border-b border-zinc-900/60">
        {/* Columna 1: Info Comercial */}
        <div className="lg:col-span-4 space-y-6">
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="Güemes"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed font-sans">
            La casa de tecnología de referencia en Mar del Plata. Auriculares, Smartphones, Computación y Gaming Gear premium con el mejor asesoramiento de la Costa Atlántica.
          </p>
          <div className="flex items-center space-x-3">
            <a href="https://instagram.com" target="_blank" rel="noreferrer"
              className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer"
              className="h-9 w-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Columna 2: Mi Cuenta y Medios de Pago */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-white">MI CUENTA</h3>
            <div className="space-y-2">
              <Link href="/mis-pedidos" className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                <Package className="h-3.5 w-3.5" />
                <span>Mis Pedidos</span>
              </Link>
              <Link href="/clientes/login" className="flex items-center space-x-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                <Lock className="h-3.5 w-3.5" />
                <span>Iniciar Sesión</span>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-heading text-xs font-bold uppercase tracking-widest text-white">MEDIOS DE PAGO</h3>
            <div className="flex flex-wrap gap-2">
              {mediosPago.map((mp) => (
                <span key={mp} className="bg-zinc-900/80 text-white border border-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider">
                  {mp}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Columna 3: Admin */}
        <div className="lg:col-span-4 space-y-4">
          <div className="pt-0 space-y-3">
            <Link href="/admin/login" className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-orange-400 transition-colors">
              <Lock className="h-3.5 w-3.5" />
              <span>PANEL ADMINISTRATIVO</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4 text-xs text-gray-600">
        <p className="font-sans">
          © {new Date().getFullYear()} Tecno Güemes. Todos los derechos reservados. Mar del Plata, Argentina.
        </p>
      </div>
    </footer>
  );
}
