import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Datos Mock de respaldo si no hay base de datos conectada o configurada
export const MOCK_PRODUCTOS = [
  {
    id: "prod-1",
    nombre: "Auriculares Inalámbricos Sony WH-1000XM4",
    marca: "Sony",
    categoria: "Auriculares",
    precio: 350000,
    imagenUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60",
    specs: {
      autonomia: "30 horas",
      cancelacionRuido: "Sí",
      conectividad: "Bluetooth 5.0",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 12, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 5, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 8, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    nombre: "Cargador Rápido Anker Nano II 45W USB-C",
    marca: "Anker",
    categoria: "Cargadores",
    precio: 38000,
    imagenUrl: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&auto=format&fit=crop&q=60",
    specs: {
      potencia: "45W",
      puertos: "1x USB-C",
      tecnologia: "GaN II",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 20, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 15, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 30, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    nombre: "Smartwatch Samsung Galaxy Watch 6",
    marca: "Samsung",
    categoria: "Smartwatch",
    precio: 290000,
    imagenUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60",
    specs: {
      pantalla: "Super AMOLED 1.4\"",
      sistema: "WearOS",
      bateria: "Hasta 40 horas",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 0, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 8, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 10, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    nombre: "Parlante Portátil JBL Flip 6",
    marca: "JBL",
    categoria: "Parlantes",
    precio: 160000,
    imagenUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60",
    specs: {
      potencia: "20W RMS",
      resistenciaAgua: "IP67",
      autonomia: "12 horas",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 15, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 10, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 0, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    nombre: "Teclado Mecánico Logitech G Pro X",
    marca: "Logitech",
    categoria: "Computación",
    precio: 220000,
    imagenUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=60",
    specs: {
      switches: "GX Blue Clicky",
      formato: "Tenkeyless (80%)",
      iluminacion: "RGB Lightsync",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 7, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 4, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 9, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    nombre: "Mouse Gamer Razer DeathAdder V3 Pro",
    marca: "Razer",
    categoria: "Computación",
    precio: 185000,
    imagenUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=60",
    specs: {
      peso: "63 gramos",
      sensor: "Focus Pro 30K",
      autonomia: "Hasta 90 horas",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes", cantidad: 5, sucursal: { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-centro", cantidad: 0, sucursal: { nombre: "Sucursal Centro", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-palermo", cantidad: 6, sucursal: { nombre: "Sucursal Palermo", ciudad: "CABA" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function filtrarProductosMock(
  categoria: string | null,
  marca: string | null,
  precioMaxStr: string | null,
  sucursalId: string | null,
  isAdminView: boolean
) {
  let list = [...MOCK_PRODUCTOS];

  if (!isAdminView) {
    list = list.filter((p) => p.activo);
  }

  if (categoria && categoria !== "Todos") {
    list = list.filter((p) => p.categoria.toLowerCase() === categoria.toLowerCase());
  }

  if (marca) {
    list = list.filter((p) => p.marca.toLowerCase() === marca.toLowerCase());
  }

  if (precioMaxStr) {
    const max = parseFloat(precioMaxStr);
    if (!isNaN(max)) {
      list = list.filter((p) => p.precio <= max);
    }
  }

  if (sucursalId && !isAdminView) {
    list = list.filter((p) => {
      const stockInfo = p.stocks.find((s) => s.sucursalId === sucursalId);
      return stockInfo && stockInfo.cantidad > 0;
    });
  }

  return list;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const marca = searchParams.get("marca");
  const precioMaxStr = searchParams.get("precioMax");
  const sucursalId = searchParams.get("sucursalId");
  const isAdminView = searchParams.get("admin") === "true";

  try {
    if (isAdminView) {
      const admin = await verifyAdminToken(req);
      if (!admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    const where: Prisma.ProductoWhereInput = {};
    if (!isAdminView) {
      where.activo = true;
    }
    if (categoria) {
      where.categoria = { equals: categoria, mode: "insensitive" };
    }
    if (marca) {
      where.marca = { equals: marca, mode: "insensitive" };
    }
    if (precioMaxStr) {
      const precioMax = parseFloat(precioMaxStr);
      if (!isNaN(precioMax)) {
        where.precio = { lte: precioMax };
      }
    }
    if (sucursalId && !isAdminView) {
      where.stocks = {
        some: {
          sucursalId: sucursalId,
          cantidad: { gt: 0 },
        },
      };
    }

    const productos = await db.producto.findMany({
      where,
      include: {
        stocks: {
          include: {
            sucursal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (productos.length === 0) {
      return NextResponse.json(
        filtrarProductosMock(categoria, marca, precioMaxStr, sucursalId, isAdminView)
      );
    }

    return NextResponse.json(productos);
  } catch (error) {
    console.warn("DB connection failed. Falling back to mock products.", error);
    return NextResponse.json(
      filtrarProductosMock(categoria, marca, precioMaxStr, sucursalId, isAdminView)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { nombre, marca, categoria, precio, imagenUrl, specs, stocks, activo } = body;

    if (!nombre || !marca || !categoria || precio === undefined || !imagenUrl) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const nuevoProducto = await db.producto.create({
      data: {
        nombre,
        marca,
        categoria,
        precio: parseFloat(precio),
        imagenUrl,
        specs: specs || {},
        activo: activo !== undefined ? activo : true,
        stocks: {
          create: Array.isArray(stocks)
            ? (stocks as Array<{ sucursalId: string; cantidad: string | number }>).map((s) => ({
                sucursalId: s.sucursalId,
                cantidad: typeof s.cantidad === "string" ? parseInt(s.cantidad) || 0 : s.cantidad,
              }))
            : [],
        },
      },
      include: {
        stocks: true,
      },
    });

    return NextResponse.json(nuevoProducto, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Error al crear el producto" },
      { status: 500 }
    );
  }
}
