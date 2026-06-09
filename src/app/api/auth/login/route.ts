import bcrypt from "bcryptjs";
import { prisma, databaseUrlMissing } from "@/lib/db";
import { createToken, setSessionCookie } from "@/lib/auth";
import { json, error } from "@/lib/api";

export async function POST(request: Request) {
  if (databaseUrlMissing) {
    return error(
      "Server misconfiguration: DATABASE_URL is not set. Create a .env file or set DATABASE_URL in the environment.",
      500
    );
  }
  try {
    const raw = await request.text();
    let body: any = null;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch (e) {
      const safeRaw = raw
        ? raw.replace(
            /("password"\s*:\s*")[^"]*(")/i,
            '$1***$2'
          )
        : "";
      return error(
        `Invalid JSON body: ${
          e instanceof Error ? e.message : "Unknown parse error"
        }. Raw (redacted): ${safeRaw.slice(0, 200)}`,
        400
      );
    }

    const rawEmail = (body?.email as string)?.trim().toLowerCase();
    const password = body?.password as string;

    if (!rawEmail || !password) return error("Email and password required");

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email: rawEmail } });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown Prisma error";
      return error(`Prisma error: ${message}`, 500);
    }
    if (!user || !user.active) return error("Invalid credentials", 401);

    let valid;
    try {
      valid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown bcrypt error";
      return error(`Bcrypt error: ${message}`, 500);
    }
    if (!valid) return error("Invalid credentials", 401);

    let token;
    try {
      token = await createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown token error";
      return error(`Token error: ${message}`, 500);
    }

    try {
      await setSessionCookie(token);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Unknown cookie error";
      return error(`Cookie error: ${message}`, 500);
    }

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
