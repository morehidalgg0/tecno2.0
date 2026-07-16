import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "un_secreto_muy_seguro_y_largo_de_32_caracteres_minimo";

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
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

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}
