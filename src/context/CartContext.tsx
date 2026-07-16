"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Sucursal {
  id: string;
  nombre: string;
  ciudad: string;
}

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  cantidad: number;
}

interface CartContextType {
  sucursales: Sucursal[];
  sucursalSeleccionada: Sucursal | null;
  setSucursalSeleccionada: (sucursal: Sucursal) => void;
  carrito: CartItem[];
  agregarAlCarrito: (
    producto: { id: string; nombre: string; precio: number; imagenUrl: string },
    cantidad: number
  ) => void;
  quitarDelCarrito: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  precioTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalSeleccionada, setSucursalSeleccionadaState] = useState<Sucursal | null>(null);
  
  // Inicialización perezosa (lazy initialization) del carrito para evitar setState en useEffect
  const [carrito, setCarrito] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("tg_cart");
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch {
          console.error("Error al cargar carrito");
        }
      }
    }
    return [];
  });

  // 1. Cargar sucursales al inicio
  useEffect(() => {
    async function loadSucursales() {
      try {
        const res = await fetch("/api/sucursales");
        if (res.ok) {
          const data = await res.json();
          setSucursales(data);
          
          // Por defecto seleccionar la primera sucursal si hay
          const savedSuc = localStorage.getItem("tg_sucursal");
          if (savedSuc) {
            const parsed = JSON.parse(savedSuc);
            const exists = data.find((s: Sucursal) => s.id === parsed.id);
            if (exists) {
              setSucursalSeleccionadaState(exists);
              return;
            }
          }
          if (data.length > 0) {
            setSucursalSeleccionadaState(data[0]);
            localStorage.setItem("tg_sucursal", JSON.stringify(data[0]));
          }
        }
      } catch (err) {
        console.error("Error cargando sucursales:", err);
      }
    }
    loadSucursales();
  }, []);

  // Guardar carrito en localStorage
  const saveCart = (newCart: CartItem[]) => {
    setCarrito(newCart);
    localStorage.setItem("tg_cart", JSON.stringify(newCart));
  };

  const setSucursalSeleccionada = (sucursal: Sucursal) => {
    setSucursalSeleccionadaState(sucursal);
    localStorage.setItem("tg_sucursal", JSON.stringify(sucursal));
  };

  const agregarAlCarrito = (
    producto: { id: string; nombre: string; precio: number; imagenUrl: string },
    cantidad: number
  ) => {
    const itemExistente = carrito.find((item) => item.id === producto.id);
    if (itemExistente) {
      const nuevoCarrito = carrito.map((item) =>
        item.id === producto.id
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      );
      saveCart(nuevoCarrito);
    } else {
      const nuevoItem: CartItem = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagenUrl: producto.imagenUrl,
        cantidad,
      };
      saveCart([...carrito, nuevoItem]);
    }
  };

  const quitarDelCarrito = (productoId: string) => {
    const nuevoCarrito = carrito.filter((item) => item.id !== productoId);
    saveCart(nuevoCarrito);
  };

  const actualizarCantidad = (productoId: string, cantidad: number) => {
    if (cantidad <= 0) {
      quitarDelCarrito(productoId);
      return;
    }
    const nuevoCarrito = carrito.map((item) =>
      item.id === productoId ? { ...item, cantidad } : item
    );
    saveCart(nuevoCarrito);
  };

  const vaciarCarrito = () => {
    saveCart([]);
  };

  const precioTotal = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        sucursales,
        sucursalSeleccionada,
        setSucursalSeleccionada,
        carrito,
        agregarAlCarrito,
        quitarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        precioTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
