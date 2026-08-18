"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import {
  Truck,
  CreditCard,
  MapPin,
  ShieldCheck,
  Star,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  imagenUrl: string;
  colorFondo?: string;
  specs: Record<string, unknown>;
  stocks: Array<{
    sucursalId: string;
    cantidad: number;
  }>;
}

const CATEGORIAS_TAB = ["Todos", "Computación", "Gaming", "Audio", "Accesorios"];

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agregarAlCarrito } = useCart();

  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [productoAgregadoId, setProductoAgregadoId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const categoriaSeleccionada = searchParams.get("categoria") || "Todos";
  const busqueda = searchParams.get("q") || "";

  const prevCategoriaRef = React.useRef(categoriaSeleccionada);
  const prevBusquedaRef = React.useRef(busqueda);

  useEffect(() => {
    if (
      prevCategoriaRef.current !== categoriaSeleccionada ||
      prevBusquedaRef.current !== busqueda
    ) {
      setPage(1);
      prevCategoriaRef.current = categoriaSeleccionada;
      prevBusquedaRef.current = busqueda;
    }
  }, [categoriaSeleccionada, busqueda]);

  useEffect(() => {
    async function loadProductos() {
      setCargando(true);
      try {
        let url = `/api/productos?page=${page}`;
        const params: string[] = [];
        if (categoriaSeleccionada !== "Todos") {
          params.push(`categoria=${encodeURIComponent(categoriaSeleccionada)}`);
        }
        if (busqueda) {
          params.push(`q=${encodeURIComponent(busqueda)}`);
        }
        if (params.length > 0) {
          url += `&${params.join("&")}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProductos(data);
            setTotalPages(1);
            setTotal(data.length);
          } else {
            setProductos(data.productos || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
          }
        }
      } catch (err) {
        console.error("Error al cargar productos:", err);
      } finally {
        setCargando(false);
      }
    }
    loadProductos();
  }, [categoriaSeleccionada, busqueda, page]);

  const handleAgregarClick = (e: React.MouseEvent, producto: Producto) => {
    e.preventDefault();
    e.stopPropagation();
    agregarAlCarrito(producto, 1);

    setProductoAgregadoId(producto.id);
    setTimeout(() => {
      setProductoAgregadoId(null);
    }, 2000);
  };

  const handleCategoryTabClick = (cat: string) => {
    const params = new URLSearchParams(window.location.search);
    if (cat === "Todos") {
      params.delete("categoria");
    } else {
      params.set("categoria", cat);
    }
    const newUrl = `/?${params.toString()}`;
    window.history.pushState({}, "", newUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const productosFiltrados = productos.filter((prod) => {
    const tieneImagen = Boolean(prod.imagenUrl && prod.imagenUrl.trim() !== "");
    const cumpleBusqueda =
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      prod.marca.toLowerCase().includes(busqueda.toLowerCase());
    return tieneImagen && cumpleBusqueda;
  });

  return (
    <div className="min-h-screen bg-black flex flex-col selection:bg-primary/30 selection:text-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-zinc-950 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_70%_at_70%_50%,rgba(232,141,0,0.06),rgba(0,0,0,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-8 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900 border border-zinc-800/80 px-3.5 py-1 text-xs font-bold text-gray-300">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Tecnología Premium Exclusiva</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold tracking-tight text-white leading-[1.05]">
                Tecnología que <br />
                <span className="italic text-primary font-serif font-medium bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">se siente.</span>
              </h1>

              <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-xl font-sans">
                Redefiní tu set de computación, gaming y audio con dispositivos premium de última generación. Envíos gratis a todo el país y 12 cuotas sin interés con garantía oficial.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#catalog" className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-primary hover:bg-orange-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.02] transition-all cursor-pointer">
                  Ver Productos
                </a>
                <Link href="/mis-pedidos" className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-850 text-white font-bold text-xs uppercase tracking-wider transition-all">
                  <span>Mis Pedidos</span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 text-primary" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              <div className="relative max-w-lg w-full aspect-[4/3] rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950 shadow-2xl">
                <img src="https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&q=80" alt="Sony WH-1000XM5 ANC" className="object-cover w-full h-full opacity-90" />
                <div className="absolute bottom-5 left-5 bg-zinc-950/75 backdrop-blur-md border border-zinc-850 rounded-2xl p-4 pr-6 flex items-center gap-3.5 max-w-xs shadow-xl">
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1">PRODUCTO DESTACADO</span>
                    <span className="block text-xs font-bold text-white leading-tight">Sony WH-1000XM5 ANC</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Row */}
      <section className="w-full bg-[#050505] py-10 border-b border-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-zinc-950 border border-zinc-905 flex items-center justify-center text-primary shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Envíos a todo el país</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Gratis en compras superiores a $100.000</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-zinc-950 border border-zinc-905 flex items-center justify-center text-primary shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Cuotas sin interés</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Hasta 12 cuotas fijas con bancos seleccionados</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-zinc-950 border border-zinc-905 flex items-center justify-center text-primary shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Retiro en local</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Retirá gratis hoy en 9 sucursales de MDP</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-zinc-950 border border-zinc-905 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Garantía oficial</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">Todos los productos cuentan con respaldo oficial</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suggested Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">TE SUGERIMOS</span>
            <h2 className="text-3xl font-heading font-extrabold italic text-white tracking-wide mt-1">EXPLORÁ POR CATEGORÍAS</h2>
          </div>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hidden sm:inline">Deslizá horizontalmente →</span>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-900 scrollbar-track-transparent">
          <div onClick={() => handleCategoryTabClick("Computación")} className="group relative flex-none w-80 aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 cursor-pointer hover:border-zinc-800 transition-all">
            <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80" alt="Computación" className="object-cover w-full h-full opacity-40 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">NOTEBOOKS Y PCs</span>
              <h3 className="text-xl font-heading font-extrabold text-white">COMPUTACIÓN</h3>
              <p className="text-xs text-gray-500 mt-1">Laptops, monitores y periféricos de alto rendimiento.</p>
            </div>
          </div>
          <div onClick={() => handleCategoryTabClick("Gaming")} className="group relative flex-none w-80 aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 cursor-pointer hover:border-zinc-800 transition-all">
            <img src="https://images.unsplash.com/photo-1618609377864-68609b857e90?w=600&q=80" alt="Gaming Gear" className="object-cover w-full h-full opacity-40 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">PARA GAMERS</span>
              <h3 className="text-xl font-heading font-extrabold text-white">GAMING GEAR</h3>
              <p className="text-xs text-gray-500 mt-1">Consolas, teclados mecánicos y joysticks premium.</p>
            </div>
          </div>
          <div onClick={() => handleCategoryTabClick("Audio")} className="group relative flex-none w-80 aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 cursor-pointer hover:border-zinc-800 transition-all">
            <img src="https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&q=80" alt="Audio Profesional" className="object-cover w-full h-full opacity-40 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">SONIDO ENVOLVENTE</span>
              <h3 className="text-xl font-heading font-extrabold text-white">AUDIO PROFESIONAL</h3>
              <p className="text-xs text-gray-500 mt-1">Audífonos inalámbricos y de estudio premium.</p>
            </div>
          </div>
          <div onClick={() => handleCategoryTabClick("Accesorios")} className="group relative flex-none w-80 aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950 cursor-pointer hover:border-zinc-800 transition-all">
            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80" alt="Smartphones" className="object-cover w-full h-full opacity-40 group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest mb-1">CELULARES Y CARGA</span>
              <h3 className="text-xl font-heading font-extrabold text-white">ACCESORIOS</h3>
              <p className="text-xs text-gray-500 mt-1">Dispositivos móviles y cargadores premium.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full border-t border-zinc-900/60 scroll-mt-24 flex-grow">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-gray-500">EXCLUSIVOS DE TECNO GÜEMES</span>
            <h2 className="text-3xl font-heading font-extrabold italic text-white tracking-wide mt-1">TODOS LOS PRODUCTOS</h2>
            {total > 0 && <p className="text-xs text-gray-500 mt-1">{total} producto{total !== 1 ? "s" : ""}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_TAB.map((cat) => {
              const isActive = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
              return (
                <button key={cat} onClick={() => handleCategoryTabClick(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${isActive ? "bg-primary text-white" : "bg-transparent border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700"}`}>
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {busqueda && (
          <div className="mb-6 text-sm text-gray-400">
            Resultados de búsqueda para: &quot;<span className="text-white font-bold">{busqueda}</span>&quot;
          </div>
        )}

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-28 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-gray-500 text-xs tracking-wider uppercase font-bold">Cargando catálogo...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-24 border border-zinc-900 rounded-2xl bg-zinc-950/20">
            <p className="text-gray-400 text-base font-medium">No encontramos productos en esta categoría.</p>
            <button onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.delete("categoria");
                params.delete("q");
                const newUrl = `/?${params.toString()}`;
                window.history.pushState({}, "", newUrl);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="mt-4 inline-flex items-center text-primary text-xs font-bold uppercase tracking-wider hover:underline">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reestablecer filtros
            </button>
          </div>
        ) : (
          <>
            <div className={`grid gap-6 sm:gap-8 ${
              productosFiltrados.length === 1 ? "grid-cols-1 max-w-sm" :
              productosFiltrados.length === 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl" :
              productosFiltrados.length <= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" :
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            }`}>
              {productosFiltrados.map((prod) => {
                const stockTotal = prod.stocks.reduce((sum, s) => sum + s.cantidad, 0);
                const tieneStock = stockTotal > 0;

                return (
                  <div key={prod.id} className="group relative flex flex-col justify-between rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-zinc-800 hover:bg-zinc-950/80 hover:shadow-2xl hover:shadow-orange-500/[0.01]">
                    <Link href={`/productos/${prod.id}`} className="block">
                      <div className={`relative aspect-square w-full overflow-hidden rounded-xl flex items-center justify-center mb-4 p-4 transition-colors ${prod.colorFondo || "bg-zinc-900/60"}`}>
                        <span className="absolute top-2.5 left-2.5 bg-black text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider border border-zinc-900 z-10">{prod.categoria}</span>
                        <img src={prod.imagenUrl} alt={prod.nombre} className="object-cover w-full h-full rounded-xl transform transition-transform duration-500 group-hover:scale-[1.05]"
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500"; }} />
                        {!tieneStock && (
                          <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="text-white text-[10px] font-extrabold uppercase bg-red-650/80 border border-red-500/50 px-3 py-1 rounded-md tracking-wider">Sin stock</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">{prod.marca}</span>
                      <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-2 mt-1 leading-snug min-h-[40px]">{prod.nombre}</h3>
                    </Link>
                    <div className="flex flex-col mt-4 pt-4 border-t border-zinc-900/60">
                      <div className="mb-4">
                        <span className="block text-xl font-extrabold text-white">$ {prod.precio.toLocaleString("es-AR")}</span>
                        <span className="block text-[10px] text-gray-500 font-semibold mt-0.5">12x $ {Math.round(prod.precio / 12).toLocaleString("es-AR")}</span>
                      </div>
                      <button disabled={!tieneStock} onClick={(e) => handleAgregarClick(e, prod)}
                        className={`w-full py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${!tieneStock ? "bg-zinc-900/30 border-zinc-900 text-gray-600 cursor-not-allowed" : productoAgregadoId === prod.id ? "bg-green-600/10 border-green-500 text-green-400" : "bg-transparent border-zinc-800 text-white hover:bg-primary hover:border-primary hover:text-white"}`}>
                        {productoAgregadoId === prod.id ? (<><Check className="h-4 w-4" /><span>AGREGADO</span></>) : (<><ShoppingCart className="h-4 w-4" /><span>AGREGAR</span></>)}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      p === page
                        ? "bg-primary text-white"
                        : "border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg border border-zinc-800 text-gray-400 hover:text-white hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
