import { readFile } from "fs/promises";
import path from "path";
import type { jsPDF } from "jspdf";
import { COMPANY } from "./checklist";
import { ENCOGIX_URL, FOOTER_DEVELOPER } from "./branding";

let cachedLogoDataUrl: string | null = null;

export async function loadLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const buffer = await readFile(
      path.join(process.cwd(), "public", "logo.jpeg")
    );
    cachedLogoDataUrl = `data:image/jpeg;base64,${buffer.toString("base64")}`;
    return cachedLogoDataUrl;
  } catch {
    return null;
  }
}

export async function drawPdfCompanyHeader(
  doc: jsPDF,
  options?: { formTitle?: string; formSubtitle?: string }
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 10;

  const logo = await loadLogoDataUrl();
  if (logo) {
    const logoW = 70;
    const logoH = 18;
    doc.addImage(logo, "JPEG", (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  } else {
    doc.setFontSize(16);
    doc.setTextColor(118, 185, 0);
    doc.text(COMPANY.name, pageWidth / 2, y + 4, { align: "center" });
    y += 10;
  }

  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  const taglines = doc.splitTextToSize(COMPANY.tagline, pageWidth - 30);
  doc.text(taglines, pageWidth / 2, y, { align: "center" });
  y += taglines.length * 3.5 + 1;

  doc.text(COMPANY.address, pageWidth / 2, y, { align: "center" });
  y += 3.5;
  doc.text(
    `Tel: ${COMPANY.landline} | Mob: ${COMPANY.mobile}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 3.5;
  doc.text(
    `${COMPANY.email} | ${COMPANY.website}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 6;

  if (options?.formTitle) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(options.formTitle, pageWidth / 2, y, { align: "center" });
    y += 5;
    if (options.formSubtitle) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(options.formSubtitle, pageWidth / 2, y, { align: "center" });
      y += 5;
    }
  }

  return y;
}

export function drawPdfPageFooter(doc: jsPDF, extraLine?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    let footerY = pageHeight - 10;
    if (extraLine) {
      doc.text(extraLine, pageWidth / 2, footerY, { align: "center" });
      footerY -= 3.5;
    }
    const prefix = "Developed by ";
    doc.setFont("helvetica", "normal");
    const prefixW = doc.getTextWidth(prefix);
    doc.setFont("helvetica", "bold");
    const boldW = doc.getTextWidth(FOOTER_DEVELOPER);
    const startX = (pageWidth - prefixW - boldW) / 2;
    doc.setFont("helvetica", "normal");
    doc.text(prefix, startX, footerY);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(46, 125, 50);
    doc.textWithLink(FOOTER_DEVELOPER, startX + prefixW, footerY, {
      url: ENCOGIX_URL,
    });
    doc.setTextColor(120, 120, 120);
  }
}
