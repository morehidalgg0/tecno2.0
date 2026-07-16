import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MOCK_SUCURSALES = [
  { id: "suc-guemes", nombre: "Sucursal Güemes", ciudad: "Mar del Plata" },
  { id: "suc-centro", nombre: "Sucursal Centro", ciudad: "Mar del Plata" },
  { id: "suc-palermo", nombre: "Sucursal Palermo", ciudad: "CABA" },
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
