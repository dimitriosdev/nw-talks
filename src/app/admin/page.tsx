"use client";

import { useSchedule } from "@/hooks/useSchedule";
import { Card } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Spinner";
import Link from "next/link";

export default function AdminDashboard() {
  const currentYear = new Date().getFullYear();
  const { entries, loading } = useSchedule(currentYear);

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
      label: "Unassigned",
      count: openCount,
      color: "text-gray-600",
      href: "/admin/schedule",
    },
    {
      label: "Confirmed",
      count: confirmedCount,
      color: "text-emerald-600",
      href: "/admin/schedule",
    },
    {
      label: "Cancelled",
      count: cancelledCount,
      color: "text-red-600",
      href: "/admin/schedule",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Overview</h1>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="text-center transition-shadow hover:shadow-md">
                <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/schedule">
          <Card className="transition-shadow hover:shadow-md">
            <h2 className="font-semibold">Schedule Manager</h2>
            <p className="text-sm text-gray-500">
              Assign speakers & talks, manage blackouts
            </p>
          </Card>
        </Link>
        <Link href="/admin/speakers">
          <Card className="transition-shadow hover:shadow-md">
            <h2 className="font-semibold">Speakers</h2>
            <p className="text-sm text-gray-500">
              Add, edit, or remove speakers
            </p>
          </Card>
        </Link>
        <Link href="/admin/talks">
          <Card className="transition-shadow hover:shadow-md">
            <h2 className="font-semibold">Talks</h2>
            <p className="text-sm text-gray-500">
              Manage talk catalogue &amp; bulk import
            </p>
          </Card>
        </Link>
        <Link href="/admin/settings">
          <Card className="transition-shadow hover:shadow-md">
            <h2 className="font-semibold">Settings</h2>
            <p className="text-sm text-gray-500">
              Year, preferred day, cooldown &amp; admin list
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
