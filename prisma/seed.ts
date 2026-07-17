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
    { nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Alem", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Constitución", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Puerto", ciudad: "Mar del Plata" },
    { nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" },
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
      nombre: "MacBook Pro 16\" M3 Max - Space Black",
      marca: "Apple",
      categoria: "Computación",
      precio: 3899999,
      imagenUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      specs: {
        procesador: "M3 Max",
        memoria: "48GB",
        almacenamiento: "1TB SSD",
      },
    },
    {
      nombre: "Auriculares Inalámbricos Sony WH-1000XM5 ANC",
      marca: "Sony",
      categoria: "Audio",
      precio: 599999,
      imagenUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
      specs: {
        autonomia: "30 horas",
        cancelacionRuido: "Sí",
        conectividad: "Bluetooth 5.2",
      },
    },
    {
      nombre: "PlayStation 5 Slim 1TB Digital Edition",
      marca: "Sony",
      categoria: "Gaming",
      precio: 1249999,
      imagenUrl: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800&q=80",
      specs: {
        capacidad: "1TB SSD",
        resolucion: "4K HDR",
        edicion: "Digital",
      },
    },
    {
      nombre: "iPhone 15 Pro Max 256GB - Titanium",
      marca: "Apple",
      categoria: "Accesorios",
      precio: 2199999,
      imagenUrl: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80",
      specs: {
        pantalla: "6.7\" Super Retina",
        almacenamiento: "256GB",
        procesador: "A17 Pro",
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
