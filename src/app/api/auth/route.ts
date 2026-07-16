import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signToken, verifyAdminToken } from "@/lib/auth";
import { cookies } from "next/headers";

// GET /api/auth - Verificar sesión actual
export async function GET(req: NextRequest) {
  try {
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true, email: admin.email });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

// POST /api/auth - Iniciar sesión (Login)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const usuario = await db.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const passwordValida = comparePassword(password, usuario.passwordHash);
    if (!passwordValida) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    // Firmar token JWT
    const token = signToken({ id: usuario.id, email: usuario.email });

    // Guardar token en cookie httpOnly
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 1 día
      path: "/",
    });

    return NextResponse.json({
      success: true,
      usuario: { id: usuario.id, email: usuario.email },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error en el servidor al intentar iniciar sesión" },
      { status: 500 }
    );
  }
}

// DELETE /api/auth - Cerrar sesión (Logout)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return NextResponse.json({ success: true, message: "Sesión cerrada" });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
