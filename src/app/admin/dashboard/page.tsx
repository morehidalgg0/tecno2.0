"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Cpu, LogOut, Package, ShoppingBag, RefreshCw, Plus, Edit, Trash2, 
  Check, X, Loader2, Save, Info, AlertTriangle, Eye, EyeOff
} from "lucide-react";

interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
}

interface Stock {
  sucursalId: string;
  cantidad: number;
  sucursal?: Sucursal;
}

interface Producto {
  id: string;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  imagenUrl: string;
  specs: Record<string, unknown>;
  activo: boolean;
  stocks: Stock[];
}

interface Orden {
  id: string;
  productos: Array<{ id: string; nombre: string; precio: number; cantidad: number }>;
  monto: number;
  estado: string;
  mercadoPagoId: string | null;
  sucursal?: Sucursal;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  // Auth state
  const [autenticado, setAutenticado] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // Tab navigation
  const [tabActiva, setTabActiva] = useState<"ordenes" | "productos" | "tiendanube">("ordenes");

  // Data states
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  // Tiendanube credentials form
  const [tnStoreId, setTnStoreId] = useState("");
  const [tnAccessToken, setTnAccessToken] = useState("");
  const [importandoTn, setImportandoTn] = useState(false);
  const [importRes, setImportRes] = useState<string | null>(null);

  // Product CRUD Modal states
  const [modalAbierto, setModalAbierto] = useState(false);
  const [prodEditando, setProdEditando] = useState<Producto | null>(null);
  
