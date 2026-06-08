"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type SignatureCanvas from "react-signature-canvas";
import {
  FSR_BEFORE_START,
  defaultFsrFormData,
  parseFsrFormData,
  type FsrFormData,
} from "@/lib/fsr";
import { submitSuccessMessage } from "@/lib/inspection-workflow";
import { FormBrandHeader } from "@/components/FormBrandHeader";
import { PhotoCaptureSection } from "@/components/PhotoCaptureSection";
import {
  Button,
  Card,
  FormSection,
  Input,
  OptionGroup,
  Textarea,
} from "@/components/ui";

const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
});

type FsrInspectionData = {
  id?: string;
  reportNo?: string;
  status?: string;
  buildingName?: string;
  buildingAddress?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  inspectionDate?: string;
  inspectorName?: string;
  signatureData?: string;
  customerSignatureData?: string;
  formDataJson?: string;
  photos?: { id: string; url: string; tag: string }[];
  pdfPath?: string;
  adminNotes?: string;
};

export function FsrForm({
  initial,
  readOnly = false,
  userRole = "INSPECTOR",
}: {
  initial?: FsrInspectionData;
  readOnly?: boolean;
  userRole?: string;
}) {
  const router = useRouter();
  const sigRef = useRef<SignatureCanvas | null>(null);
  const customerSigRef = useRef<SignatureCanvas | null>(null);

  const [id, setId] = useState(initial?.id);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState(
    initial?.pdfPath || (initial?.id ? `/api/inspections/${initial.id}/pdf` : "")
  );
  const [photos, setPhotos] = useState(initial?.photos || []);
  const [photoTag, setPhotoTag] = useState<"BEFORE" | "AFTER" | "GENERAL">(
    "GENERAL"
  );

  const [reportNo, setReportNo] = useState(
    initial?.reportNo ||
      parseFsrFormData(initial?.formDataJson || "{}").reportNo ||
      ""
  );

  const [fsr, setFsr] = useState<FsrFormData>(() => {
    const parsed = parseFsrFormData(
      initial?.formDataJson || JSON.stringify(defaultFsrFormData())
    );
    return {
      ...parsed,
      reportNo: initial?.reportNo || parsed.reportNo || "",
    };
  });

  const [header, setHeader] = useState({
    buildingName: initial?.buildingName || "",
    buildingAddress: initial?.buildingAddress || "",
    contactPerson: initial?.contactPerson || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    inspectionDate:
      initial?.inspectionDate?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    inspectorName: initial?.inspectorName || "",
  });

  const setBefore = (key: string, value: string) => {
    setFsr((f) => ({
      ...f,
      beforeStart: { ...f.beforeStart, [key]: value },
    }));
  };

  const setFsrField = useCallback(
    <K extends keyof FsrFormData>(key: K, value: FsrFormData[K]) => {
      setFsr((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const disabled = readOnly;

  const payload = useCallback(() => {
    let signatureData = initial?.signatureData;
    let customerSignatureData = initial?.customerSignatureData;
    if (sigRef.current && !sigRef.current.isEmpty()) {
      signatureData = sigRef.current.toDataURL();
    }
    if (customerSigRef.current && !customerSigRef.current.isEmpty()) {
      customerSignatureData = customerSigRef.current.toDataURL();
    }
    return {
      ...header,
      formData: fsr,
      signatureData,
      customerSignatureData,
    };
  }, [header, fsr, initial?.signatureData, initial?.customerSignatureData]);

  async function saveDraft(): Promise<string | undefined> {
    setSaving(true);
    setMessage("");
    const body = {
      ...payload(),
      formData: fsr,
      status: "IN_PROGRESS",
    };
    const currentId = id;
    const url = currentId ? `/api/inspections/${currentId}` : "/api/inspections";
    const method = currentId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Save failed");
      return undefined;
    }
    const newId = data.inspection.id;
    setId(newId);
    if (data.inspection.reportNo) {
      setReportNo(data.inspection.reportNo);
      setFsr((f) => ({ ...f, reportNo: data.inspection.reportNo }));
    }
    if (!currentId) router.replace(`/inspections/${newId}`);
    setMessage("Draft saved");
    return newId;
  }

  async function submitInspection() {
    const inspectionId = id || (await saveDraft());
    if (!inspectionId) return;
    setSaving(true);
    const res = await fetch(`/api/inspections/${inspectionId}/submit`, {
      method: "POST",
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      const text = await res.text();
      data = text ? { error: text } : null;
    }
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Submit failed");
      return;
    }
    if (data.pdfUrl) setPdfUrl(data.pdfUrl);
    setMessage(data.message || submitSuccessMessage(userRole));
    router.refresh();
  }


  return (
    <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-4 pb-28">
      <FormBrandHeader
        title="Field Service Report (F.S.R.)"
        subtitle="Sale & Service Dealer for Kirloskar & Cummins Genset up to 2250 KVA"
      />

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {message}
        </div>
      )}

      {initial?.status === "PENDING_APPROVAL" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Waiting for admin approval.
        </div>
      )}

      {initial?.status === "REJECTED" && initial.adminNotes && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          <strong>Rejected:</strong> {initial.adminNotes}
        </div>
      )}

      <FormSection title="General Information" subtitle="Customer & DG set details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Report No."
            value={reportNo || fsr.reportNo || ""}
            readOnly
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Date"
            type="date"
            value={header.inspectionDate}
            onChange={(e) =>
              setHeader((h) => ({ ...h, inspectionDate: e.target.value }))
            }
            disabled={disabled}
          />
          <Input
            label="Name of Customer *"
            value={header.buildingName}
            onChange={(e) =>
              setHeader((h) => ({ ...h, buildingName: e.target.value }))
            }
            disabled={disabled}
            className="sm:col-span-2"
          />
          <Input
            label="Address *"
            value={header.buildingAddress}
            onChange={(e) =>
              setHeader((h) => ({ ...h, buildingAddress: e.target.value }))
            }
            disabled={disabled}
            className="sm:col-span-2"
          />
          <Input
            label="Contact Person"
            value={header.contactPerson}
            onChange={(e) =>
              setHeader((h) => ({ ...h, contactPerson: e.target.value }))
            }
            disabled={disabled}
          />
          <Input
            label="Tel."
            value={header.phone}
            onChange={(e) => setHeader((h) => ({ ...h, phone: e.target.value }))}
            disabled={disabled}
          />
          <Input
            label="E-mail"
            type="email"
            value={header.email}
            onChange={(e) => setHeader((h) => ({ ...h, email: e.target.value }))}
            disabled={disabled}
          />
          <Input
            label="Engine No."
            value={fsr.engineNo || ""}
            onChange={(e) => setFsrField("engineNo", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Model"
            value={fsr.model || ""}
            onChange={(e) => setFsrField("model", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Last Service Done"
            value={fsr.lastServiceDone || ""}
            onChange={(e) => setFsrField("lastServiceDone", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Next Service Due on"
            value={fsr.nextServiceDue || ""}
            onChange={(e) => setFsrField("nextServiceDue", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="DG Start time"
            type="time"
            value={fsr.dgStartTime || ""}
            onChange={(e) => setFsrField("dgStartTime", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Stop time"
            type="time"
            value={fsr.dgStopTime || ""}
            onChange={(e) => setFsrField("dgStopTime", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Load R"
            value={fsr.loadR || ""}
            onChange={(e) => setFsrField("loadR", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Load Y"
            value={fsr.loadY || ""}
            onChange={(e) => setFsrField("loadY", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Load B"
            value={fsr.loadB || ""}
            onChange={(e) => setFsrField("loadB", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Voltage (V)"
            value={fsr.voltage || ""}
            onChange={(e) => setFsrField("voltage", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Hours meter (AMF)"
            value={fsr.hoursMeter || ""}
            onChange={(e) => setFsrField("hoursMeter", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="RPM"
            value={fsr.dgRpm || ""}
            onChange={(e) => setFsrField("dgRpm", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Average Running"
            value={fsr.averageRunning || ""}
            onChange={(e) => setFsrField("averageRunning", e.target.value)}
            disabled={disabled}
          />
        </div>

        <OptionGroup
          label="Visit type"
          name="visitType"
          value={fsr.visitType || "SERVICE"}
          options={["GENERAL_CHECKUP", "SERVICE", "COMPLAINT"]}
          onChange={(v) =>
            setFsrField(
              "visitType",
              v as FsrFormData["visitType"]
            )
          }
          disabled={disabled}
          columns={3}
        />

        <Textarea
          label="Nature of complaint lodged (if any)"
          rows={2}
          value={fsr.complaintNature || ""}
          onChange={(e) => setFsrField("complaintNature", e.target.value)}
          disabled={disabled}
        />
      </FormSection>

      <FormSection
        title="Checkup before starting the DG set"
        subtitle="Mark status for each item"
      >
        <div className="space-y-3">
          {FSR_BEFORE_START.map((item) => (
            <OptionGroup
              key={item.key}
              label={item.label}
              name={`before-${item.key}`}
              value={fsr.beforeStart?.[item.key] || ""}
              options={item.options}
              onChange={(v) => setBefore(item.key, v)}
              disabled={disabled}
              columns={item.options.length > 3 ? 4 : 2}
            />
          ))}
        </div>
      </FormSection>

      <FormSection title="Checkup after starting the DG set">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Oil Pressure (Kg/Cm²)"
            value={fsr.oilPressure || ""}
            onChange={(e) => setFsrField("oilPressure", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Water Temp"
            value={fsr.waterTemp || ""}
            onChange={(e) => setFsrField("waterTemp", e.target.value)}
            disabled={disabled}
          />
        </div>
        <OptionGroup
          label="Sound from engine / alternator"
          name="engineSound"
          value={fsr.engineSound || ""}
          options={["normal", "abnormal"]}
          onChange={(v) => setFsrField("engineSound", v as "normal" | "abnormal")}
          disabled={disabled}
        />
        <OptionGroup
          label="DG set in auto mode"
          name="autoModeStatus"
          value={fsr.autoModeStatus || ""}
          options={["Starting", "Stopping"]}
          onChange={(v) =>
            setFsrField("autoModeStatus", v as "Starting" | "Stopping")
          }
          disabled={disabled}
        />
        <OptionGroup
          label="Smoke from exhaust"
          name="exhaustSmoke"
          value={fsr.exhaustSmoke || ""}
          options={["Normal", "Abnormal", "Leakage"]}
          onChange={(v) =>
            setFsrField("exhaustSmoke", v as FsrFormData["exhaustSmoke"])
          }
          disabled={disabled}
          columns={3}
        />
        <OptionGroup
          label="Smoke from breather"
          name="breatherSmoke"
          value={fsr.breatherSmoke || ""}
          options={["Normal", "Abnormal"]}
          onChange={(v) =>
            setFsrField("breatherSmoke", v as FsrFormData["breatherSmoke"])
          }
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Observations & actions">
        <OptionGroup
          label="Diesel leakage"
          name="dieselLeakage"
          value={fsr.dieselLeakage || ""}
          options={["Yes", "No", "Rectified"]}
          onChange={(v) =>
            setFsrField("dieselLeakage", v as FsrFormData["dieselLeakage"])
          }
          disabled={disabled}
          columns={3}
        />
        <Input
          label="If any, from where"
          value={fsr.dieselLeakageFrom || ""}
          onChange={(e) => setFsrField("dieselLeakageFrom", e.target.value)}
          disabled={disabled}
        />
        <OptionGroup
          label="Oil leakage"
          name="oilLeakage"
          value={fsr.oilLeakage || ""}
          options={["Yes", "No", "Rectified"]}
          onChange={(v) =>
            setFsrField("oilLeakage", v as FsrFormData["oilLeakage"])
          }
          disabled={disabled}
          columns={3}
        />
        <Input
          label="Oil leakage source"
          value={fsr.oilLeakageFrom || ""}
          onChange={(e) => setFsrField("oilLeakageFrom", e.target.value)}
          disabled={disabled}
        />
        <Textarea
          label="Action taken before leaving the site"
          rows={3}
          value={fsr.actionTaken || ""}
          onChange={(e) => setFsrField("actionTaken", e.target.value)}
          disabled={disabled}
        />
        <OptionGroup
          label="DG / Room / canopy / shed cleaned"
          name="roomCleaned"
          value={fsr.roomCleaned || ""}
          options={["Yes", "No"]}
          onChange={(v) => setFsrField("roomCleaned", v as "Yes" | "No")}
          disabled={disabled}
        />
        <OptionGroup
          label="Engine, alternator, battery, tank, silencer cleaned"
          name="componentsCleaned"
          value={fsr.componentsCleaned || ""}
          options={["Yes", "No"]}
          onChange={(v) => setFsrField("componentsCleaned", v as "Yes" | "No")}
          disabled={disabled}
        />
        <Textarea
          label="Any other abnormality observed and rectified"
          rows={2}
          value={fsr.otherAbnormality || ""}
          onChange={(e) => setFsrField("otherAbnormality", e.target.value)}
          disabled={disabled}
        />
        <Textarea
          label="Spare replaced (if any with qty)"
          rows={2}
          value={fsr.spareReplaced || ""}
          onChange={(e) => setFsrField("spareReplaced", e.target.value)}
          disabled={disabled}
        />
        <Textarea
          label="Pending action points"
          rows={2}
          value={fsr.pendingActions || ""}
          onChange={(e) => setFsrField("pendingActions", e.target.value)}
          disabled={disabled}
        />
        <Textarea
          label="Customer remarks"
          rows={2}
          value={fsr.customerRemarks || ""}
          onChange={(e) => setFsrField("customerRemarks", e.target.value)}
          disabled={disabled}
        />
      </FormSection>

      <FormSection title="Sign-off">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Service representative name"
            value={header.inspectorName}
            onChange={(e) =>
              setHeader((h) => ({ ...h, inspectorName: e.target.value }))
            }
            disabled={disabled}
          />
          <Input
            label="In time"
            type="time"
            value={fsr.inTime || ""}
            onChange={(e) => setFsrField("inTime", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Out time"
            type="time"
            value={fsr.outTime || ""}
            onChange={(e) => setFsrField("outTime", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Customer email"
            type="email"
            value={fsr.customerEmail || ""}
            onChange={(e) => setFsrField("customerEmail", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Customer mobile"
            value={fsr.customerMobile || ""}
            onChange={(e) => setFsrField("customerMobile", e.target.value)}
            disabled={disabled}
          />
        </div>

        {!disabled && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium">Service representative signature</p>
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <SignaturePad ref={sigRef} />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-sm"
                onClick={() => sigRef.current?.clear()}
              >
                Clear
              </Button>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Customer signature</p>
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <SignaturePad ref={customerSigRef} />
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 text-sm"
                onClick={() => customerSigRef.current?.clear()}
              >
                Clear
              </Button>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Photos">
        <PhotoCaptureSection
          disabled={disabled}
          inspectionId={id}
          photoTag={photoTag}
          onPhotoTagChange={setPhotoTag}
          photos={photos}
          onPhotoAdded={(photo) => setPhotos((p) => [...p, photo])}
        />
      </FormSection>

      {!disabled && (
        <div className="fixed bottom-0 left-0 right-0 flex flex-wrap gap-2 gap-y-3 rounded-t-xl border border-b-0 border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:gap-3 sm:p-4">
          <Button onClick={saveDraft} disabled={saving} variant="secondary" className="flex-1 min-w-max text-sm sm:text-base">
            Save Draft
          </Button>
          <Button onClick={submitInspection} disabled={saving} className="flex-1 min-w-max text-sm sm:text-base">
            {userRole === "INSPECTOR"
              ? "Submit for Approval"
              : "Submit & Generate PDF"}
          </Button>
        </div>
      )}

      {pdfUrl && (
        <Card title="Report">
          <a href={pdfUrl} target="_blank" rel="noreferrer">
            <Button type="button">Download PDF</Button>
          </a>
        </Card>
      )}
    </div>
  );
}
