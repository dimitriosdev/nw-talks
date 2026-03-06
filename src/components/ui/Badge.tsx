import type { ScheduleStatus } from "@/types";

const statusConfig: Record<
  ScheduleStatus,
  { label: string; bg: string; text: string }
> = {
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-100 dark:bg-emerald-900",
    text: "text-emerald-800 dark:text-emerald-200",
  },
  open: {
    label: "Open",
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-100 dark:bg-red-900",
    text: "text-red-800 dark:text-red-200",
  },
};

interface BadgeProps {
  status: ScheduleStatus;
}

export function Badge({ status }: BadgeProps) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}
