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
  const margin = 14;
  const gap = 8;
  let y = 10;

  const logo = await loadLogoDataUrl();
  const logoW = 62;
  const logoH = 18;
  const logoX = margin;

  if (logo) {
    doc.addImage(logo, "JPEG", logoX, y, logoW, logoH);
  }

  const textX = logo ? logoX + logoW + gap : margin;
  const textWidth = pageWidth - margin - textX;

  // Right block: title + address/contact like the paper header sample
  const title = options?.formTitle || COMPANY.name;
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text(title, textX + textWidth / 2, y + 4.2, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(6.6);
  doc.setTextColor(60, 60, 60);

  let detailsY = y + 7.6;
  const lineGap = 3.1;

  const drawBoldLabelLine = (label: string, value: string) => {
    doc.setFont("times", "bold");
    const labelW = doc.getTextWidth(label);
    doc.setFont("times", "normal");
    const valueLines = doc.splitTextToSize(value, textWidth - labelW);

    // First line: label (bold) + first chunk of value (normal)
    const first = valueLines.shift() || "";
    const fullW =
      labelW + doc.getTextWidth(first || "");
    const startX = textX + (textWidth - fullW) / 2;

    doc.setFont("times", "bold");
    doc.text(label, startX, detailsY);
    doc.setFont("times", "normal");
    doc.text(first, startX + labelW, detailsY);
    detailsY += lineGap;

    // Wrapped lines: value only, centered to right column
    for (const l of valueLines) {
      doc.text(l, textX + textWidth / 2, detailsY, { align: "center" });
      detailsY += lineGap;
    }
  };

  drawBoldLabelLine("Address : ", COMPANY.address);
  drawBoldLabelLine(
    "Contact us : ",
    `${COMPANY.landline}  Mob. : ${COMPANY.mobile}`
  );
  drawBoldLabelLine(
    "Email id : ",
    `${COMPANY.email}  Web : ${COMPANY.website}`
  );

  // Green bar tagline (matches sample style)
  const barY = Math.max(y + logoH, detailsY) + 1.6;
  const barH = 6;
  doc.setFillColor(118, 185, 0);
  doc.rect(margin, barY, pageWidth - margin * 2, barH, "F");

  // Right diagonal stripes hint
  const stripeX = pageWidth - margin - 16;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  for (let i = 0; i < 4; i++) {
    const x = stripeX + i * 3.2;
    doc.line(x, barY + barH, x + 6, barY);
  }
  doc.setDrawColor(0, 0, 0);

  doc.setFont("times", "bold");
  doc.setFontSize(8.6);
  doc.setTextColor(255, 255, 255);
  const barText = options?.formSubtitle || COMPANY.tagline;
  doc.text(barText, pageWidth / 2, barY + 4.2, { align: "center" });
  doc.setTextColor(0, 0, 0);

  return barY + barH + 6;
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
