"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function DeleteInspectionButton({
  inspectionId,
  label = "Delete",
  redirectTo = "/inspections",
  variant = "danger",
  className,
}: {
  inspectionId: string;
  label?: string;
  redirectTo?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Delete this inspection permanently? This cannot be undone."
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/inspections/${inspectionId}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Delete failed");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={handleDelete}
      disabled={busy}
    >
      {busy ? "Deleting..." : label}
    </Button>
  );
}
