import { prisma } from "@/lib/db";
import { requireAdmin, json, error } from "@/lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;

  if (id === session.userId) {
    return error("You cannot delete your own account");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return error("User not found", 404);

  if (user.role === "ADMIN") {
    return error("Admin accounts cannot be deleted");
  }

  const linkedInspections = await prisma.inspection.count({
    where: {
      OR: [{ assignedToId: id }, { createdById: id }],
    },
  });

  if (linkedInspections > 0) {
    await prisma.user.update({
      where: { id },
      data: { active: false },
    });
    return json({
      ok: true,
      deactivated: true,
      message:
        "Inspector has inspection records and was deactivated instead of deleted",
    });
  }

  await prisma.user.delete({ where: { id } });

  return json({ ok: true, message: "Inspector deleted" });
}
