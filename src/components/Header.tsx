"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, MapPin, Cpu } from "lucide-react";

export default function Header() {
  const { sucursales, sucursalSeleccionada, setSucursalSeleccionada, carrito } = useCart();

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <header className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-lg sm:text-2xl font-bold tracking-tight text-white transition-colors">
                Tecno<span className="text-primary">Güemes</span>
              </span>
            </Link>
          </div>

          {/* Sucursal Selector & Cart */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            {/* Sucursal Selector */}
            {sucursales.length > 0 && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <select
                  value={sucursalSeleccionada?.id || ""}
                  onChange={(e) => {
                    const selected = sucursales.find((s) => s.id === e.target.value);
                    if (selected) setSucursalSeleccionada(selected);
                  }}
                  className="bg-transparent border-0 text-xs sm:text-sm text-gray-300 font-medium focus:ring-0 focus:outline-none cursor-pointer hover:text-white transition-colors max-w-[140px] sm:max-w-none"
                >
                  {sucursales.map((suc) => (
                    <option
                      key={suc.id}
                      value={suc.id}
                      className="bg-black text-white hover:bg-zinc-900 border-none"
                    >
                      {suc.nombre} ({suc.ciudad})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Admin link */}
            <Link
              href="/admin/login"
              className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
            >
              Admin
            </Link>

            {/* Cart Icon */}
            <Link href="/checkout" className="relative group p-2 rounded-xl hover:bg-zinc-900 transition-colors">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-gray-300 group-hover:text-primary transition-colors" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-lg animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
