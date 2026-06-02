"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, FileText, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button, Card } from "@/components/ui";

type FormTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  formKind: "FIRE_PUMP" | "FSR";
};

export default function NewInspectionPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/form-templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d.templates || []);
        setLoading(false);
      });
  }, []);

  async function startInspection(templateId: string) {
    setStarting(templateId);
    setError("");
    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formTemplateId: templateId,
        buildingName: "New inspection",
        buildingAddress: "",
        status: "IN_PROGRESS",
      }),
    });
    const data = await res.json();
    setStarting(null);
    if (!res.ok) {
      setError(data.error || "Could not start inspection");
      return;
    }
    router.push(`/inspections/${data.inspection.id}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <BrandLogo className="max-w-[200px]" />
        <div>
        <h1 className="text-2xl font-bold text-gray-900">New Inspection</h1>
        <p className="mt-1 text-gray-500">
          Choose a form category. You will fill the selected form on the next
          step.
        </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading forms...
        </p>
      ) : templates.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">
            No form categories available. Ask admin to add forms in Admin Panel.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!!starting}
              onClick={() => startInspection(t.id)}
              className="group rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[#76B900] hover:shadow-md disabled:opacity-60"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#76B900]/10 text-[#76B900]">
                {t.formKind === "FSR" ? (
                  <FileText size={22} />
                ) : (
                  <ClipboardCheck size={22} />
                )}
              </div>
              <h2 className="font-semibold text-gray-900 group-hover:text-[#5f9400]">
                {t.name}
              </h2>
              {t.description && (
                <p className="mt-2 text-sm text-gray-500">{t.description}</p>
              )}
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                {t.formKind === "FSR" ? "Genset FSR" : "Fire & Pump"}
              </p>
              {starting === t.id && (
                <p className="mt-2 flex items-center gap-1 text-xs text-[#76B900]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Opening form...
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <Button variant="ghost" onClick={() => router.push("/inspections")}>
        Back to list
      </Button>
    </div>
  );
}
