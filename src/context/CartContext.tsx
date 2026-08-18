"use client";

import React, { createContext, useContext, useState } from "react";

export interface CartItem {
  id: string;
  nombre: string;
  precio: number;
  imagenUrl: string;
  cantidad: number;
}

interface CartContextType {
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

  const saveCart = (newCart: CartItem[]) => {
    setCarrito(newCart);
    localStorage.setItem("tg_cart", JSON.stringify(newCart));
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
