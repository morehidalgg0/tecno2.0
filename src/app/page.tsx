"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { useCart } from "@/context/CartContext";
import { Search, SlidersHorizontal, Plus, Check, Loader2, RefreshCw } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  imagenUrl: string;
  specs: Record<string, unknown>;
  stocks: Array<{
    sucursalId: string;
    cantidad: number;
  }>;
}

const CATEGORIAS = [
  "Todos",
  "Auriculares",
  "Cables",
  "Cargadores",
  "Computación",
  "Parlantes",
  "Smartwatch",
  "Accesorios",
  "Adaptadores",
];

export default function Home() {
  const { sucursalSeleccionada, agregarAlCarrito } = useCart();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  // Filtros
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todos");
  const [marcaBusqueda, setMarcaBusqueda] = useState("");
  const [precioMaximo, setPrecioMaximo] = useState<number>(500000);
  const [busqueda, setBusqueda] = useState("");
  const [marcasDisponibles, setMarcasDisponibles] = useState<string[]>([]);
  const [mostrarFiltrosMobile, setMostrarFiltrosMobile] = useState(false);
  const [productoAgregadoId, setProductoAgregadoId] = useState<string | null>(null);

  // Cargar productos
  useEffect(() => {
    async function loadProductos() {
      setCargando(true);
      try {
        let url = `/api/productos`;
        
        const params: string[] = [];
        if (categoriaSeleccionada !== "Todos") {
          params.push(`categoria=${encodeURIComponent(categoriaSeleccionada)}`);
        }
        if (sucursalSeleccionada) {
          params.push(`sucursalId=${sucursalSeleccionada.id}`);
        }
        if (params.length > 0) {
          url += `?${params.join("&")}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data: Producto[] = await res.json();
          setProductos(data);

          // Extraer marcas únicas
          const brands = Array.from(new Set(data.map((p) => p.marca)));
          setMarcasDisponibles(brands);
        }
      } catch (err) {
        console.error("Error al cargar productos:", err);
      } finally {
        setCargando(false);
      }
    }
    loadProductos();
  }, [categoriaSeleccionada, sucursalSeleccionada]);

  const handleAgregarClick = (e: React.MouseEvent, producto: Producto) => {
    e.preventDefault();
    e.stopPropagation();
    agregarAlCarrito(producto, 1);
    
    // Animación de check de agregado
    setProductoAgregadoId(producto.id);
    setTimeout(() => {
      setProductoAgregadoId(null);
    }, 2000);
  };

  // Filtrar productos del lado del cliente para respuestas de búsqueda y precio fluidos
  const productosFiltrados = productos.filter((prod) => {
    const cumpleBusqueda = prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          prod.marca.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleMarca = marcaBusqueda === "" || prod.marca.toLowerCase() === marcaBusqueda.toLowerCase();
    const cumplePrecio = prod.precio <= precioMaximo;
    return cumpleBusqueda && cumpleMarca && cumplePrecio;
  });

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border bg-gradient-to-b from-zinc-950 to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(232,141,0,0.12),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="inline-flex items-center rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-orange-500/20 mb-6">
            Multisucursal Argentina
          </span>
          <h1 className="text-4xl sm:text-6xl font-heading font-extrabold tracking-tight text-white mb-6 max-w-3xl mx-auto leading-tight">
            Tecnología premium. <br />
            <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
              Al alcance de tu mano.
            </span>
          </h1>
          <p className="text-base sm:text-xl text-gray-400 max-w-xl mx-auto mb-2 font-medium">
            Seleccioná tu sucursal para ver disponibilidad inmediata.
          </p>
          {sucursalSeleccionada && (
            <p className="text-sm text-primary font-bold">
              Comprando en: {sucursalSeleccionada.nombre} ({sucursalSeleccionada.ciudad})
            </p>
          )}
        </div>
      </section>

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categorías</h3>
              <div className="flex flex-col space-y-1">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`text-left px-3 py-2 rounded-lg text-sm transition-all font-medium ${
                      categoriaSeleccionada === cat
                        ? "bg-zinc-900 text-primary font-semibold"
                        : "text-gray-400 hover:text-white hover:bg-zinc-950"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Marca</h3>
              <select
                value={marcaBusqueda}
                onChange={(e) => setMarcaBusqueda(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-gray-300 py-2 px-3 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Todas las marcas</option>
                {marcasDisponibles.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Precio Máximo</h3>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="700000"
                  step="5000"
                  value={precioMaximo}
                  onChange={(e) => setPrecioMaximo(parseInt(e.target.value))}
                  className="w-full accent-primary bg-zinc-900 rounded-lg appearance-none h-1 cursor-pointer"
                />
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>$0</span>
                  <span className="text-primary font-bold">${precioMaximo.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Catalog & Search */}
          <div className="flex-1 space-y-6">
            
            {/* Search Bar & Mobile Filter Trigger */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar auriculares, cargadores, smartwatch..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              
              <button
                onClick={() => setMostrarFiltrosMobile(!mostrarFiltrosMobile)}
                className="lg:hidden inline-flex items-center justify-center px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-900 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtros
              </button>
            </div>

            {/* Mobile Filters Dropdown */}
            {mostrarFiltrosMobile && (
              <div className="lg:hidden p-6 rounded-xl border border-zinc-800 bg-zinc-950 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categorías</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIAS.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                          categoriaSeleccionada === cat
                            ? "bg-primary text-white"
                            : "bg-zinc-900 text-gray-400 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Marca</h4>
                    <select
                      value={marcaBusqueda}
                      onChange={(e) => setMarcaBusqueda(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-gray-300 py-2 px-3 focus:outline-none focus:border-primary"
                    >
                      <option value="">Todas</option>
                      {marcasDisponibles.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Precio Max</h4>
                    <input
                      type="range"
                      min="0"
                      max="700000"
                      step="5000"
                      value={precioMaximo}
                      onChange={(e) => setPrecioMaximo(parseInt(e.target.value))}
                      className="w-full accent-primary h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-right text-[10px] text-primary font-bold mt-1">
                      ${precioMaximo.toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Products Grid */}
            {cargando ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-gray-400 text-sm">Cargando catálogo...</p>
              </div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-24 border border-zinc-900 rounded-2xl bg-zinc-950/30">
                <p className="text-gray-400 text-lg">No encontramos productos con los filtros seleccionados.</p>
                <button
                  onClick={() => {
                    setCategoriaSeleccionada("Todos");
                    setMarcaBusqueda("");
                    setPrecioMaximo(500000);
                    setBusqueda("");
                  }}
                  className="mt-4 inline-flex items-center text-primary text-sm font-semibold hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reestablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {productosFiltrados.map((prod) => {
                  const stockInfo = prod.stocks.find(
                    (s) => s.sucursalId === sucursalSeleccionada?.id
                  );
                  const stock = stockInfo?.cantidad || 0;
                  const tieneStock = stock > 0;

                  return (
                    <div
                      key={prod.id}
                      className="group relative flex flex-col justify-between rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-800 hover:bg-zinc-950/80 hover:shadow-2xl hover:shadow-orange-500/[0.02]"
                    >
                      <Link href={`/productos/${prod.id}`}>
                        {/* Image wrapper */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-900/60 flex items-center justify-center mb-4">
                          <img
                            src={prod.imagenUrl}
                            alt={prod.nombre}
                            className="object-cover w-full h-full transform transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500";
                            }}
                          />
                          {!tieneStock && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                              <span className="text-white text-xs font-extrabold uppercase bg-red-600/80 px-3 py-1 rounded-md tracking-wider border border-red-500">
                                Sin stock
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Title & Brand */}
                        <div className="mb-2">
                          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">{prod.marca}</span>
                          <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors line-clamp-1 mt-0.5">
                            {prod.nombre}
                          </h3>
                        </div>

                        {/* Specs badges (take first 2 specs) */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {prod.specs && typeof prod.specs === "object" && 
                            Object.entries(prod.specs).slice(0, 2).map(([key, value]) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-gray-400 capitalize"
                              >
                                {key}: {String(value)}
                              </span>
                            ))
                          }
                        </div>
                      </Link>

                      {/* Price & Action */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-900/60">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500 font-medium">Precio</span>
                          <span className="text-lg font-bold text-white">${prod.precio.toLocaleString("es-AR")}</span>
                        </div>

                        <button
                          disabled={!tieneStock}
                          onClick={(e) => handleAgregarClick(e, prod)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                            !tieneStock
                              ? "bg-zinc-900/40 border-zinc-900 text-gray-600 cursor-not-allowed"
                              : productoAgregadoId === prod.id
                              ? "bg-green-600/10 border-green-500 text-green-400"
                              : "bg-zinc-950 border-zinc-800 text-white hover:bg-primary hover:border-primary hover:scale-105"
                          }`}
                        >
                          {productoAgregadoId === prod.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-zinc-950/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Tecno Güemes. Todos los derechos reservados.</p>
          <p className="mt-1">Pilar - Mar del Plata - CABA, Argentina.</p>
        </div>
      </footer>
    </div>
  );
}
