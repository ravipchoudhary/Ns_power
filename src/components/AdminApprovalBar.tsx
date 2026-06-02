"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Textarea } from "@/components/ui";

export function AdminApprovalBar({ inspectionId }: { inspectionId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function approve() {
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/inspections/${inspectionId}/approve`, {
      method: "POST",
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Approval failed");
      return;
    }
    router.refresh();
  }

  async function reject() {
    if (!notes.trim()) {
      setMessage("Enter rejection reason");
      return;
    }
    setBusy(true);
    setMessage("");
    const res = await fetch(`/api/inspections/${inspectionId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: notes }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error || "Rejection failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
      <h2 className="font-semibold text-amber-900">Admin review required</h2>
      <p className="mt-1 text-sm text-amber-800">
        Inspector has submitted this report. Approve to generate PDF or reject
        with feedback.
      </p>
      <Textarea
        label="Rejection notes (if rejecting)"
        className="mt-3"
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {message && (
        <p className="mt-2 text-sm text-red-600">{message}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={approve} disabled={busy}>
          Approve & Generate PDF
        </Button>
        <Button variant="danger" onClick={reject} disabled={busy}>
          Reject
        </Button>
      </div>
    </div>
  );
}
