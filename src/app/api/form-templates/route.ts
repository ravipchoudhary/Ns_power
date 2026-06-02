import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin, json, error } from "@/lib/api";

export async function GET() {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const templates = await prisma.formTemplate.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return json({ templates });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const body = await request.json();
  const name = (body.name as string)?.trim();
  const formKind = body.formKind as "FIRE_PUMP" | "FSR";
  const description = (body.description as string)?.trim() || null;

  if (!name || !formKind) {
    return error("Name and form type are required");
  }

  if (!["FIRE_PUMP", "FSR"].includes(formKind)) {
    return error("Form type must be FIRE_PUMP or FSR");
  }

  const slug =
    (body.slug as string)?.trim() ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const existing = await prisma.formTemplate.findUnique({ where: { slug } });
  if (existing) return error("A form with this slug already exists", 409);

  const template = await prisma.formTemplate.create({
    data: { slug, name, description, formKind },
  });

  return json({ template }, 201);
}
