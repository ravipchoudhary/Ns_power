import { prisma } from "@/lib/db";
import { requireAdmin, json, error } from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;
  const body = await request.json();

  const template = await prisma.formTemplate.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      active: body.active,
    },
  });

  return json({ template });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;

  const inUse = await prisma.inspection.count({
    where: { formTemplateId: id },
  });
  if (inUse > 0) {
    await prisma.formTemplate.update({
      where: { id },
      data: { active: false },
    });
    return json({ ok: true, deactivated: true });
  }

  await prisma.formTemplate.delete({ where: { id } });
  return json({ ok: true });
}
