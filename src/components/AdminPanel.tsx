"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Card, Button, Input, Badge } from "@/components/ui";
import { DeleteInspectionButton } from "@/components/DeleteInspectionButton";
import { statusLabel, statusTone } from "@/lib/utils";

type User = { id: string; name: string; email: string; role: string; phone?: string };
type Inspection = {
  id: string;
  buildingName: string;
  status: string;
  inspectionDate: string | null;
  assignedToId: string | null;
  assignedTo: { name: string } | null;
  formTemplate: { name: string } | null;
};
type FormTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  formKind: string;
  active: boolean;
};

export function AdminPanel() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [q, setQ] = useState("");
  const [assigning, setAssigning] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [inspectorForm, setInspectorForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  async function load() {
    const [insp, usr, tpl] = await Promise.all([
      fetch("/api/inspections").then((r) => r.json()),
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/form-templates").then((r) => r.json()),
    ]);
    setInspections(insp.inspections || []);
    setUsers(usr.users || []);
    setTemplates(tpl.templates || []);
  }

  useEffect(() => {
    load();
  }, []);

  const pending = inspections.filter((i) => i.status === "PENDING_APPROVAL");
  const filtered = inspections.filter(
    (i) => !q || i.buildingName.toLowerCase().includes(q.toLowerCase())
  );

  async function assign(inspectionId: string, userId: string) {
    await fetch(`/api/inspections/${inspectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: userId, status: "ASSIGNED" }),
    });
    setAssigning(null);
    load();
  }

  async function addInspector(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inspectorForm),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Failed to add inspector");
      return;
    }
    setInspectorForm({ name: "", email: "", password: "", phone: "" });
    setMsg("Inspector added successfully");
    load();
  }

  async function deleteInspector(userId: string, name: string) {
    if (!confirm(`Remove inspector "${name}"?`)) return;
    setMsg("");
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "Could not remove inspector");
      return;
    }
    setMsg(data.message || "Inspector removed");
    load();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
        <p className="text-xs sm:text-sm text-gray-500\">Approvals, inspectors & assignments</p>\n      </div>

      {msg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          {msg}
        </div>
      )}

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <p className="text-xs sm:text-sm text-gray-500">Pending Approval</p>
          <p className="text-xl sm:text-2xl font-bold text-amber-600">{pending.length}</p>
        </Card>
        <Card>
          <p className="text-xs sm:text-sm text-gray-500">Inspectors</p>
          <p className="text-xl sm:text-2xl font-bold">
            {users.filter((u) => u.role === "INSPECTOR").length}
          </p>
        </Card>
        <Card>
          <p className="text-xs sm:text-sm text-gray-500">Form Categories</p>
          <p className="text-xl sm:text-2xl font-bold">{templates.length}</p>
        </Card>
        <Card>
          <p className="text-xs sm:text-sm text-gray-500">Total Records</p>
          <p className="text-xl sm:text-2xl font-bold">{inspections.length}</p>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card title="Pending Approvals">
          <div className="space-y-2">
            {pending.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
              >
                <div>
                  <p className="font-medium">{row.buildingName}</p>
                  <p className="text-xs text-gray-500">
                    {row.formTemplate?.name || "Inspection"} ·{" "}
                    {row.inspectionDate
                      ? format(new Date(row.inspectionDate), "dd MMM yyyy")
                      : "—"}
                  </p>
                </div>
                <Link
                  href={`/inspections/${row.id}`}
                  className="text-sm font-medium text-[#76B900] hover:underline"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="Add Inspector" className="max-w-lg">
        <form onSubmit={addInspector} className="space-y-3">
          <Input
            label="Full name"
            value={inspectorForm.name}
            onChange={(e) =>
              setInspectorForm((f) => ({ ...f, name: e.target.value }))
            }
            required
          />
          <Input
            label="Email"
            type="email"
            value={inspectorForm.email}
            onChange={(e) =>
              setInspectorForm((f) => ({ ...f, email: e.target.value }))
            }
            required
          />
          <Input
            label="Password"
            type="password"
            value={inspectorForm.password}
            onChange={(e) =>
              setInspectorForm((f) => ({ ...f, password: e.target.value }))
            }
            required
            minLength={6}
          />
          <Input
            label="Phone"
            value={inspectorForm.phone}
            onChange={(e) =>
              setInspectorForm((f) => ({ ...f, phone: e.target.value }))
            }
          />
          <Button type="submit">Create Inspector</Button>
        </form>
      </Card>

      <Card title="Team">
        <div className="space-y-3 sm:divide-y">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 sm:py-3 text-xs sm:text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{u.name}</p>
                <p className="text-gray-600 truncate">{u.email}</p>
                {u.phone && <p className="text-gray-500 text-xs">{u.phone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={u.role === "ADMIN" ? "blue" : "gray"}>
                  {u.role}
                </Badge>
                {u.role === "INSPECTOR" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 py-1 text-xs sm:text-sm text-red-600 hover:bg-red-50"
                    onClick={() => deleteInspector(u.id, u.name)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="All Inspections">
        <div className="mb-4 grid gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Input
            placeholder="Filter by name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:max-w-sm"
          />
        </div>
        {/* Mobile Card View */}
        <div className="space-y-3 md:hidden">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {row.buildingName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {row.formTemplate?.name || "—"}
                  </p>
                </div>
                <Badge tone={statusTone(row.status)}>
                  {statusLabel(row.status)}
                </Badge>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {row.inspectionDate
                    ? format(new Date(row.inspectionDate), "dd MMM yyyy")
                    : "—"}
                </p>
                <p>
                  <span className="font-medium">Assigned:</span>{" "}
                  {row.assignedTo?.name || "—"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {assigning === row.id ? (
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    defaultValue={row.assignedToId || ""}
                    onChange={(e) => assign(row.id, e.target.value)}
                  >
                    <option value="">Select Inspector</option>
                    {users
                      .filter((u) => u.role === "INSPECTOR")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full text-xs sm:text-sm"
                    onClick={() => setAssigning(row.id)}
                  >
                    Assign
                  </Button>
                )}
                <div className="flex gap-2">
                  <Link href={`/inspections/${row.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-xs sm:text-sm">
                      View
                    </Button>
                  </Link>
                  <DeleteInspectionButton
                    inspectionId={row.id}
                    label="Delete"
                    redirectTo="/admin"
                    variant="ghost"
                    className="px-2 text-red-600 hover:bg-red-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Form</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Assigned</th>
                <th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium">{row.buildingName}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {row.formTemplate?.name || "—"}
                  </td>
                  <td className="py-3 pr-4">
                    {row.inspectionDate
                      ? format(new Date(row.inspectionDate), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone(row.status)}>
                      {statusLabel(row.status)}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {assigning === row.id ? (
                      <select
                        className="rounded border px-2 py-1 text-sm"
                        defaultValue={row.assignedToId || ""}
                        onChange={(e) => assign(row.id, e.target.value)}
                      >
                        <option value="">Select</option>
                        {users
                          .filter((u) => u.role === "INSPECTOR")
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                      </select>
                    ) : (
                      row.assignedTo?.name || "—"
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/inspections/${row.id}`}
                        className="text-[#76B900] hover:underline"
                      >
                        View
                      </Link>
                      <button
                        type="button"
                        className="text-gray-600 hover:underline"
                        onClick={() => setAssigning(row.id)}
                      >
                        Assign
                      </button>
                      <DeleteInspectionButton
                        inspectionId={row.id}
                        label="Delete"
                        redirectTo="/admin"
                        variant="ghost"
                        className="px-0 text-red-600 hover:bg-transparent hover:text-red-700"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
