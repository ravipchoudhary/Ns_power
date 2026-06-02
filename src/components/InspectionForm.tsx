"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type SignatureCanvas from "react-signature-canvas";
import {
  CHECKLIST_ITEMS,
  normalizeChecklist,
  type ChecklistAnswer,
  type ChecklistEntry,
  type FeedingOptions,
} from "@/lib/checklist";
import { mergeFeedingOptions } from "@/lib/checklist";
import {
  inspectorCanEdit,
  submitSuccessMessage,
} from "@/lib/inspection-workflow";
import { FormBrandHeader } from "@/components/FormBrandHeader";
import { Button, Card, FormSection, Input, Textarea } from "@/components/ui";

const SignaturePad = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
});

type InspectionData = {
  id?: string;
  reportNo?: string;
  status?: string;
  buildingName?: string;
  buildingAddress?: string;
  contactPerson?: string;
  contactAddress?: string;
  phone?: string;
  fax?: string;
  email?: string;
  buildingType?: string;
  inspectionDate?: string;
  lastInspectionDate?: string;
  pumpMake?: string;
  driveType?: string;
  modelNo?: string;
  gpm?: number;
  psi?: number;
  rpm?: number;
  feeding?: FeedingOptions;
  checklist?: ChecklistEntry[];
  satisfactory?: boolean | null;
  failureReason?: string;
  notes?: string;
  inspectorName?: string;
  approvalDate?: string;
  signatureData?: string;
  photos?: { id: string; url: string; tag: string }[];
  pdfPath?: string;
  adminNotes?: string;
};

const defaultFeeding: FeedingOptions = {
  automaticSprinkler: false,
  standpipe: false,
  fireHydrants: false,
  other: false,
  otherText: "",
};

