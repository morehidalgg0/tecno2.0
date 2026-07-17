import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Datos Mock de respaldo si no hay base de datos conectada o configurada
export const MOCK_PRODUCTOS = [
  {
    id: "prod-1",
    nombre: "MacBook Pro 16\" M3 Max - Space Black",
    marca: "Apple",
    categoria: "Computación",
    precio: 3899999,
    imagenUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    colorFondo: "bg-indigo-950/30",
    specs: {
      procesador: "M3 Max",
      memoria: "48GB",
      almacenamiento: "1TB SSD",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes-central", cantidad: 5, sucursal: { nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-guemes-express", cantidad: 3, sucursal: { nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-peatonal", cantidad: 4, sucursal: { nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-alem", cantidad: 2, sucursal: { nombre: "Sucursal Alem", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-paseo-sur", cantidad: 6, sucursal: { nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-constitucion", cantidad: 3, sucursal: { nombre: "Sucursal Constitución", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-los-gallegos", cantidad: 5, sucursal: { nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-puerto", cantidad: 2, sucursal: { nombre: "Sucursal Puerto", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-shopping-bendu", cantidad: 4, sucursal: { nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    nombre: "Auriculares Inalámbricos Sony WH-1000XM5 ANC",
    marca: "Sony",
    categoria: "Audio",
    precio: 599999,
    imagenUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
    colorFondo: "bg-amber-500/10",
    specs: {
      autonomia: "30 horas",
      cancelacionRuido: "Sí",
      conectividad: "Bluetooth 5.2",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes-central", cantidad: 10, sucursal: { nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-guemes-express", cantidad: 6, sucursal: { nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-peatonal", cantidad: 8, sucursal: { nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-alem", cantidad: 5, sucursal: { nombre: "Sucursal Alem", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-paseo-sur", cantidad: 12, sucursal: { nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-constitucion", cantidad: 7, sucursal: { nombre: "Sucursal Constitución", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-los-gallegos", cantidad: 9, sucursal: { nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-puerto", cantidad: 4, sucursal: { nombre: "Sucursal Puerto", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-shopping-bendu", cantidad: 8, sucursal: { nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    nombre: "PlayStation 5 Slim 1TB Digital Edition",
    marca: "Sony",
    categoria: "Gaming",
    precio: 1249999,
    imagenUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80",
    colorFondo: "bg-zinc-900/60",
    specs: {
      capacidad: "1TB SSD",
      resolucion: "4K HDR",
      edicion: "Digital",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes-central", cantidad: 8, sucursal: { nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-guemes-express", cantidad: 4, sucursal: { nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-peatonal", cantidad: 5, sucursal: { nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-alem", cantidad: 3, sucursal: { nombre: "Sucursal Alem", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-paseo-sur", cantidad: 7, sucursal: { nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-constitucion", cantidad: 5, sucursal: { nombre: "Sucursal Constitución", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-los-gallegos", cantidad: 6, sucursal: { nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-puerto", cantidad: 2, sucursal: { nombre: "Sucursal Puerto", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-shopping-bendu", cantidad: 5, sucursal: { nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-4",
    nombre: "iPhone 15 Pro Max 256GB - Titanium",
    marca: "Apple",
    categoria: "Accesorios",
    precio: 2199999,
    imagenUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
    colorFondo: "bg-neutral-900/80",
    specs: {
      pantalla: "6.7\" Super Retina",
      almacenamiento: "256GB",
      procesador: "A17 Pro",
    },
    activo: true,
    stocks: [
      { sucursalId: "suc-guemes-central", cantidad: 4, sucursal: { nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-guemes-express", cantidad: 2, sucursal: { nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-peatonal", cantidad: 3, sucursal: { nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-alem", cantidad: 1, sucursal: { nombre: "Sucursal Alem", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-paseo-sur", cantidad: 5, sucursal: { nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-constitucion", cantidad: 2, sucursal: { nombre: "Sucursal Constitución", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-los-gallegos", cantidad: 4, sucursal: { nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-puerto", cantidad: 1, sucursal: { nombre: "Sucursal Puerto", ciudad: "Mar del Plata" } },
      { sucursalId: "suc-shopping-bendu", cantidad: 3, sucursal: { nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" } },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
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
