import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin, json, error } from "@/lib/api";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  const where: any = { active: true };
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true, phone: true },
    orderBy: { name: "asc" },
  });

  return json({ users });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const body = await request.json();
  const name = (body.name as string)?.trim();
  const email = (body.email as string)?.trim().toLowerCase();
  const password = body.password as string;
  const phone = (body.phone as string)?.trim() || null;

  if (!name || !email || !password) {
    return error("Name, email and password are required");
  }

  if (password.length < 6) {
    return error("Password must be at least 6 characters");
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return error("Email already registered", 409);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role: "INSPECTOR",
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: { id: true, name: true, email: true, role: true, phone: true },
  });

  return json({ user }, 201);
}
