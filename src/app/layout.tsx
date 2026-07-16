import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tecno Güemes | Tecnología y Accesorios Premium",
  description: "Tienda premium de tecnología, accesorios, auriculares, computación y más. Retirá en nuestras sucursales físicas o pagá online de forma segura con Mercado Pago.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-black text-foreground antialiased min-h-screen flex flex-col`}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
