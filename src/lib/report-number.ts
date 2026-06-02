import { prisma } from "@/lib/db";

export async function generateReportNo(formKind?: "FSR" | "FIRE_PUMP" | null) {
  const year = new Date().getFullYear();
  const prefix = formKind === "FSR" ? "FSR" : "FP";
  const base = `NS-${prefix}-${year}-`;

  const latest = await prisma.inspection.findFirst({
    where: { reportNo: { startsWith: base } },
    orderBy: { reportNo: "desc" },
    select: { reportNo: true },
  });

  let seq = 1;
  if (latest?.reportNo) {
    const part = latest.reportNo.slice(base.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${base}${String(seq).padStart(4, "0")}`;
}
