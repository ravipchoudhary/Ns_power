"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button, Card, Badge, Input } from "@/components/ui";
import { statusLabel, statusTone } from "@/lib/utils";

type Inspection = {
  id: string;
  buildingName: string;
  buildingAddress: string;
  status: string;
  inspectionDate: string | null;
  satisfactory: boolean | null;
  inspectorName: string | null;
  pdfPath: string | null;
  assignedTo: { name: string } | null;
  formTemplate: { name: string } | null;
};

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    setLoading(true);
    fetch(`/api/inspections?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setInspections(d.inspections || []);
        setLoading(false);
      });
  }, [q, status]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inspections</h1>
          <p className="text-gray-500">Manage all inspection records</p>
        </div>
        <Link href="/inspections/new">
          <Button>New Inspection</Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search building, address, inspector..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="pb-2 pr-4">Building / Customer</th>
                  <th className="pb-2 pr-4">Form</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Inspector</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{row.buildingName}</p>
                      <p className="text-xs text-gray-400">
                        {row.buildingAddress}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {row.formTemplate?.name || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.inspectionDate
                        ? format(new Date(row.inspectionDate), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      {row.inspectorName || row.assignedTo?.name || "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={statusTone(row.status)}>
                        {statusLabel(row.status)}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/inspections/${row.id}`}
                          className="text-[#76B900] hover:underline"
                        >
                          Edit
                        </Link>
                        {row.pdfPath && (
                          <a
                            href={row.pdfPath}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-600 hover:underline"
                          >
                            PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      No inspections found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
