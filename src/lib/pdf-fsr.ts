import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import {
  FSR_BEFORE_START,
  type FsrFormData,
  parseFsrFormData,
} from "./fsr";
import { appendPhotosToPdf, type PdfPhoto } from "./pdf-photos";
import { drawPdfCompanyHeader, drawPdfPageFooter } from "./pdf-header";

export interface FsrPdfData {
  id: string;
  reportNo?: string | null;
  inspectionDate?: Date | null;
  buildingName: string;
  buildingAddress: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  inspectorName?: string | null;
  signatureData?: string | null;
  customerSignatureData?: string | null;
  formDataJson: string;
}

function fmtDate(d?: Date | null) {
  if (!d) return "—";
  return format(new Date(d), "dd-MM-yyyy");
}

export async function generateFsrPdf(
  data: FsrPdfData,
  photos: PdfPhoto[] = []
): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const fsr = parseFsrFormData(data.formDataJson);
  let y = await drawPdfCompanyHeader(doc, {
    formTitle: "FIELD SERVICE REPORT (F.S.R.)",
    formSubtitle:
      "Sale & Service Dealer for Kirloskar & Cummins Genset up to 2250 KVA",
  });

  const info = [
    ["Report No.", data.reportNo || fsr.reportNo || "—"],
    ["Date", fmtDate(data.inspectionDate)],
    ["Customer", data.buildingName],
    ["Address", data.buildingAddress],
    ["Contact", data.contactPerson || "—"],
    ["Tel.", data.phone || "—"],
    ["E-mail", data.email || "—"],
    ["Engine No.", fsr.engineNo || "—"],
    ["Model", fsr.model || "—"],
    ["Last Service", fsr.lastServiceDone || "—"],
    ["Next Service Due", fsr.nextServiceDue || "—"],
  ];

  autoTable(doc, {
    startY: y,
    body: info,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 1.2 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 42 } },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 4;

  const beforeRows = FSR_BEFORE_START.map((item) => [
    item.label,
    fsr.beforeStart?.[item.key] || "—",
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Checkup before starting DG set", "Status"]],
    body: beforeRows,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [118, 185, 0] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 4;

  const after = [
    ["Oil Pressure (Kg/Cm²)", fsr.oilPressure || "—"],
    ["Water Temp", fsr.waterTemp || "—"],
    ["Engine sound", fsr.engineSound || "—"],
    ["Auto mode", fsr.autoModeStatus || "—"],
    ["Exhaust smoke", fsr.exhaustSmoke || "—"],
    ["Breather smoke", fsr.breatherSmoke || "—"],
    ["Diesel leakage", `${fsr.dieselLeakage || "—"} ${fsr.dieselLeakageFrom || ""}`],
    ["Oil leakage", `${fsr.oilLeakage || "—"} ${fsr.oilLeakageFrom || ""}`],
    ["Action taken", fsr.actionTaken || "—"],
    ["Spares replaced", fsr.spareReplaced || "—"],
    ["Pending actions", fsr.pendingActions || "—"],
    ["Customer remarks", fsr.customerRemarks || "—"],
  ];

  autoTable(doc, {
    startY: y,
    head: [["After starting / closing", "Details"]],
    body: after,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [118, 185, 0] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;

  doc.setFontSize(8);
  doc.text(
    `Service Rep: ${data.inspectorName || "—"} | In: ${fsr.inTime || "—"} | Out: ${fsr.outTime || "—"}`,
    14,
    y
  );

  if (data.signatureData?.startsWith("data:image")) {
    try {
      doc.addImage(data.signatureData, "PNG", 14, y + 4, 40, 18);
    } catch {
      // Skip if signature image cannot be embedded
    }
  }

  await appendPhotosToPdf(doc, photos);

  drawPdfPageFooter(doc);

  return Buffer.from(doc.output("arraybuffer"));
}