  // Form fields
  const [formNombre, setFormNombre] = useState("");
  const [formMarca, setFormMarca] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formPrecio, setFormPrecio] = useState("");
  const [formImagenUrl, setFormImagenUrl] = useState("");
  const [formActivo, setFormActivo] = useState(true);
  const [formSpecs, setFormSpecs] = useState("{}");
  const [formStocks, setFormStocks] = useState<{ [sucursalId: string]: string }>({});

  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  // 1. Validar autenticación
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setAutenticado(true);
            loadInitialData();
          } else {
            router.push("/admin/login");
          }
        } else {
          router.push("/admin/login");
        }
      } catch (err) {
        router.push("/admin/login");
      } finally {
        setCargandoAuth(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Cargar datos iniciales
  async function loadInitialData() {
    setCargandoDatos(true);
    try {
      // Cargar Sucursales
      const resSuc = await fetch("/api/sucursales");
      let listSuc: Sucursal[] = [];
      if (resSuc.ok) {
        listSuc = await resSuc.json();
        setSucursales(listSuc);
      }

      // Cargar Órdenes
      const resOrd = await fetch("/api/ordenes");
      if (resOrd.ok) {
        const dataOrd = await resOrd.json();
        setOrdenes(dataOrd);
      }

      // Cargar Productos (con flag admin=true para ver inactivos)
      const resProd = await fetch("/api/productos?admin=true");
      if (resProd.ok) {
        const dataProd = await resProd.json();
        setProductos(dataProd);
      }

      // Inicializar stock inputs
      const initialStockState: { [id: string]: string } = {};
      listSuc.forEach((s) => {
        initialStockState[s.id] = "0";
      });
      setFormStocks(initialStockState);

    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setCargandoDatos(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/admin/login");
    } catch (err) {
      console.error("Error al cerrar sesión");
    }
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setProdEditando(null);
    setFormNombre("");
    setFormMarca("");
    setFormCategoria("Auriculares");
    setFormPrecio("");
    setFormImagenUrl("");
    setFormActivo(true);
    setFormSpecs(JSON.stringify({
      autonomia: "20 horas",
      conectividad: "Bluetooth 5.0"
    }, null, 2));

    const resetStocks: { [id: string]: string } = {};
    sucursales.forEach((s) => {
      resetStocks[s.id] = "0";
    });
    setFormStocks(resetStocks);
    
    setErrorModal(null);
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (prod: Producto) => {
    setProdEditando(prod);
    setFormNombre(prod.nombre);
    setFormMarca(prod.marca);
    setFormCategoria(prod.categoria);
    setFormPrecio(prod.precio.toString());
    setFormImagenUrl(prod.imagenUrl);
    setFormActivo(prod.activo);
    setFormSpecs(JSON.stringify(prod.specs || {}, null, 2));

    const editStocks: { [id: string]: string } = {};
    sucursales.forEach((s) => {
      const match = prod.stocks.find((st) => st.sucursalId === s.id);
      editStocks[s.id] = match ? match.cantidad.toString() : "0";
    });
    setFormStocks(editStocks);

    setErrorModal(null);
    setModalAbierto(true);
  };

  // Guardar producto (Crear o Editar)
  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formMarca || !formPrecio || !formImagenUrl) {
      setErrorModal("Faltan campos obligatorios");
      return;
    }

    // Validar especificaciones JSON
    let parsedSpecs = {};
    try {
      parsedSpecs = JSON.parse(formSpecs);
    } catch (e) {
      setErrorModal("Las Especificaciones deben ser un formato JSON válido");
      return;
    }

    setGuardandoProducto(true);
    setErrorModal(null);

    // Formatear stock array para API
    const stockPayload = Object.entries(formStocks).map(([sucursalId, cantidad]) => ({
      sucursalId,
      cantidad: parseInt(cantidad) || 0,
    }));

    const payload = {
      nombre: formNombre,
      marca: formMarca,
      categoria: formCategoria,
      precio: parseFloat(formPrecio),
      imagenUrl: formImagenUrl,
      specs: parsedSpecs,
      activo: formActivo,
      stocks: stockPayload,
    };

    try {
      const url = prodEditando ? `/api/productos/${prodEditando.id}` : "/api/productos";
      const method = prodEditando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el producto");
      }

      setModalAbierto(false);
      loadInitialData(); // Recargar datos
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error al conectar con el servidor";
      setErrorModal(errMsg);
    } finally {
      setGuardandoProducto(false);
    }
  };

  // Eliminar producto
  const handleEliminarProducto = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const res = await fetch(`/api/productos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadInitialData();
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar producto");
      }
    } catch (err) {
      alert("Error de conexión");
    }
  };

  // Importar desde Tiendanube
  const handleImportarTiendanube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tnStoreId || !tnAccessToken) return;

    setImportandoTn(true);
    setImportRes(null);

    try {
      const res = await fetch("/api/tiendanube/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: tnStoreId,
          accessToken: tnAccessToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setImportRes(`Sincronización exitosa. Creados: ${data.creados}, Actualizados: ${data.actualizados}`);
        loadInitialData();
      } else {
        setImportRes(`Error: ${data.error}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido";
      setImportRes(`Error de conexión: ${errMsg}`);
    } finally {
      setImportandoTn(false);
    }
  };

  if (cargandoAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!autenticado) return null;

  return (
    <div className="min-h-screen bg-black text-foreground flex flex-col">
      {/* Header Admin */}
      <header className="glass border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Cpu className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-white">
                TecnoGüemes <span className="text-xs text-primary font-mono ml-1 px-1.5 py-0.5 rounded bg-orange-500/10">Admin</span>
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-zinc-900 pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setTabActiva("ordenes")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 inline-flex items-center ${
              tabActiva === "ordenes"
                ? "bg-zinc-900 text-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Órdenes y Ventas ({ordenes.length})
          </button>
          <button
            onClick={() => setTabActiva("productos")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 inline-flex items-center ${
              tabActiva === "productos"
                ? "bg-zinc-900 text-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Package className="h-4 w-4 mr-2" />
            Productos ({productos.length})
          </button>
          <button
            onClick={() => setTabActiva("tiendanube")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 inline-flex items-center ${
              tabActiva === "tiendanube"
                ? "bg-zinc-900 text-primary"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Importar Tiendanube
          </button>
        </div>

        {/* Tab Contents */}
        {cargandoDatos ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-gray-400 text-sm">Actualizando datos...</p>
          </div>
        ) : (
          <div>
            {/* TABS 1: ORDENES */}
            {tabActiva === "ordenes" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-heading font-extrabold text-white">Listado de Órdenes</h2>
                  <button
                    onClick={loadInitialData}
                    className="p-2 text-gray-400 hover:text-white bg-zinc-950 border border-zinc-900 rounded-xl"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {ordenes.length === 0 ? (
                  <div className="text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-gray-500">
                    Aún no se han registrado órdenes en el sistema.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-900 overflow-hidden bg-zinc-950/20">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-900 text-left text-sm">
                        <thead className="bg-zinc-950/80 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Orden ID</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4">Sucursal Retiro</th>
                            <th className="px-6 py-4">Productos</th>
                            <th className="px-6 py-4">Monto Total</th>
                            <th className="px-6 py-4">Medio Pago ID</th>
                            <th className="px-6 py-4">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-gray-300">
                          {ordenes.map((ord) => (
                            <tr key={ord.id} className="hover:bg-zinc-900/10">
                              <td className="px-6 py-4 font-mono text-xs">{ord.id}</td>
                              <td className="px-6 py-4 text-xs">
                                {new Date(ord.createdAt).toLocaleDateString("es-AR")} {new Date(ord.createdAt).toLocaleTimeString("es-AR", { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-6 py-4 text-xs font-semibold text-white">
                                {ord.sucursal ? ord.sucursal.nombre : "No especificada"}
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <ul className="list-disc list-inside space-y-0.5 max-w-xs">
                                  {Array.isArray(ord.productos) &&
                                  ord.productos.map((p: { id: string; nombre: string; precio: number; cantidad: number }, idx: number) => (
                                    <li key={idx} className="truncate">
                                      {p.cantidad}x {p.nombre}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                              <td className="px-6 py-4 font-bold text-white">
                                ${ord.monto.toLocaleString("es-AR")}
                              </td>
                              <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                {ord.mercadoPagoId || "—"}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    ord.estado === "APROBADO"
                                      ? "bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20"
                                      : ord.estado === "PENDIENTE"
                                      ? "bg-yellow-500/10 text-yellow-400 ring-1 ring-inset ring-yellow-500/20"
                                      : "bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20"
                                  }`}
                                >
                                  {ord.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABS 2: PRODUCTOS */}
            {tabActiva === "productos" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-heading font-extrabold text-white">Catálogo de Productos</h2>
                  <button
                    onClick={abrirModalCrear}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Nuevo Producto
                  </button>
                </div>

                {productos.length === 0 ? (
                  <div className="text-center py-20 border border-zinc-900 rounded-2xl bg-zinc-950/20 text-gray-500">
                    No hay productos cargados.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-900 overflow-hidden bg-zinc-950/20">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-zinc-900 text-left text-sm">
                        <thead className="bg-zinc-950/80 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4">Imagen</th>
                            <th className="px-6 py-4">Nombre / Marca</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Precio</th>
                            <th className="px-6 py-4">Stock por Sucursal</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-gray-300">
                          {productos.map((prod) => (
                            <tr key={prod.id} className="hover:bg-zinc-900/10">
                              <td className="px-6 py-4 shrink-0">
                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                  <img
                                    src={prod.imagenUrl}
                                    alt={prod.nombre}
                                    className="object-cover h-full w-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500";
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-semibold text-white truncate max-w-xs">{prod.nombre}</div>
                                <div className="text-xs text-gray-500 font-mono">{prod.marca}</div>
                              </td>
                              <td className="px-6 py-4 text-xs text-gray-450">{prod.categoria}</td>
                              <td className="px-6 py-4 font-bold text-white">
                                ${prod.precio.toLocaleString("es-AR")}
                              </td>
                              <td className="px-6 py-4 text-xs space-y-0.5">
                                {prod.stocks.map((st) => (
                                  <div key={st.sucursalId}>
                                    <span className="text-gray-500">{st.sucursal?.nombre || "Sucursal"}: </span>
                                    <span className={`font-semibold ${st.cantidad > 0 ? "text-white" : "text-red-500"}`}>
                                      {st.cantidad} unid.
                                    </span>
                                  </div>
                                ))}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    prod.activo
                                      ? "bg-green-500/10 text-green-400 ring-1 ring-inset ring-green-500/20"
                                      : "bg-zinc-800 text-gray-500"
                                  }`}
                                >
                                  {prod.activo ? (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" /> Activo
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" /> Inactivo
                                    </>
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2 shrink-0">
                                <button
                                  onClick={() => abrirModalEditar(prod)}
                                  className="inline-flex items-center p-2 rounded-lg bg-zinc-900 text-gray-300 hover:text-primary transition-colors border border-zinc-800"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEliminarProducto(prod.id)}
                                  className="inline-flex items-center p-2 rounded-lg bg-zinc-900 text-gray-300 hover:text-red-500 transition-colors border border-zinc-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABS 3: TIENDANUBE IMPORT */}
            {tabActiva === "tiendanube" && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <h2 className="text-xl font-heading font-extrabold text-white">Sincronización con Tiendanube</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Cargá tus credenciales de API para importar masivamente el catálogo y stock de Tiendanube y repartirlo equitativamente entre las sucursales locales.
                  </p>
                </div>

                <div className="glass rounded-3xl p-8 border border-zinc-900 bg-zinc-950/40 space-y-6">
                  <form onSubmit={handleImportarTiendanube} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Store ID
                      </label>
                      <input
                        type="text"
                        required
                        value={tnStoreId}
                        onChange={(e) => setTnStoreId(e.target.value)}
                        placeholder="1234567"
                        className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        Access Token
                      </label>
                      <input
                        type="password"
                        required
                        value={tnAccessToken}
                        onChange={(e) => setTnAccessToken(e.target.value)}
                        placeholder="APP_USR-..."
                        className="w-full bg-black border border-zinc-900 rounded-xl py-3 px-4 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </div>

                    {importRes && (
                      <div className={`p-4 rounded-xl border text-xs ${
                        importRes.startsWith("Error")
                          ? "border-red-500/20 bg-red-950/10 text-red-400"
                          : "border-green-500/20 bg-green-950/10 text-green-400"
                      }`}>
                        {importRes}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={importandoTn || !tnStoreId || !tnAccessToken}
                      className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importandoTn ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando catálogo...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" /> Disparar Sincronización
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* PRODUCT CRUD MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-900 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto my-8">
            {/* Close Button */}
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-heading font-extrabold text-white">
              {prodEditando ? "Editar Producto" : "Nuevo Producto"}
            </h3>

            <form onSubmit={handleGuardarProducto} className="space-y-6">
              {errorModal && (
                <div className="p-3 text-xs text-red-400 border border-red-500/20 bg-red-950/10 rounded-lg">
                  {errorModal}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Sony WH-1000XM4"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    placeholder="Sony"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                  >
                    <option value="Auriculares">Auriculares</option>
                    <option value="Cables">Cables</option>
                    <option value="Cargadores">Cargadores</option>
                    <option value="Computación">Computación</option>
                    <option value="Parlantes">Parlantes</option>
                    <option value="Smartwatch">Smartwatch</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Adaptadores">Adaptadores</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    placeholder="350000"
                    className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  URL de Imagen (Unsplash, etc.) *
                </label>
                <input
                  type="url"
                  required
                  value={formImagenUrl}
                  onChange={(e) => setFormImagenUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="activo"
                  type="checkbox"
                  checked={formActivo}
                  onChange={(e) => setFormActivo(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-900 bg-black text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="activo" className="ml-2 block text-sm text-gray-300 font-semibold">
                  Activo para la venta (visible en catálogo)
                </label>
              </div>

              {/* Stocks by Branch */}
              <div className="border-t border-zinc-900 pt-4">
                <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                  Stock por Sucursal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {sucursales.map((suc) => (
                    <div key={suc.id} className="p-3 bg-zinc-900/30 rounded-xl border border-zinc-900">
                      <label className="block text-xs text-gray-400 font-semibold truncate mb-1">
                        {suc.nombre}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formStocks[suc.id] || "0"}
                        onChange={(e) =>
                          setFormStocks({
                            ...formStocks,
                            [suc.id]: e.target.value,
                          })
                        }
                        className="w-full bg-black border border-zinc-900 rounded-lg py-1.5 px-2 text-sm text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="border-t border-zinc-900 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Especificaciones Técnicas (JSON)
                  </label>
                  <span className="text-[10px] text-gray-500 font-medium">Formato clave-valor JSON</span>
                </div>
                <textarea
                  value={formSpecs}
                  onChange={(e) => setFormSpecs(e.target.value)}
                  rows={4}
                  className="w-full bg-black border border-zinc-900 rounded-xl py-2 px-3 text-xs font-mono text-gray-300 focus:border-primary focus:outline-none"
                  placeholder='{\n  "autonomia": "30 horas",\n  "bateria": "4000mAh"\n}'
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 border-t border-zinc-900 pt-6">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl border border-zinc-900 text-white hover:bg-zinc-900 transition-colors text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoProducto}
                  className="flex-grow inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {guardandoProducto ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" /> Guardar Producto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
