"use client";

import type { ScheduleStatus } from "@/types";
import { usePreferences } from "@/hooks/usePreferences";

const statusConfig: Record<ScheduleStatus, { bg: string; text: string }> = {
  confirmed: {
    bg: "bg-emerald-100 dark:bg-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  open: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
  },
  cancelled: {
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
  },
};

interface BadgeProps {
  status: ScheduleStatus;
}

export function Badge({ status }: BadgeProps) {
  const { texts } = usePreferences();
  const cfg = statusConfig[status];
  const labelMap: Record<ScheduleStatus, string> = {
    confirmed: texts.status.confirmed,
    open: texts.status.open,
    cancelled: texts.status.cancelled,
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {labelMap[status]}
    </span>
  );
}
