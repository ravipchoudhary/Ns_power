import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) return error("Email and password required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) return error("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return error("Invalid credentials", 401);

    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unexpected server error";
    return error(message, 500);
  }
}
