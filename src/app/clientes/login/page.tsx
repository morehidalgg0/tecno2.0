"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { User, Loader2, Eye, EyeOff } from "lucide-react";

export default function ClienteLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isRegister && !nombre) return;

    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/clientes/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nombre: isRegister ? nombre : undefined,
          telefono: isRegister ? telefono : undefined,
          action: isRegister ? "register" : "login",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error de autenticación");
      }

      router.push(isRegister ? "/mis-pedidos" : "/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(232,141,0,0.04),rgba(0,0,0,0))]" />

        <div className="w-full max-w-md relative z-10 space-y-6">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-white">
              {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {isRegister
                ? "Registrate para seguir tus pedidos"
                : "Accedé a tu historial de compras"}
            </p>
          </div>

          <div className="glass rounded-3xl p-8 border border-zinc-900 bg-zinc-950/40">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-950/10 rounded-lg">
                  {error}
                </div>
              )}

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="223 456-7890"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 pr-10 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isRegister && (
                  <p className="text-[10px] text-gray-500 mt-1">Mínimo 6 caracteres</p>
                )}
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {cargando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Procesando...
                  </>
                ) : isRegister ? (
                  "Crear Cuenta"
                ) : (
                  "Iniciar Sesión"
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-900 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-gray-400 hover:text-primary transition-colors"
              >
                {isRegister
                  ? "¿Ya tenés cuenta? Iniciá sesión"
                  : "¿No tenés cuenta? Registrate"}
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
              ← Volver a la Tienda
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
