"use client";

import { useFreshTalks } from "@/hooks/useSchedule";
import { TalkList } from "@/components/schedule/TalkList";
import { Spinner } from "@/components/ui/Spinner";
import { useState } from "react";
import type { FreshnessLevel } from "@/types";
import { usePreferences } from "@/hooks/usePreferences";

type TalkFilter = FreshnessLevel | "scheduled" | null;

export default function TalksPage() {
  const [filter, setFilter] = useState<TalkFilter>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const { texts } = usePreferences();

  const { talks, loading } = useFreshTalks();
  const regularTalks = talks.filter((talk) => talk.id < 900 || talk.id > 999);

  // Extract unique categories
  const categories = Array.from(
    new Set(regularTalks.map((t) => t.category)),
  ).filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-blue-600" />
      </div>
    );
  }

  const greenCount = regularTalks.filter(
    (t) => t.freshnessLevel === "green" && !t.isScheduledForFuture,
  ).length;
  const orangeCount = regularTalks.filter(
    (t) => t.freshnessLevel === "orange" && !t.isScheduledForFuture,
  ).length;
  const redCount = regularTalks.filter(
    (t) => t.freshnessLevel === "red" && !t.isScheduledForFuture,
  ).length;
  const scheduledCount = regularTalks.filter(
    (t) => t.isScheduledForFuture,
  ).length;
  const activeFilterLabel =
    filter === "green"
      ? texts.talks.freshness.greenLabel
      : filter === "orange"
        ? texts.talks.freshness.orangeLabel
        : filter === "red"
          ? texts.talks.freshness.redLabel
          : filter === "scheduled"
            ? texts.talks.scheduledLabel
            : texts.talks.allTalks;

  const pillBtn = (
    level: TalkFilter,
    label: string,
    count: number,
    dotCls: string,
    bgCls: string,
    activeBgCls: string,
  ) => {
    const isActive = level === null ? filter === null : filter === level;
    return (
      <button
        onClick={() =>
          setFilter(level === null ? null : isActive ? null : level)
        }
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-semibold backdrop-blur transition-all ${
          isActive
            ? `${activeBgCls} ring-2 ring-white/60 shadow-lg scale-105`
            : `${bgCls} hover:scale-105 hover:brightness-125`
        }`}
        style={{ minHeight: "22px" }}
      >
        {dotCls && <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} />}
        <span className="font-bold">{count}</span> {label}
      </button>
    );
  };

  // Category pill button
  // Category dropdown
  const categoryDropdown = (
    <select
      value={categoryFilter || ""}
      onChange={(e) => setCategoryFilter(e.target.value || null)}
      className="ml-2 rounded-full px-3 py-1 text-xs font-semibold bg-blue-400/20 text-blue-900 border border-blue-400/30 shadow-sm backdrop-blur transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 hover:bg-blue-400/30 hover:border-blue-400/50"
      style={{
        minHeight: "28px",
        minWidth: "120px",
        appearance: "none",
        boxShadow: "0 1px 4px 0 rgb(30 64 175 / 0.08)",
      }}
    >
      <option value="" className="bg-white text-blue-900">
        {texts.talks.allCategories || "All categories"}
      </option>
      {categories.map((category) => (
        <option
          key={category}
          value={category}
          className="bg-white text-blue-900 font-semibold"
        >
          {category}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 px-6 py-6 text-white shadow-lg sm:px-8 sm:py-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {texts.talks.title}
          </h1>
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-medium text-blue-50 backdrop-blur transition hover:bg-white/25"
            aria-expanded={showGuide}
            aria-controls="talk-gallery-guide"
          >
            {showGuide ? texts.talks.hideGuide : texts.talks.showGuide}
          </button>
        </div>

        {/* Combined filter pills row */}
        <div className="relative mt-2 flex flex-wrap items-center gap-0.5 text-xs">
          {pillBtn(
            null,
            texts.talks.talks,
            regularTalks.length,
            "",
            "bg-white/15 px-2 py-0.5",
            "bg-white/30 px-2 py-0.5",
          )}
          {pillBtn(
            "green",
            texts.talks.available,
            greenCount,
            "bg-emerald-400",
            "bg-emerald-400/20 px-2 py-0.5",
            "bg-emerald-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "orange",
            texts.talks.notRecommended,
            orangeCount,
            "bg-amber-400",
            "bg-amber-400/20 px-2 py-0.5",
            "bg-amber-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "red",
            texts.talks.tooRecent,
            redCount,
            "bg-red-400",
            "bg-red-400/20 px-2 py-0.5",
            "bg-red-400/40 px-2 py-0.5",
          )}
          {pillBtn(
            "scheduled",
            texts.talks.scheduled,
            scheduledCount,
            "bg-purple-400",
            "bg-purple-400/20 px-2 py-0.5",
            "bg-purple-400/40 px-2 py-0.5",
          )}
          {/* Category dropdown */}
          {categories.length > 0 && (
            <span className="text-xs text-blue-100 ml-2">
              {texts.talks.filterByCategory}
            </span>
          )}
          {categories.length > 0 && categoryDropdown}
        </div>

        <div className="relative mt-2 flex flex-wrap items-center gap-1 text-xs">
          <p className="rounded-full bg-white/10 px-2 py-0.5 text-blue-100">
            {texts.talks.showing}{" "}
            <span className="font-semibold text-white">
              {activeFilterLabel}
            </span>
            {categoryFilter && (
              <span className="ml-2 text-xs text-blue-200">
                · {categoryFilter}
              </span>
            )}
          </p>
        </div>

        {showGuide && (
          <div
            id="talk-gallery-guide"
            className="relative mt-3 rounded-xl bg-black/15 p-3 text-xs text-blue-100"
          >
            <p className="mb-2 text-blue-50">{texts.talks.clickGuide}</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-blue-100">
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {texts.talks.greenGuide}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />
                {texts.talks.orangeGuide}
              </span>
              <span>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400" />
                {texts.talks.redGuide}
                <span>
                  <span className="mr-1 inline-block h-2 w-2 rounded-full bg-purple-400" />
                  {texts.talks.scheduledGuide}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      <TalkList
        talks={regularTalks}
        filter={filter}
        categoryFilter={categoryFilter}
      />
    </div>
  );
}
