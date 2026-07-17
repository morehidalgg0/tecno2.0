"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { ArrowLeft, Check, Plus, Minus, Loader2, Info, MapPin } from "lucide-react";

interface StockInfo {
  sucursalId: string;
  cantidad: number;
  sucursal: {
    nombre: string;
    ciudad: string;
  };
}

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  imagenUrl: string;
  specs: Record<string, unknown>;
  stocks: StockInfo[];
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  // Resolve params promise in Next.js 15/16
  const { id } = use(params);
  
  const router = useRouter();
  const { sucursalSeleccionada, agregarAlCarrito } = useCart();
  
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [productoAgregado, setProductoAgregado] = useState(false);

  useEffect(() => {
    async function loadProducto() {
      try {
        const res = await fetch(`/api/productos/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProducto(data);
        } else {
          console.error("Error al obtener el producto");
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
      } finally {
        setCargando(false);
      }
    }
    loadProducto();
  }, [id]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center space-y-4">
          <p className="text-gray-400">Producto no encontrado</p>
          <Link href="/" className="text-primary hover:underline">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  // Buscar stock en la sucursal seleccionada
  const stockEnSucursalSeleccionada =
    producto.stocks.find((s) => s.sucursalId === sucursalSeleccionada?.id)?.cantidad || 0;
  
  const tieneStock = stockEnSucursalSeleccionada > 0;

  const handleAgregar = () => {
    if (cantidad > stockEnSucursalSeleccionada) return;
    agregarAlCarrito(producto, cantidad);
    setProductoAgregado(true);
    setTimeout(() => {
      setProductoAgregado(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver atrás
        </button>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16">
          {/* Product Image */}
          <div className="relative aspect-square w-full rounded-2xl bg-zinc-950 border border-zinc-900 overflow-hidden flex items-center justify-center p-4">
            <img
              src={producto.imagenUrl}
              alt={producto.nombre}
              className="object-cover w-full h-full rounded-xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500";
              }}
            />
            {!tieneStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-white text-sm font-extrabold uppercase bg-red-600/80 px-4 py-1.5 rounded-md tracking-wider border border-red-500">
                  Sin stock en tu sucursal
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col space-y-6 sm:space-y-8">
            <div>
              <span className="text-xs sm:text-sm text-primary font-bold uppercase tracking-wider">
                {producto.marca}
              </span>
              <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-white mt-1 leading-tight">
                {producto.nombre}
              </h1>
              <p className="text-xs text-gray-500 mt-2">Categoría: {producto.categoria}</p>
            </div>

            {/* Price */}
            <div>
              <p className="text-sm text-gray-500 font-medium">Precio final</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                ${producto.precio.toLocaleString("es-AR")}
              </p>
            </div>

            {/* Branch Stock Display */}
            <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold text-white">Stock en Sucursales:</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {producto.stocks.map((stock) => {
                  const isSelected = stock.sucursalId === sucursalSeleccionada?.id;
                  return (
                    <div
                      key={stock.sucursalId}
                      className={`text-xs flex items-center justify-between py-0.5 ${
                        isSelected ? "text-white font-bold" : "text-gray-400"
                      }`}
                    >
                      <span>
                        {stock.sucursal.nombre} {isSelected && <span className="text-primary font-bold">(Actual)</span>}
                      </span>
                      <span
                        className={
                          stock.cantidad > 0 ? "text-green-500 font-medium" : "text-red-500"
                        }
                      >
                        {stock.cantidad > 0 ? `${stock.cantidad} unid.` : "Sin stock"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector & Cart button */}
            {tieneStock ? (
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Quantity */}
                <div className="flex items-center justify-between border border-zinc-800 rounded-xl bg-zinc-950 px-4 py-2 w-32 shrink-0">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-white font-bold text-sm select-none">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(Math.min(stockEnSucursalSeleccionada, cantidad + 1))}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAgregar}
                  className={`flex-1 inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    productoAgregado
                      ? "bg-green-600 text-white"
                      : "bg-primary text-white hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {productoAgregado ? (
                    <>
                      <Check className="h-4 w-4 mr-2" /> Agregado
                    </>
                  ) : (
                    "Agregar al carrito"
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-start p-4 rounded-xl border border-red-500/20 bg-red-950/10 text-xs text-red-400">
                <Info className="h-4 w-4 mr-2 shrink-0 text-red-500" />
                <p>
                  No contamos con stock de este producto en la sucursal seleccionada. Podés cambiar de sucursal arriba para ver disponibilidad o retirar en otra tienda.
                </p>
              </div>
            )}

            {/* Specs Table */}
            {producto.specs && typeof producto.specs === "object" && Object.keys(producto.specs).length > 0 && (
              <div className="border-t border-zinc-900 pt-6">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Especificaciones Técnicas
                </h3>
                <div className="rounded-xl border border-zinc-900 overflow-hidden bg-zinc-950/20">
                  <table className="min-w-full divide-y divide-zinc-900 text-sm">
                    <tbody className="divide-y divide-zinc-900">
                      {Object.entries(producto.specs).map(([key, val]) => (
                        <tr key={key} className="hover:bg-zinc-900/10">
                          <td className="px-4 py-3 text-xs font-semibold text-gray-500 capitalize bg-zinc-950/40 w-1/3">
                            {key}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-300">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
