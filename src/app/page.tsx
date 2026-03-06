"use client";

import { useSchedule } from "@/hooks/useSchedule";
import { ScheduleCard } from "@/components/schedule/ScheduleCard";
import { SkeletonCard } from "@/components/ui/Spinner";
import { useState, useEffect, useRef } from "react";
import { getScheduleYears } from "@/lib/firestore";

export default function HomePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  const { entries, loading } = useSchedule(selectedYear);
  const todayRef = useRef<HTMLDivElement>(null);

  // Load available years from Firestore
  useEffect(() => {
    getScheduleYears().then((years) => {
      if (years.length) setAvailableYears(years);
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  // All non-cancelled entries sorted by date (ascending)
  const all = entries
    .filter((e) => e.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date));

  // Scroll to "today" marker once data loads
  useEffect(() => {
    if (!loading && all.length > 0) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: "instant",
          block: "start",
        });
      }, 100);
    }
  }, [loading, all.length]);

  return (
    <div className="space-y-5">
      {/* Header row: title + year selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && all.length === 0 && (
        <p className="py-12 text-center text-gray-500">
          No talks found for {selectedYear}.
        </p>
      )}

      {/* Schedule list */}
      {!loading && all.length > 0 && (
        <div className="space-y-3">
          {all.map((entry, idx) => {
            // Insert a "Today" marker before the first future entry
            const isFirstFuture =
              entry.date >= today && (idx === 0 || all[idx - 1].date < today);

            return (
              <div key={entry.id}>
                {isFirstFuture && (
                  <div
                    ref={todayRef}
                    className="my-4 flex items-center gap-3 scroll-mt-20"
                  >
                    <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Today
                    </span>
                    <div className="h-px flex-1 bg-blue-400 dark:bg-blue-600" />
                  </div>
                )}
                <div className={entry.date < today ? "opacity-60" : ""}>
                  <ScheduleCard entry={entry} highlight={isFirstFuture} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
