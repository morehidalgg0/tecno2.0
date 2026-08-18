"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { esImagenValida } from "@/lib/utils";
import { ArrowLeft, Check, Plus, Minus, Loader2, ShoppingCart } from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  imagenUrl: string;
  specs: Record<string, unknown>;
  stocks: Array<{ sucursalId: string; cantidad: number }>;
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { agregarAlCarrito } = useCart();

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

  if (!producto || !esImagenValida(producto.imagenUrl)) {
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

  const stockTotal = producto.stocks.reduce((sum, s) => sum + s.cantidad, 0);
  const tieneStock = stockTotal > 0;

  const handleAgregar = () => {
    agregarAlCarrito(producto, cantidad);
    setProductoAgregado(true);
    setTimeout(() => setProductoAgregado(false), 2000);
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
            />
            {!tieneStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-white text-sm font-extrabold uppercase bg-red-600/80 px-4 py-1.5 rounded-md tracking-wider border border-red-500">
                  Sin stock
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
              <p className="text-xs text-gray-500 mt-1">
                12x ${Math.round(producto.precio / 12).toLocaleString("es-AR")} sin interés
              </p>
            </div>

            {/* Stock indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit ${
              tieneStock
                ? "bg-green-500/10 text-green-400 ring-1 ring-green-500/20"
                : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tieneStock ? "bg-green-400" : "bg-red-400"}`} />
              {tieneStock ? "Disponible" : "Sin stock"}
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
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAgregar}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                    productoAgregado
                      ? "bg-green-600 text-white"
                      : "bg-primary text-white hover:bg-orange-500 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {productoAgregado ? (
                    <>
                      <Check className="h-4 w-4" /> Agregado
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Agregar al carrito
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Este producto no está disponible en este momento.</p>
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
