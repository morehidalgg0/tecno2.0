import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, comparePassword, signToken, verifyClienteToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET /api/clientes/auth - Verificar sesión actual
export async function GET(req: NextRequest) {
  try {
    const cliente = await verifyClienteToken(req);
    if (!cliente) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const usuario = await db.cliente.findUnique({
      where: { id: cliente.id },
      select: { id: true, nombre: true, email: true, telefono: true, createdAt: true },
    });

    if (!usuario) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, cliente: usuario });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// POST /api/clientes/auth - Login de cliente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, action } = body;

    // Registro
    if (action === "register") {
      const { nombre, telefono } = body;

      if (!email || !password || !nombre) {
        return NextResponse.json(
          { error: "Nombre, email y contraseña son requeridos" },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 6 caracteres" },
          { status: 400 }
        );
      }

      const existente = await db.cliente.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existente) {
        return NextResponse.json(
          { error: "Ya existe una cuenta con este email" },
          { status: 409 }
        );
      }

      const cliente = await db.cliente.create({
        data: {
          nombre: nombre.trim(),
          email: email.toLowerCase().trim(),
          passwordHash: hashPassword(password),
          telefono: telefono || null,
        },
      });

      const token = signToken({ id: cliente.id, email: cliente.email });

      const cookieStore = await cookies();
      cookieStore.set("cliente_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 días
        path: "/",
      });

      return NextResponse.json({
        success: true,
        cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
      });
    }

    // Login
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const cliente = await db.cliente.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!cliente) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const passwordValida = comparePassword(password, cliente.passwordHash);
    if (!passwordValida) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const token = signToken({ id: cliente.id, email: cliente.email });

    const cookieStore = await cookies();
    cookieStore.set("cliente_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return NextResponse.json({
      success: true,
      cliente: { id: cliente.id, nombre: cliente.nombre, email: cliente.email },
    });
  } catch (error) {
    console.error("Error en auth cliente:", error);
    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/clientes/auth - Logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("cliente_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
