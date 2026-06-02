import { readFile } from "fs/promises";
import path from "path";
import type { jsPDF } from "jspdf";

export type PdfPhoto = {
  url: string;
  tag: string;
};

async function loadImageDataUrl(filePath: string): Promise<string | null> {
  try {
    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function imageFormat(dataUrl: string): "PNG" | "JPEG" | "WEBP" {
  if (dataUrl.includes("image/png")) return "PNG";
  if (dataUrl.includes("image/webp")) return "WEBP";
  return "JPEG";
}

export async function appendPhotosToPdf(
  doc: jsPDF,
  photos: PdfPhoto[]
): Promise<void> {
  if (photos.length === 0) return;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const gap = 8;
  const imgWidth = (pageWidth - margin * 2 - gap) / 2;
  const imgHeight = 48;

  doc.addPage();
  let y = 18;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Inspection Photos", margin, y);
  y += 10;
  doc.setFont("helvetica", "normal");

  let col = 0;
  let rowY = y;

  for (const photo of photos) {
    const relative = photo.url.replace(/^\//, "");
    const filePath = path.join(process.cwd(), "public", relative);
    const dataUrl = await loadImageDataUrl(filePath);
    if (!dataUrl) continue;

    if (rowY + imgHeight > pageHeight - 20) {
      doc.addPage();
      rowY = 18;
      col = 0;
    }

    const x = margin + col * (imgWidth + gap);

    try {
      doc.addImage(dataUrl, imageFormat(dataUrl), x, rowY, imgWidth, imgHeight);
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text(photo.tag, x, rowY + imgHeight + 4);
      doc.setTextColor(0, 0, 0);
    } catch {
      // Skip photo if it cannot be embedded in the PDF
    }

    col += 1;
    if (col >= 2) {
      col = 0;
      rowY += imgHeight + 14;
    }
  }
}
