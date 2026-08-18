"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { Package, Loader2, Clock, CheckCircle2, XCircle, LogOut, User } from "lucide-react";

interface Orden {
  id: string;
  productos: Array<{ id: string; nombre: string; precio: number; cantidad: number }>;
  monto: number;
  descuento: number;
  costoEnvio: number;
  tipoEnvio: string;
  domicilio: string | null;
  estado: string;
  sucursal?: { nombre: string; ciudad: string } | null;
  cuponCode: string | null;
  clienteNombre: string | null;
  createdAt: string;
}

const estadoConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  APROBADO: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-400 bg-green-500/10 ring-green-500/20",
    label: "Aprobado",
  },
  PENDIENTE: {
    icon: <Clock className="h-4 w-4" />,
    color: "text-yellow-400 bg-yellow-500/10 ring-yellow-500/20",
    label: "Pendiente",
  },
  RECHAZADO: {
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-400 bg-red-500/10 ring-red-500/20",
    label: "Rechazado",
  },
  ENVIADO: {
    icon: <Package className="h-4 w-4" />,
    color: "text-blue-400 bg-blue-500/10 ring-blue-500/20",
    label: "Enviado",
  },
};

export default function MisPedidosPage() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [cliente, setCliente] = useState<{ nombre: string; email: string } | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/clientes/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAutenticado(true);
            setCliente(data.cliente);
            loadOrdenes();
          }
        }
      } catch {
        // no autenticado
      } finally {
        setCargando(false);
      }
    }
    checkAuth();
  }, []);

  async function loadOrdenes() {
    try {
      const res = await fetch("/api/clientes/ordenes");
      if (res.ok) {
        const data = await res.json();
        setOrdenes(data);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  }

  const handleLogout = async () => {
    await fetch("/api/clientes/auth", { method: "DELETE" });
    setAutenticado(false);
    setCliente(null);
  };

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

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <Package className="h-16 w-16 text-gray-600 mx-auto" />
            <h1 className="text-2xl font-heading font-extrabold text-white">Mis Pedidos</h1>
            <p className="text-gray-400 text-sm">Iniciá sesión para ver tu historial de compras</p>
            <Link
              href="/clientes/login"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 transition-colors"
            >
              <User className="h-4 w-4 mr-2" /> Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-heading font-extrabold text-white">Mis Pedidos</h1>
            {cliente && (
              <p className="text-xs text-gray-500 mt-1">
                Hola, {cliente.nombre} ({cliente.email})
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> Cerrar Sesión
          </button>
        </div>

        {ordenes.length === 0 ? (
          <div className="text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-950/20">
            <Package className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">No tenés pedidos aún</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-orange-500 transition-colors"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordenes.map((orden) => {
              const estado = estadoConfig[orden.estado] || estadoConfig.PENDIENTE;
              return (
                <div
                  key={orden.id}
                  className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">
                          #{orden.id.slice(-8).toUpperCase()}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${estado.color}`}
                        >
                          {estado.icon}
                          {estado.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {new Date(orden.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        a las{" "}
                        {new Date(orden.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-white">
                        ${orden.monto.toLocaleString("es-AR")}
                      </span>
                      {orden.descuento > 0 && (
                        <span className="block text-[10px] text-green-500 font-semibold">
                          -${orden.descuento.toLocaleString("es-AR")} descuento
                        </span>
                      )}
                      {orden.costoEnvio > 0 && (
                        <span className="block text-[10px] text-gray-500">
                          +${orden.costoEnvio.toLocaleString("es-AR")} envío
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Envío */}
                  <div className="text-xs text-gray-400 flex flex-wrap gap-4">
                    <span>
                      <span className="text-gray-500">Modalidad: </span>
                      <span className="text-white font-semibold">
                        {orden.tipoEnvio === "ENVIO" ? "Envío a domicilio" : "Retiro en local"}
                      </span>
                    </span>
                    {orden.tipoEnvio === "ENVIO" && orden.domicilio && (
                      <span>
                        <span className="text-gray-500">Dirección: </span>
                        <span className="text-white font-semibold">{orden.domicilio}</span>
                      </span>
                    )}
                    {orden.cuponCode && (
                      <span>
                        <span className="text-gray-500">Cupón: </span>
                        <span className="text-primary font-semibold">{orden.cuponCode}</span>
                      </span>
                    )}
                  </div>

                  {/* Productos */}
                  <div className="border-t border-zinc-900 pt-3 space-y-1.5">
                    {orden.productos.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-300">
                          {p.cantidad}x {p.nombre}
                        </span>
                        <span className="text-white font-semibold">
                          ${(p.precio * p.cantidad).toLocaleString("es-AR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
