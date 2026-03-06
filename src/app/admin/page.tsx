"use client";

import { useSchedule } from "@/hooks/useSchedule";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Spinner";
import { usePreferences } from "@/hooks/usePreferences";

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const { entries, loading } = useSchedule(currentYear);
  const { texts } = usePreferences();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = entries.filter((e) => e.date >= today);

  const openCount = upcoming.filter((e) => e.status === "open").length;
  const confirmedCount = upcoming.filter(
    (e) => e.status === "confirmed",
  ).length;
  const cancelledCount = upcoming.filter(
    (e) => e.status === "cancelled",
  ).length;

  const stats = [
    {
      label: texts.adminOverview.unassigned,
      count: openCount,
      color: "text-gray-600",
    },
    {
      label: texts.adminOverview.confirmed,
      count: confirmedCount,
      color: "text-emerald-600",
    },
    {
      label: texts.adminOverview.cancelled,
      count: cancelledCount,
      color: "text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{texts.adminOverview.title}</h1>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
