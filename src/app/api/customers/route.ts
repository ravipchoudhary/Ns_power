import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/api";
import { json } from "@/lib/api";

export async function GET() {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const customers = await prisma.customer.findMany({
    include: { properties: true },
    orderBy: { name: "asc" },
  });

  return json({ customers });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const body = await request.json();
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      phone: body.phone,
      email: body.email,
      address: body.address,
    },
  });

  return json({ customer }, 201);
}
