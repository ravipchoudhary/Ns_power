import type { SessionPayload } from "@/lib/auth";

export function needsAdminApproval(role: string) {
  return role === "INSPECTOR";
}

export function inspectorCanEdit(status: string) {
  return ["DRAFT", "ASSIGNED", "IN_PROGRESS", "REJECTED"].includes(status);
}

/** Who can change form fields on the inspection detail page */
export function canEditInspectionForm(role: string, status: string) {
  if (role === "ADMIN") {
    return status !== "COMPLETED";
  }
  return inspectorCanEdit(status);
}

export function isFinalized(status: string) {
  return status === "COMPLETED";
}

export function submitSuccessMessage(role: string) {
  return needsAdminApproval(role)
    ? "Submitted for admin approval"
    : "Inspection submitted & PDF generated";
}

export type WorkflowSession = Pick<SessionPayload, "userId" | "role" | "name">;
