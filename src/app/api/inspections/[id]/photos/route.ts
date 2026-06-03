import path from "path";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api";
import { json, error } from "@/lib/api";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (session instanceof Response) return session;
  const { id } = await params;

  const inspection = await prisma.inspection.findUnique({ where: { id } });
  if (!inspection) return error("Not found", 404);

  const formData = await request.formData();
  const tag = (formData.get("tag") as string) || "GENERAL";
  const raw = formData.get("file");

  let dataUrl: string;
  if (typeof raw === "string" && raw.startsWith("data:image")) {
    dataUrl = raw;
  } else if (raw instanceof File) {
    const file = raw;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = path.extname(file.name) || ".jpg";
    const mime =
      file.type ||
      (ext.toLowerCase() === ".png"
        ? "image/png"
        : ext.toLowerCase() === ".webp"
          ? "image/webp"
          : "image/jpeg");
    dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
  } else {
    return error("No file uploaded");
  }

  const photo = await prisma.inspectionPhoto.create({
    data: {
      inspectionId: id,
      url: dataUrl,
      tag: tag as "BEFORE" | "AFTER" | "GENERAL",
      sortOrder: await prisma.inspectionPhoto.count({ where: { inspectionId: id } }),
    },
  });

  return json({ photo }, 201);
}

export async function DELETE(request: Request) {
  const session = await requireAuth();
  if (session instanceof Response) return session;

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) return error("photoId required");

  await prisma.inspectionPhoto.delete({ where: { id: photoId } });
  return json({ ok: true });
}
