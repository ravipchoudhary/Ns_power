"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, Badge } from "@/components/ui";

type Contract = {
  id: string;
  frequency: string;
  nextDueDate: string;
  overdue: boolean;
  notes: string | null;
  property: { buildingName: string; buildingAddress: string };
  assignedTo: { name: string } | null;
};

export default function AmcPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    fetch("/api/amc?due=true")
      .then((r) => r.json())
      .then((d) => setContracts(d.contracts || []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AMC & Service Reminders</h1>
        <p className="text-gray-500">
          Contracts due within 7 days or overdue
        </p>
      </div>

      <Card>
        <div className="space-y-4">
          {contracts.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-100 p-4"
            >
              <div>
                <p className="font-medium">{c.property.buildingName}</p>
                <p className="text-sm text-gray-500">
                  {c.property.buildingAddress}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {c.frequency} · Engineer: {c.assignedTo?.name || "Unassigned"}
                </p>
                {c.notes && (
                  <p className="mt-1 text-xs text-gray-400">{c.notes}</p>
                )}
              </div>
              <div className="text-right">
                <Badge tone={c.overdue ? "red" : "yellow"}>
                  {c.overdue ? "Overdue" : "Due soon"}
                </Badge>
                <p className="mt-1 text-sm font-medium">
                  {format(new Date(c.nextDueDate), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          ))}
          {contracts.length === 0 && (
            <p className="py-8 text-center text-gray-400">
              No AMC contracts due in the next 7 days
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
