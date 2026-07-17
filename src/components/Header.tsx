"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, MapPin, Search } from "lucide-react";

function HeaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { sucursalSeleccionada, setSucursalSeleccionada, sucursales, carrito } = useCart();

  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  // Sync search query in state with URL parameter
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  const activeCategory = searchParams.get("categoria") || "Todos";

  const categories = [
    { name: "Computación", slug: "Computación" },
    { name: "Gaming", slug: "Gaming" },
    { name: "Audio", slug: "Audio" },
    { name: "Accesorios", slug: "Accesorios" },
  ];

  const handleCategoryClick = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("categoria", slug);
    params.delete("q"); // Clear search query when changing categories
    router.push(`/?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) {
      params.set("q", searchQuery);
    } else {
      params.delete("q");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    // Live search if on home page
    if (pathname === "/") {
      const params = new URLSearchParams(window.location.search);
      if (val) {
        params.set("q", val);
      } else {
        params.delete("q");
      }
      router.replace(`/?${params.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-md border-b border-zinc-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo (Left) */}
          <div className="flex items-center shrink-0">
            <Link href="/">
              <div className="bg-black border border-zinc-850 px-3 py-1.5 rounded-lg flex flex-col items-center hover:border-zinc-700 transition-colors">
                <span className="font-heading text-[10px] font-semibold tracking-[0.25em] text-white leading-none">TECNO</span>
                <span className="font-heading text-sm font-extrabold text-primary tracking-wider leading-none mt-0.5">GÜEMES</span>
              </div>
            </Link>
          </div>

          {/* Navigation Tabs (Center) - Hidden on Mobile */}
          <nav className="hidden md:flex items-center bg-zinc-900/60 border border-zinc-850 rounded-full px-1.5 py-1">
            {categories.map((cat) => {
              const isActive = activeCategory.toLowerCase() === cat.slug.toLowerCase();
              return (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? "bg-zinc-800 text-white shadow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>

          {/* Controls (Right) */}
          <div className="flex items-center gap-3 sm:gap-4 flex-grow md:flex-grow-0 justify-end">
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative max-w-[160px] sm:max-w-xs w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-zinc-900/90 border border-zinc-850 rounded-full py-2 pl-9 pr-4 text-xs text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
              />
            </form>

            {/* Sucursal Selector (Pill Dropdown) */}
            {sucursales.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/95 border border-zinc-850 rounded-full px-3 py-2 hover:border-zinc-700 transition-colors">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <select
                  value={sucursalSeleccionada?.id || ""}
                  onChange={(e) => {
                    const selected = sucursales.find((s) => s.id === e.target.value);
                    if (selected) setSucursalSeleccionada(selected);
                  }}
                  className="bg-transparent border-0 p-0 pr-6 text-[10px] font-bold tracking-wider text-gray-300 focus:ring-0 focus:outline-none cursor-pointer hover:text-white transition-colors"
                  style={{ backgroundImage: "none", appearance: "none" }} // Clean select arrows
                >
                  {sucursales.map((suc) => (
                    <option key={suc.id} value={suc.id} className="bg-black text-white">
                      {suc.nombre.replace("Sucursal ", "")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cart Icon */}
            <Link
              href="/checkout"
              className="relative p-2.5 rounded-full bg-zinc-900/90 border border-zinc-850 hover:bg-zinc-800 text-gray-300 hover:text-primary transition-all shrink-0"
            >
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold text-white shadow-lg border border-black animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>

          </div>

        </div>

        {/* Mobile Navigation - Visible only on mobile below header */}
        <div className="md:hidden flex items-center justify-center gap-2 pb-4 overflow-x-auto">
          {categories.map((cat) => {
            const isActive = activeCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-zinc-800 text-white"
                    : "text-gray-400 hover:text-white bg-zinc-900/40"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}

export default function Header() {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 bg-black border-b border-zinc-900/80 h-20 w-full animate-pulse" />
    }>
      <HeaderContent />
    </Suspense>
  );
}
