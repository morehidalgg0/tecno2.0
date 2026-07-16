import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdminToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Validar token de admin
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener credenciales de Tiendanube desde el body
    const body = await req.json();
    const { accessToken, storeId } = body as { accessToken: string; storeId: string };

    if (!accessToken || !storeId) {
      return NextResponse.json(
        { error: "accessToken y storeId son requeridos" },
        { status: 400 }
      );
    }

    // 3. Consultar la API de Tiendanube
    console.log(`Iniciando importación desde Tiendanube para la tienda ${storeId}`);
    const tnResponse = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/products`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "User-Agent": "TecnoGuemesImporter (admin@tecnoguemes.com)",
        },
      }
    );

    if (!tnResponse.ok) {
      const errorText = await tnResponse.text();
      console.error("Error al consultar API Tiendanube:", errorText);
      return NextResponse.json(
        { error: `Error en la API de Tiendanube: ${tnResponse.statusText}` },
        { status: tnResponse.status }
      );
    }

    const tnProducts = await tnResponse.json();
    if (!Array.isArray(tnProducts)) {
      return NextResponse.json(
        { error: "El formato de respuesta de Tiendanube no es válido" },
        { status: 500 }
      );
    }

    // 4. Obtener las sucursales existentes en nuestra BD para repartir el stock
    const sucursales = await db.sucursal.findMany();
    if (sucursales.length === 0) {
      return NextResponse.json(
        { error: "No hay sucursales registradas en la base de datos para asignar el stock" },
        { status: 400 }
      );
    }

    let creados = 0;
    let actualizados = 0;

    // 5. Procesar los productos masivamente
    for (const tnProd of tnProducts) {
      const nombre = (typeof tnProd.name === "object" ? tnProd.name.es || tnProd.name.en : tnProd.name) || "Producto Tiendanube";
      const marca = tnProd.brand || "Genérico";
      const categoria = (tnProd.categories?.[0]?.name && typeof tnProd.categories[0].name === "object"
        ? tnProd.categories[0].name.es || tnProd.categories[0].name.en
        : null) || "Accesorios";

      // Obtener el precio de la primera variante
      const precio = parseFloat(tnProd.variants?.[0]?.price) || 0;
      
      // Obtener la URL de la primera imagen
      const imagenUrl = tnProd.images?.[0]?.src || "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500";
      
      // Sumar el stock de todas las variantes
      const stockTotal = tnProd.variants?.reduce(
        (sum: number, v: { stock?: string | number | null }) => sum + (v.stock !== null && v.stock !== undefined ? parseInt(String(v.stock)) : 0),
        0
      ) || 0;

      // Metadatos
      const specs = {
        tiendanubeId: tnProd.id,
        sku: tnProd.variants?.[0]?.sku || "",
        origen: "Importador Tiendanube",
      };

      // Intentar buscar si el producto ya fue importado previamente buscando por tiendanubeId en las specs
      // o por coincidencia exacta de nombre
      const productoExistente = await db.producto.findFirst({
        where: {
          OR: [
            { nombre: nombre },
            {
              specs: {
                path: ["tiendanubeId"],
                equals: tnProd.id,
              },
            },
          ],
        },
      });

      let productoId = "";

      if (productoExistente) {
        // Actualizar producto existente
        await db.producto.update({
          where: { id: productoExistente.id },
          data: {
            marca,
            categoria,
            precio,
            imagenUrl,
            specs,
          },
        });
        productoId = productoExistente.id;
        actualizados++;
      } else {
        // Crear nuevo producto
        const nuevoProd = await db.producto.create({
          data: {
            nombre,
            marca,
            categoria,
            precio,
            imagenUrl,
            specs,
            activo: true,
          },
        });
        productoId = nuevoProd.id;
        creados++;
      }

      // Repartir el stock total equitativamente entre nuestras sucursales
      const stockPorSucursal = Math.max(0, Math.floor(stockTotal / sucursales.length));
      
      for (let i = 0; i < sucursales.length; i++) {
        const suc = sucursales[i];
        // Si hay decimales al dividir, le sumamos el residuo a la primera sucursal
        const stockAsignar = i === 0 ? stockPorSucursal + (stockTotal % sucursales.length) : stockPorSucursal;
        
        await db.stock.upsert({
          where: {
            productoId_sucursalId: {
              productoId: productoId,
              sucursalId: suc.id,
            },
          },
          update: {
            cantidad: stockAsignar,
          },
          create: {
            productoId: productoId,
            sucursalId: suc.id,
            cantidad: stockAsignar,
          },
        });
      }
    }

    console.log(`Sincronización finalizada. Creados: ${creados}, Actualizados: ${actualizados}`);

    return NextResponse.json({
      success: true,
      message: `Importación completada con éxito.`,
      creados,
      actualizados,
    });
  } catch (error) {
    console.error("Error al importar desde Tiendanube:", error);
    const errMsg = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "Error al procesar la importación", details: errMsg },
      { status: 500 }
    );
  }
}
