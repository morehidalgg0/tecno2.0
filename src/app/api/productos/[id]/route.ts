import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";
import { MOCK_PRODUCTOS } from "../route";

// GET /api/productos/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    try {
      const producto = await db.producto.findUnique({
        where: { id },
        include: {
          stocks: {
            include: {
              sucursal: true,
            },
          },
        },
      });

      if (producto) {
        return NextResponse.json(producto);
      }
    } catch {
      console.warn("DB connection failed or empty. Checking mock data...");
    }

    // Buscar en productos Mock
    const mockProd = MOCK_PRODUCTOS.find((p) => p.id === id);
    if (!mockProd) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(mockProd);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Error al obtener el producto" },
      { status: 500 }
    );
  }
}

// PUT /api/productos/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nombre, marca, categoria, precio, imagenUrl, specs, stocks, activo } = body;

    // Verificar si el producto existe
    const productoExistente = await db.producto.findUnique({
      where: { id },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar producto
    await db.producto.update({
      where: { id },
      data: {
        nombre: nombre !== undefined ? nombre : productoExistente.nombre,
        marca: marca !== undefined ? marca : productoExistente.marca,
        categoria: categoria !== undefined ? categoria : productoExistente.categoria,
        precio: precio !== undefined ? parseFloat(precio) : productoExistente.precio,
        imagenUrl: imagenUrl !== undefined ? imagenUrl : productoExistente.imagenUrl,
        specs: specs !== undefined ? specs : productoExistente.specs || {},
        activo: activo !== undefined ? activo : productoExistente.activo,
      },
    });

    // Actualizar stock por sucursal
    if (Array.isArray(stocks)) {
      for (const s of stocks) {
        if (!s.sucursalId) continue;
        await db.stock.upsert({
          where: {
            productoId_sucursalId: {
              productoId: id,
              sucursalId: s.sucursalId,
            },
          },
          update: {
            cantidad: parseInt(s.cantidad) || 0,
          },
          create: {
            productoId: id,
            sucursalId: s.sucursalId,
            cantidad: parseInt(s.cantidad) || 0,
          },
        });
      }
    }

    // Retornar producto con stocks actualizados
    const productoCompleto = await db.producto.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            sucursal: true,
          },
        },
      },
    });

    return NextResponse.json(productoCompleto);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Error al actualizar el producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/productos/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar si el producto existe
    const productoExistente = await db.producto.findUnique({
      where: { id },
    });

    if (!productoExistente) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Al eliminar el producto, Cascade elimina las relaciones de Stock asociadas
    await db.producto.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Producto eliminado con éxito" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}
