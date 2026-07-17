import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MOCK_SUCURSALES = [
  { id: "suc-guemes-central", nombre: "Sucursal Güemes Central", ciudad: "Mar del Plata" },
  { id: "suc-guemes-express", nombre: "Sucursal Güemes Express", ciudad: "Mar del Plata" },
  { id: "suc-peatonal", nombre: "Sucursal Peatonal", ciudad: "Mar del Plata" },
  { id: "suc-alem", nombre: "Sucursal Alem", ciudad: "Mar del Plata" },
  { id: "suc-paseo-sur", nombre: "Sucursal Paseo Sur", ciudad: "Mar del Plata" },
  { id: "suc-constitucion", nombre: "Sucursal Constitución", ciudad: "Mar del Plata" },
  { id: "suc-los-gallegos", nombre: "Sucursal Los Gallegos", ciudad: "Mar del Plata" },
  { id: "suc-puerto", nombre: "Sucursal Puerto", ciudad: "Mar del Plata" },
  { id: "suc-shopping-bendu", nombre: "Sucursal Shopping Bendu", ciudad: "Mar del Plata" },
];

export async function GET() {
  try {
    const sucursales = await db.sucursal.findMany({
      orderBy: { nombre: "asc" },
    });
    
    if (sucursales.length === 0) {
      return NextResponse.json(MOCK_SUCURSALES);
    }
    
    return NextResponse.json(sucursales);
  } catch (error) {
    console.warn("Database connection failed or not configured. Falling back to mock sucursales.", error);
    return NextResponse.json(MOCK_SUCURSALES);
  }
}
