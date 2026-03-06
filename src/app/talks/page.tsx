"use client";

import { useFreshTalks } from "@/hooks/useSchedule";
import { TalkList } from "@/components/schedule/TalkList";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import type { FreshnessLevel } from "@/types";

export default function TalksPage() {
  const [filter, setFilter] = useState<FreshnessLevel | null>(null);
  const [showGuide, setShowGuide] = useState(false);

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
  const activeFilterLabel =
    filter === "green"
      ? "Available"
      : filter === "orange"
        ? "Not recommended"
        : filter === "red"
          ? "Too recent"
          : "All talks";

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
        <div className="relative flex items-start justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Talk Gallery
          </h1>
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur transition hover:bg-white/25"
            aria-expanded={showGuide}
            aria-controls="talk-gallery-guide"
          >
            {showGuide ? "Hide guide" : "Show guide"}
          </button>
        </div>

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

        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-xs">
          <p className="rounded-full bg-white/10 px-2.5 py-1 text-blue-100">
            Showing:{" "}
            <span className="font-semibold text-white">
              {activeFilterLabel}
            </span>
          </p>
        </div>

        {showGuide && (
          <div
            id="talk-gallery-guide"
            className="relative mt-3 rounded-xl bg-black/15 p-3 text-xs text-blue-100"
          >
            <p className="mb-2 text-blue-50">
              Click a category to filter - click again to show all.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-blue-100">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                12+ months - safe to present
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                6-12 months - consider waiting
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                &lt; 6 months - admin override needed
              </span>
            </div>
          </div>
        )}
      </div>

      <TalkList talks={talks} filter={filter} />
    </div>
  );
}
