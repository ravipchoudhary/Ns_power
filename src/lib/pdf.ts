import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { CHECKLIST_ITEMS, type ChecklistEntry } from "./checklist";
import type { FeedingOptions } from "./checklist";
import { appendPhotosToPdf, type PdfPhoto } from "./pdf-photos";
import { drawPdfCompanyHeader, drawPdfPageFooter } from "./pdf-header";
import { format } from "date-fns";

export interface InspectionPdfData {
  id: string;
  reportNo?: string | null;
  inspectionDate?: Date | null;
  lastInspectionDate?: Date | null;
  buildingName: string;
  buildingAddress: string;
  contactPerson?: string | null;
  contactAddress?: string | null;
  phone?: string | null;
  fax?: string | null;
  email?: string | null;
  buildingType?: string | null;
  pumpMake?: string | null;
  driveType?: string | null;
  modelNo?: string | null;
  gpm?: number | null;
  psi?: number | null;
  rpm?: number | null;
  feeding: FeedingOptions;
  checklist: ChecklistEntry[];
  satisfactory?: boolean | null;
  failureReason?: string | null;
  notes?: string | null;
  inspectorName?: string | null;
  approvalDate?: Date | null;
  signatureData?: string | null;
}

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return format(new Date(d), "dd-MM-yyyy");
}

export async function generateInspectionPdf(
  data: InspectionPdfData,
  photos: PdfPhoto[] = []
): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = await drawPdfCompanyHeader(doc, {
    formTitle: "ROUTINE INSPECTION CHECK LIST",
    formSubtitle: "Fire & Pump Systems",
  });

  doc.setFontSize(9);
  doc.text(`Report No.: ${data.reportNo || "—"}`, 14, y);
  doc.text(`Date of Inspection: ${fmtDate(data.inspectionDate)}`, 110, y);
  y += 5;
  doc.text(`Reference ID: ${data.id}`, 14, y);
  y += 5;
  doc.text(`Date of Last Inspection: ${fmtDate(data.lastInspectionDate)}`, 14, y);
  y += 8;

  const field = (label: string, value?: string | null) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "—", 55, y);
    y += 5;
  };

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Property Information", 14, y);
  y += 6;
  doc.setFontSize(9);
  field("Building Name", data.buildingName);
  field("Building Address", data.buildingAddress);
  field("Contact Person", data.contactPerson);
  field("Contact Address", data.contactAddress);
  field("Phone", data.phone);
  field("Fax", data.fax);
  field("Email", data.email);
  field("Building Type", data.buildingType?.replace("_", " "));
  y += 2;

  doc.setFont("helvetica", "bold");
  doc.text("Pump Specifications", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  field("Pump Make", data.pumpMake);
  field("Drive", data.driveType);
  field("Model No.", data.modelNo);
  field(
    "Pump Rating",
    data.gpm || data.psi
      ? `${data.gpm ?? "—"} gpm @ ${data.psi ?? "—"} psi`
      : "—"
  );
  field("Rated Speed", data.rpm ? `${data.rpm} rpm` : "—");

  const feedingLabels: string[] = [];
  if (data.feeding.automaticSprinkler) feedingLabels.push("Automatic sprinkler");
  if (data.feeding.standpipe) feedingLabels.push("Standpipe");
  if (data.feeding.fireHydrants) feedingLabels.push("Fire hydrants");
  if (data.feeding.other)
    feedingLabels.push(`Other: ${data.feeding.otherText || "Yes"}`);
  field("Fire Pump Feeding", feedingLabels.join(", ") || "—");
  y += 2;

  const checklistRows = CHECKLIST_ITEMS.map((item, i) => {
    const entry = data.checklist.find((c) => c.key === item.key);
    const ans = entry?.answer ?? "—";
    return [`${i + 1}. ${item.label}`, ans];
  });

  autoTable(doc, {
    startY: y,
    head: [["Inspection Checklist", "Yes / No / N/A"]],
    body: checklistRows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [118, 185, 0] },
    columnStyles: { 0: { cellWidth: 140 }, 1: { cellWidth: 30, halign: "center" } },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 8;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.text("Approval", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  field("Inspector", data.inspectorName);
  field("Date", fmtDate(data.approvalDate));
  field(
    "Satisfactory",
    data.satisfactory === true
      ? "Yes"
      : data.satisfactory === false
        ? "No"
        : "—"
  );
  if (data.failureReason) field("Reason(s)", data.failureReason);

  if (data.signatureData?.startsWith("data:image")) {
    try {
      doc.addImage(data.signatureData, "PNG", 14, y, 50, 20);
      y += 24;
    } catch {
      // Skip if signature image cannot be embedded
    }
  }

  if (data.notes) {
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Notes:", 14, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    const noteLines = doc.splitTextToSize(data.notes, pageWidth - 28);
    doc.text(noteLines, 14, y);
  }

  await appendPhotosToPdf(doc, photos);

  drawPdfPageFooter(
    doc,
    `Generated ${format(new Date(), "dd-MM-yyyy HH:mm")} | NS Power Solution`
  );

  return Buffer.from(doc.output("arraybuffer"));
}