export function InspectionForm({
  initial,
  readOnly = false,
  userRole = "INSPECTOR",
  formTemplateId,
}: {
  initial?: InspectionData;
  readOnly?: boolean;
  userRole?: string;
  formTemplateId?: string;
}) {
  const router = useRouter();
  const sigRef = useRef<SignatureCanvas | null>(null);

  const [id, setId] = useState(initial?.id);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [pdfUrl, setPdfUrl] = useState(initial?.pdfPath);
  const [whatsappUrl, setWhatsappUrl] = useState("");

  const [reportNo, setReportNo] = useState(initial?.reportNo || "");

  const [form, setForm] = useState({
    buildingName: initial?.buildingName || "",
    buildingAddress: initial?.buildingAddress || "",
    contactPerson: initial?.contactPerson || "",
    contactAddress: initial?.contactAddress || "",
    phone: initial?.phone || "",
    fax: initial?.fax || "",
    email: initial?.email || "",
    buildingType: initial?.buildingType || "EXISTING",
    inspectionDate:
      initial?.inspectionDate?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
    lastInspectionDate: initial?.lastInspectionDate?.slice(0, 10) || "",
    pumpMake: initial?.pumpMake || "",
    driveType: initial?.driveType || "ELECTRIC",
    modelNo: initial?.modelNo || "",
    gpm: initial?.gpm?.toString() || "",
    psi: initial?.psi?.toString() || "",
    rpm: initial?.rpm?.toString() || "",
    feeding: mergeFeedingOptions(initial?.feeding),
    checklist: normalizeChecklist(initial?.checklist),
    satisfactory:
      initial?.satisfactory === true
        ? "yes"
        : initial?.satisfactory === false
          ? "no"
          : "",
    failureReason: initial?.failureReason || "",
    notes: initial?.notes || "",
    inspectorName: initial?.inspectorName || "",
    approvalDate:
      initial?.approvalDate?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10),
  });

  const [photos, setPhotos] = useState(initial?.photos || []);
  const [photoTag, setPhotoTag] = useState<"BEFORE" | "AFTER" | "GENERAL">(
    "GENERAL"
  );

  const set = useCallback(
    <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
      setForm((f) => ({ ...f, [key]: value }));
    },
    []
  );

  const setChecklistAnswer = (key: string, answer: ChecklistAnswer) => {
    setForm((f) => ({
      ...f,
      checklist: f.checklist.map((c) =>
        c.key === key ? { ...c, answer } : c
      ),
    }));
  };

  const payload = useCallback(() => {
    let signatureData = initial?.signatureData;
    if (sigRef.current && !sigRef.current.isEmpty()) {
      signatureData = sigRef.current.toDataURL();
    }
    return {
      ...form,
      gpm: form.gpm ? parseFloat(form.gpm) : null,
      psi: form.psi ? parseFloat(form.psi) : null,
      rpm: form.rpm ? parseFloat(form.rpm) : null,
      satisfactory:
        form.satisfactory === "yes"
          ? true
          : form.satisfactory === "no"
            ? false
            : null,
      signatureData,
      checklist: form.checklist.filter((c) => c.answer),
    };
  }, [form, initial?.signatureData]);

  async function saveDraft(): Promise<string | undefined> {
    setSaving(true);
    setMessage("");
    const body = {
      ...payload(),
      status: "IN_PROGRESS",
      ...(formTemplateId && !id ? { formTemplateId } : {}),
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
    if (data.inspection.reportNo) setReportNo(data.inspection.reportNo);
    if (!currentId) {
      router.replace(`/inspections/${newId}`);
    }
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
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || "Submit failed");
      return;
    }
    setPdfUrl(data.pdfUrl);
    setWhatsappUrl(data.whatsappShareUrl);
    setMessage(data.message || submitSuccessMessage(userRole));
    if (data.pdfUrl) setPdfUrl(data.pdfUrl);
    if (data.whatsappShareUrl) setWhatsappUrl(data.whatsappShareUrl);
    router.refresh();
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("tag", photoTag);
    const res = await fetch(`/api/inspections/${id}/photos`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (res.ok) setPhotos((p) => [...p, data.photo]);
    e.target.value = "";
  }

  const disabled =
    readOnly ||
    !inspectorCanEdit(initial?.status || "DRAFT") ||
    initial?.status === "COMPLETED";

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-24">
      <FormBrandHeader
        title="Fire & Pump Routine Inspection"
        subtitle="Routine inspection checklist for fire pump systems"
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

      <FormSection title="Inspection Dates">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Report No."
            value={reportNo}
            readOnly
            disabled
            className="bg-gray-50"
          />
          <Input
            label="Date of Inspection"
            type="date"
            value={form.inspectionDate}
            onChange={(e) => set("inspectionDate", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Date of Last Inspection"
            type="date"
            value={form.lastInspectionDate}
            onChange={(e) => set("lastInspectionDate", e.target.value)}
            disabled={disabled}
          />
        </div>
      </FormSection>

      <FormSection title="Property Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Building Name *"
            value={form.buildingName}
            onChange={(e) => set("buildingName", e.target.value)}
            disabled={disabled}
            required
          />
          <Input
            label="Building Address *"
            value={form.buildingAddress}
            onChange={(e) => set("buildingAddress", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Contact Person"
            value={form.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Contact Address"
            value={form.contactAddress}
            onChange={(e) => set("contactAddress", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Fax"
            value={form.fax}
            onChange={(e) => set("fax", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={disabled}
          />
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-gray-700">
            Building Type
          </legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {(["NEW", "EXISTING", "RENOVATION"] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="buildingType"
                  checked={form.buildingType === t}
                  onChange={() => set("buildingType", t)}
                  disabled={disabled}
                />
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Pump Specifications">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Pump Make"
            value={form.pumpMake}
            onChange={(e) => set("pumpMake", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Model No."
            value={form.modelNo}
            onChange={(e) => set("modelNo", e.target.value)}
            disabled={disabled}
          />
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Drive Type</legend>
          <div className="mt-2 flex gap-6">
            {(["ELECTRIC", "DIESEL"] as const).map((d) => (
              <label key={d} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={form.driveType === d}
                  onChange={() => set("driveType", d)}
                  disabled={disabled}
                />
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Input
            label="GPM"
            type="number"
            value={form.gpm}
            onChange={(e) => set("gpm", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="PSI"
            type="number"
            value={form.psi}
            onChange={(e) => set("psi", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="RPM"
            type="number"
            value={form.rpm}
            onChange={(e) => set("rpm", e.target.value)}
            disabled={disabled}
          />
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">Fire Pump Feeding</legend>
          <div className="mt-2 space-y-2">
            {(
              [
                ["automaticSprinkler", "Automatic sprinkler system"],
                ["standpipe", "Standpipe system"],
                ["fireHydrants", "Fire hydrants"],
                ["other", "Other"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form.feeding[key])}
                  onChange={(e) =>
                    set("feeding", {
                      ...form.feeding,
                      [key]: e.target.checked,
                    })
                  }
                  disabled={disabled}
                />
                {label}
              </label>
            ))}
            {form.feeding.other && (
              <Input
                label="Other (specify)"
                value={form.feeding.otherText || ""}
                onChange={(e) =>
                  set("feeding", {
                    ...form.feeding,
                    otherText: e.target.value,
                  })
                }
                disabled={disabled}
              />
            )}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Inspection Checklist">
        <div className="space-y-4">
          {CHECKLIST_ITEMS.map((item, i) => {
            const entry = form.checklist.find((c) => c.key === item.key);
            const suggestNa =
              item.dieselOnly && form.driveType === "ELECTRIC";
            return (
              <div
                key={item.key}
                className="rounded-lg border border-gray-100 p-3"
              >
                <p className="text-sm text-gray-800">
                  <span className="font-medium">{i + 1}.</span> {item.label}
                  {suggestNa && (
                    <span className="ml-2 text-xs text-gray-400">
                      (suggested N/A for electric)
                    </span>
                  )}
                </p>
                <div className="mt-2 flex gap-4">
                  {(["YES", "NO", "NA"] as ChecklistAnswer[]).map((a) => (
                    <label
                      key={a}
                      className="flex items-center gap-1.5 text-sm"
                    >
                      <input
                        type="radio"
                        name={`check-${item.key}`}
                        checked={(entry?.answer ?? "") === a}
                        onChange={() => setChecklistAnswer(item.key, a)}
                        disabled={disabled}
                      />
                      {a === "NA" ? "N/A" : a.charAt(0) + a.slice(1).toLowerCase()}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>

      <FormSection title="Approval">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Inspector Name"
            value={form.inspectorName}
            onChange={(e) => set("inspectorName", e.target.value)}
            disabled={disabled}
          />
          <Input
            label="Approval Date"
            type="date"
            value={form.approvalDate}
            onChange={(e) => set("approvalDate", e.target.value)}
            disabled={disabled}
          />
        </div>
        <fieldset className="mt-4">
          <legend className="text-sm font-medium">
            System inspection satisfactory?
          </legend>
          <div className="mt-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.satisfactory === "yes"}
                onChange={() => set("satisfactory", "yes")}
                disabled={disabled}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={form.satisfactory === "no"}
                onChange={() => set("satisfactory", "no")}
                disabled={disabled}
              />
              No
            </label>
          </div>
        </fieldset>
        {form.satisfactory === "no" && (
          <Textarea
            label="Reason(s) for failure"
            className="mt-4"
            rows={3}
            value={form.failureReason}
            onChange={(e) => set("failureReason", e.target.value)}
            disabled={disabled}
          />
        )}
        {!disabled && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Digital Signature</p>
            <div className="rounded-lg border border-gray-300 bg-white">
              <SignaturePad ref={sigRef} className="w-full h-32" />
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => sigRef.current?.clear()}
            >
              Clear signature
            </Button>
            {initial?.signatureData && (
              <img
                src={initial.signatureData}
                alt="Saved signature"
                className="mt-2 max-h-20"
              />
            )}
          </div>
        )}
      </FormSection>

      <FormSection title="Notes">
        <Textarea
          rows={5}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          disabled={disabled}
          placeholder="Additional remarks..."
        />
      </FormSection>

      <FormSection title="Photos">
        {!disabled && id && (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Tag
              <select
                className="ml-2 rounded border px-2 py-1"
                value={photoTag}
                onChange={(e) =>
                  setPhotoTag(e.target.value as typeof photoTag)
                }
              >
                <option value="BEFORE">Before</option>
                <option value="AFTER">After</option>
                <option value="GENERAL">General</option>
              </select>
            </label>
            <input type="file" accept="image/*" onChange={uploadPhoto} />
          </div>
        )}
        {!id && (
          <p className="text-sm text-gray-500">Save draft first to upload photos.</p>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-lg border">
              <img
                src={p.url}
                alt={`Inspection photo ${p.tag}`}
                className="h-24 w-full object-cover"
              />
              <p className="bg-gray-50 px-2 py-1 text-center text-xs">{p.tag}</p>
            </div>
          ))}
        </div>
      </FormSection>

      {!disabled && (
        <div className="sticky bottom-0 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <Button onClick={saveDraft} disabled={saving} variant="secondary">
            Save Draft
          </Button>
          <Button onClick={submitInspection} disabled={saving || !id}>
            {userRole === "INSPECTOR"
              ? "Submit for Approval"
              : "Submit & Generate PDF"}
          </Button>
        </div>
      )}

      {pdfUrl && (
        <Card title="Report">
          <div className="flex flex-wrap gap-3">
            <a href={pdfUrl} target="_blank" rel="noreferrer">
              <Button type="button">Download PDF</Button>
            </a>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  Share on WhatsApp
                </Button>
              </a>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
