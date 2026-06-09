"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [inspector, setInspector] = useState("");
  const [satisfactory, setSatisfactory] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [inspectors, setInspectors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Load inspectors for filter dropdown
  useEffect(() => {
    fetch("/api/users?role=INSPECTOR")
      .then((r) => r.json())
      .then((d) => setInspectors(d.users || []))
      .catch(() => setInspectors([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (inspector) params.set("inspectorId", inspector);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (satisfactory) params.set("satisfactory", satisfactory);
    setLoading(true);
    fetch(`/api/inspections?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setInspections(d.inspections || []);
        setLoading(false);
      });
  }, [q, status, inspector, fromDate, toDate, satisfactory]);

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
        <div className="space-y-3 mb-4">
          {/* First row: Search and Status */}
          <div className="grid gap-3 sm:flex sm:flex-wrap">
            <Input
              placeholder="Search building, address, inspector..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1 min-w-xs"
            />
            <select
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
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

          {/* Second row: Additional filters */}
          <div className="grid gap-3 grid-cols-2 sm:flex sm:flex-wrap">
            <select
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              value={inspector}
              onChange={(e) => setInspector(e.target.value)}
              title="Filter by Inspector"
            >
              <option value="">All Inspectors</option>
              {inspectors.map((insp) => (
                <option key={insp.id} value={insp.id}>
                  {insp.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              value={satisfactory}
              onChange={(e) => setSatisfactory(e.target.value)}
              title="Filter by Result"
            >
              <option value="">All Results</option>
              <option value="yes">Satisfactory</option>
              <option value="no">Not Satisfactory</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              title="From Date"
              placeholder="From Date"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              title="To Date"
              placeholder="To Date"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : inspections.length === 0 ? (
          <p className="py-8 text-center text-gray-400">No inspections found</p>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
              {inspections.map((row) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50 transition"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{row.buildingName}</p>
                      <p className="text-xs text-gray-500 truncate">{row.buildingAddress}</p>
                    </div>
                    <Badge tone={statusTone(row.status)}>
                      {statusLabel(row.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Form:</span> {row.formTemplate?.name || "—"}
                    </div>
                    <div>
                      <span className="font-medium">Date:</span>{" "}
                      {row.inspectionDate
                        ? format(new Date(row.inspectionDate), "dd MMM")
                        : "—"}
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Inspector:</span>{" "}
                      {row.inspectorName || row.assignedTo?.name || "—"}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1 w-full text-xs sm:text-sm"
                      onClick={() => router.push(`/inspections/${row.id}`)}
                    >
                      Edit
                    </Button>
                    {row.pdfPath && (
                      <a href={row.pdfPath} target="_blank" rel="noreferrer" className="flex-1">
                        <Button variant="ghost" className="w-full text-xs sm:text-sm">
                          PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
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
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
