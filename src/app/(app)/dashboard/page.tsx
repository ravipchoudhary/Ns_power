import Link from "next/link";
import { format } from "date-fns";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { statusLabel, statusTone } from "@/lib/utils";
import { ClipboardList, CheckCircle, Clock, Calendar } from "lucide-react";

async function getStats(userId: string, isAdmin: boolean) {
  const baseWhere = isAdmin
    ? {}
    : { OR: [{ assignedToId: userId }, { createdById: userId }] };

  const [total, pending, completed, monthlyCount, recent, overdueAmc] =
    await Promise.all([
      prisma.inspection.count({ where: baseWhere }),
      prisma.inspection.count({
        where: {
          ...baseWhere,
          status: {
            in: [
              "DRAFT",
              "ASSIGNED",
              "IN_PROGRESS",
              "PENDING_APPROVAL",
              "REJECTED",
            ],
          },
        },
      }),
      prisma.inspection.count({
        where: { ...baseWhere, status: "COMPLETED" },
      }),
      prisma.inspection.count({
        where: {
          ...baseWhere,
          inspectionDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.inspection.findMany({
        where: baseWhere,
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      isAdmin
        ? prisma.amcContract.count({
            where: { nextDueDate: { lt: new Date() } },
          })
        : 0,
    ]);

  return { total, pending, completed, monthlyCount, recent, overdueAmc };
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;
  const stats = await getStats(session.userId, session.role === "ADMIN");

  const cards = [
    {
      label: "Total Inspections",
      value: stats.total,
      icon: ClipboardList,
      color: "text-blue-600",
    },
    {
      label: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
    },
    {
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "This Month",
      value: stats.monthlyCount,
      icon: Calendar,
      color: "text-[#76B900]",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {session.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-4">
            <div className={`rounded-lg bg-gray-50 p-3 ${color}`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      {session.role === "ADMIN" && stats.overdueAmc > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {stats.overdueAmc} AMC contract(s) overdue —{" "}
          <Link href="/amc" className="font-medium underline">
            View AMC
          </Link>
        </div>
      )}

      <Card title="Recent Activity">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-2 pr-4">Building</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((row) => (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium">{row.buildingName}</td>
                  <td className="py-3 pr-4 text-gray-600">
                    {row.inspectionDate
                      ? format(new Date(row.inspectionDate), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge tone={statusTone(row.status)}>
                      {statusLabel(row.status)}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/inspections/${row.id}`}
                      className="text-[#76B900] hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {stats.recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">
                    No inspections yet.{" "}
                    <Link href="/inspections/new" className="text-[#76B900]">
                      Create one
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
