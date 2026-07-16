import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Admin
  const email = "admin@tecnoguemes.com";
  
  // Clean existing data for a fresh seed if needed
  await prisma.stock.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.sucursal.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.orden.deleteMany({});

  const passwordHash = bcrypt.hashSync("admin123", 10);
  await prisma.usuario.create({
    data: {
      email,
      passwordHash,
    },
  });
  console.log("Admin user created (admin@tecnoguemes.com / admin123)");

  // 2. Create Sucursales
  const sucursalesData = [
    { nombre: "Sucursal Güemes", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Centro", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Palermo", ciudad: "CABA" },
  ];

  const sucursales = [];
  for (const s of sucursalesData) {
    const created = await prisma.sucursal.create({
      data: s,
    });
    sucursales.push(created);
    console.log(`Sucursal created: ${s.nombre}`);
  }

  // 3. Create Products with Stock
  const productosData = [
    {
      nombre: "Auriculares Inalámbricos Sony WH-1000XM4",
      marca: "Sony",
      categoria: "Auriculares",
      precio: 350000,
      imagenUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      specs: {
        autonomia: "30 horas",
        cancelacionRuido: "Sí",
        conectividad: "Bluetooth 5.0",
      },
    },
    {
      nombre: "Cargador Rápido Anker Nano II 45W USB-C",
      marca: "Anker",
      categoria: "Cargadores",
      precio: 38000,
      imagenUrl: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      specs: {
        potencia: "45W",
        puertos: "1x USB-C",
        tecnologia: "GaN II",
      },
    },
    {
      nombre: "Smartwatch Samsung Galaxy Watch 6",
      marca: "Samsung",
      categoria: "Smartwatch",
      precio: 290000,
      imagenUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      specs: {
        pantalla: "Super AMOLED 1.4\"",
        sistema: "WearOS",
        bateria: "Hasta 40 horas",
      },
    },
    {
      nombre: "Parlante Portátil JBL Flip 6",
      marca: "JBL",
      categoria: "Parlantes",
      precio: 160000,
      imagenUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
      specs: {
        potencia: "20W RMS",
        resistenciaAgua: "IP67",
        autonomia: "12 horas",
      },
    },
  ];

  for (const p of productosData) {
    const producto = await prisma.producto.create({
      data: {
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        precio: p.precio,
        imagenUrl: p.imagenUrl,
        specs: p.specs,
        activo: true,
      },
    });

    console.log(`Producto creado: ${p.nombre}`);

    // Crear stock aleatorio para cada sucursal
    for (const suc of sucursales) {
      const cantidad = Math.floor(Math.random() * 15) + 2; // entre 2 y 16 unidades
      await prisma.stock.create({
        data: {
          productoId: producto.id,
          sucursalId: suc.id,
          cantidad,
        },
      });
      console.log(`  Stock creado: ${cantidad} unidades en ${suc.nombre}`);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
