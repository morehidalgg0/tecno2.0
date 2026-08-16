import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be defined in environment variables and be at least 32 characters long."
  );
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken<T = { id: string; email: string }>(token: string): T | null {
  try {
    return jwt.verify(token, JWT_SECRET) as T;
  } catch {
    return null;
  }
}

export async function verifyAdminToken(req?: Request): Promise<{ id: string; email: string } | null> {
  try {
    let token: string | undefined;

    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("admin_token")?.value;
    }

    if (!token) return null;

    return verifyToken<{ id: string; email: string }>(token);
  } catch {
    return null;
  }
}

export async function verifyClienteToken(req?: Request): Promise<{ id: string; email: string } | null> {
  try {
    let token: string | undefined;

    if (req) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get("cliente_token")?.value;
    }

    if (!token) return null;

    const decoded = verifyToken<{ id: string; email: string }>(token);
    return decoded;
  } catch {
    return null;
  }
}
