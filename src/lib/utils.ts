export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  PENDING_APPROVAL: "Pending Approval",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export function statusLabel(status: string) {
  return STATUS_LABELS[status] || status.replace(/_/g, " ");
}

export function statusTone(
  status: string
): "green" | "yellow" | "red" | "gray" | "blue" {
  switch (status) {
    case "COMPLETED":
      return "green";
    case "DRAFT":
      return "gray";
    case "ASSIGNED":
      return "blue";
    case "IN_PROGRESS":
      return "yellow";
    case "PENDING_APPROVAL":
      return "yellow";
    case "REJECTED":
      return "red";
    default:
      return "gray";
  }
}
