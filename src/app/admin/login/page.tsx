"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cpu, Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setCargando(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error de inicio de sesión");
      }

      router.push("/admin/dashboard");
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Credenciales incorrectas";
      setError(errMsg);
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(232,141,0,0.06),rgba(0,0,0,0))]" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-white">
            Tecno<span className="text-primary">Güemes</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest font-bold">
            Panel de Control
          </p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-3xl p-8 border border-zinc-900 bg-zinc-950/40">
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
            <Lock className="h-4 w-4 text-primary" />
            <span className="font-semibold text-white">Ingreso Administrador</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-950/10 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tecnoguemes.com"
                className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Iniciando sesión...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors">
            ← Volver a la Tienda Pública
          </Link>
        </div>

      </div>
    </div>
  );
}
