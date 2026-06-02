import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAuth, json, error } from "@/lib/api";

export async function POST(request: Request) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const body = await request.json();
  const currentPassword = body.currentPassword as string;
  const newPassword = body.newPassword as string;

  if (!currentPassword || !newPassword) {
    return error("Current password and new password are required");
  }

  if (newPassword.length < 6) {
    return error("New password must be at least 6 characters");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) return error("User not found", 404);

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return error("Current password is incorrect");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  return json({ ok: true, message: "Password updated successfully" });
}
