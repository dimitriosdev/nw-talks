"use client";

import { useFreshTalks } from "@/hooks/useSchedule";
import { TalkList } from "@/components/schedule/TalkList";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import type { FreshnessLevel } from "@/types";

export default function TalksPage() {
  const [filter, setFilter] = useState<FreshnessLevel | null>(null);

  const { talks, loading } = useFreshTalks();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const greenCount = talks.filter((t) => t.freshnessLevel === "green").length;
  const orangeCount = talks.filter((t) => t.freshnessLevel === "orange").length;
  const redCount = talks.filter((t) => t.freshnessLevel === "red").length;

  const pillBtn = (
    level: FreshnessLevel | null,
    label: string,
    count: number,
    dotCls: string,
    bgCls: string,
    activeBgCls: string,
  ) => {
    // "All talks" pill (level === null) is active when no filter is set;
    // color pills toggle their own filter on/off.
    const isActive = level === null ? filter === null : filter === level;
    return (
      <button
        onClick={() =>
          setFilter(level === null ? null : isActive ? null : level)
        }
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-sm backdrop-blur transition-all ${
          isActive
            ? `${activeBgCls} ring-2 ring-white/60 shadow-lg scale-105`
            : `${bgCls} hover:scale-105 hover:brightness-125`
        }`}
      >
        {dotCls && <span className={`h-2 w-2 rounded-full ${dotCls}`} />}
        <span className="text-lg font-bold">{count}</span> {label}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative text-3xl font-extrabold tracking-tight sm:text-4xl">
          Talk Gallery
        </h1>
        <p className="relative mt-1.5 text-sm text-blue-100 sm:text-base">
          Click a category to filter — click again to show all.
        </p>

        {/* Clickable filter pills */}
        <div className="relative mt-5 flex flex-wrap gap-3 text-sm">
          {pillBtn(
            null,
            "talks",
            talks.length,
            "",
            "bg-white/15",
            "bg-white/30",
          )}
          {pillBtn(
            "green",
            "available",
            greenCount,
            "bg-emerald-400",
            "bg-emerald-400/20",
            "bg-emerald-400/40",
          )}
          {pillBtn(
            "orange",
            "not recommended",
            orangeCount,
            "bg-amber-400",
            "bg-amber-400/20",
            "bg-amber-400/40",
          )}
          {pillBtn(
            "red",
            "too recent",
            redCount,
            "bg-red-400",
            "bg-red-400/20",
            "bg-red-400/40",
          )}
        </div>

        {/* Legend */}
        <div className="relative mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-blue-200">
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
            12+ months — safe to present
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
            6–12 months — consider waiting
          </span>
          <span>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
            &lt; 6 months — admin override needed
          </span>
        </div>
      </div>

      <TalkList talks={talks} filter={filter} />
    </div>
  );
}
