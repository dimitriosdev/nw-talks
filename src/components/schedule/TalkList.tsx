"use client";

import { useState, useMemo, useCallback, memo } from "react";
import type { FreshnessLevel, TalkWithFreshness } from "@/types";
import { usePreferences } from "@/hooks/usePreferences";
import { format, parseISO } from "date-fns";
import { el, enUS } from "date-fns/locale";

interface TalkListProps {
  talks: TalkWithFreshness[];
  /** When set, only talks of this freshness level are shown. */
  filter?: FreshnessLevel | null;
}

interface FreshnessDisplayConfig {
  label: string;
  shortLabel: string;
  description: string;
  bar: string;
  dot: string;
  badge: string;
  title: string;
  sectionBorder: string;
}

const TIERS: FreshnessLevel[] = ["green", "orange", "red"];

export function TalkList({ talks, filter = null }: TalkListProps) {
  const { texts, language } = usePreferences();
  const [search, setSearch] = useState("");
  const dateLocale = language === "el" ? el : enUS;

  const freshnessConfig: Record<FreshnessLevel, FreshnessDisplayConfig> = {
    green: {
      label: texts.talks.freshness.greenLabel,
      shortLabel: texts.talks.freshness.greenShort,
      description: texts.talks.freshness.greenDescription,
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      title: "text-gray-900 dark:text-gray-100",
      sectionBorder: "border-emerald-200 dark:border-emerald-800/40",
    },
    orange: {
      label: texts.talks.freshness.orangeLabel,
      shortLabel: texts.talks.freshness.orangeShort,
      description: texts.talks.freshness.orangeDescription,
      bar: "bg-amber-400",
      dot: "bg-amber-400",
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      title: "text-gray-700 dark:text-gray-300",
      sectionBorder: "border-amber-200 dark:border-amber-800/40",
    },
    red: {
      label: texts.talks.freshness.redLabel,
      shortLabel: texts.talks.freshness.redShort,
      description: texts.talks.freshness.redDescription,
      bar: "bg-red-500",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      title: "text-gray-400 dark:text-gray-500",
      sectionBorder: "border-red-200 dark:border-red-800/40",
    },
  };

  // Memoised filter + sort — only recomputes when inputs change
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const isNum = /^\d+$/.test(q);
    const numQ = isNum ? Number(q) : NaN;

    const matches = talks.filter((t) => {
      // Freshness filter
      if (filter !== null && t.freshnessLevel !== filter) return false;
      // Text / number search
      if (!q) return true;
      if (isNum) {
        // Prefix match on ID: "1" finds 1, 10, 100, 143…
        return String(t.id).startsWith(q);
      }
      return t.title.toLowerCase().includes(q) || String(t.id).includes(q);
    });

    // Sort: exact ID match first (when numeric), then by id
    matches.sort((a, b) => {
      if (isNum) {
        const aExact = a.id === numQ ? 0 : 1;
        const bExact = b.id === numQ ? 0 : 1;
        if (aExact !== bExact) return aExact - bExact;
      }
      return a.id - b.id;
    });

    // When showing all talks (no filter) → flat list sorted by id
    // When filtering a specific tier → group by tier
    if (filter === null) {
      return { flat: matches, groups: null, total: matches.length };
    }

    const groups: { level: FreshnessLevel; items: TalkWithFreshness[] }[] = [];
    for (const level of TIERS) {
      const items = matches.filter((t) => t.freshnessLevel === level);
      if (items.length > 0) groups.push({ level, items });
    }
    return { flat: null, groups, total: matches.length };
  }, [talks, filter, search]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          placeholder={texts.talks.searchPlaceholder}
          value={search}
          onChange={handleSearch}
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm transition-shadow placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={texts.common.clearSearch}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400">
        {grouped.total}{" "}
        {grouped.total !== 1 ? texts.talks.talksCount : texts.talks.talk}
        {filter &&
          ` · ${texts.talks.filteredBy} ${freshnessConfig[filter].label.toLowerCase()}`}
        {search && ` · ${texts.talks.matching} "${search.trim()}"`}
      </p>

      {/* Empty state */}
      {grouped.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg
            className="mb-3 h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-medium">{texts.talks.noTalksFound}</p>
          <p className="mt-1 text-xs">{texts.talks.tryAdjusting}</p>
        </div>
      ) : grouped.flat ? (
        /* Flat grid sorted by number (no filter active) */
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grouped.flat.map((talk) => (
            <TalkCard key={talk.id} talk={talk} />
          ))}
        </div>
      ) : (
        /* Grouped sections (specific tier filter active) */
        <div className="space-y-6">
          {grouped.groups!.map(({ level, items }) => {
            const cfg = freshnessConfig[level];
            return (
              <section key={level}>
                {/* Section header — only show when not filtering to a single tier */}
                {(filter === null || grouped.groups.length > 1) && (
                  <div
                    className={`mb-3 flex items-center gap-2 border-b pb-2 ${cfg.sectionBorder}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {cfg.label}
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      — {cfg.description}
                    </span>
                    <span className="ml-auto text-xs tabular-nums text-gray-400">
                      {items.length}
                    </span>
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((talk) => (
                    <TalkCard key={talk.id} talk={talk} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Memoised expandable card for a single talk                        */
/* ------------------------------------------------------------------ */
const TalkCard = memo(function TalkCard({ talk }: { talk: TalkWithFreshness }) {
  const { texts, language } = usePreferences();
  const [open, setOpen] = useState(false);
  const count = talk.presentations.length;
  const dateLocale = language === "el" ? el : enUS;
  const formattedLastPresentedDate = talk.lastPresentedDate
    ? format(parseISO(talk.lastPresentedDate), "d MMM yyyy", {
        locale: dateLocale,
      })
    : null;
  const cfg: Record<FreshnessLevel, FreshnessDisplayConfig> = {
    green: {
      label: texts.talks.freshness.greenLabel,
      shortLabel: texts.talks.freshness.greenShort,
      description: texts.talks.freshness.greenDescription,
      bar: "bg-emerald-500",
      dot: "bg-emerald-500",
      badge:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      title: "text-gray-900 dark:text-gray-100",
      sectionBorder: "border-emerald-200 dark:border-emerald-800/40",
    },
    orange: {
      label: texts.talks.freshness.orangeLabel,
      shortLabel: texts.talks.freshness.orangeShort,
      description: texts.talks.freshness.orangeDescription,
      bar: "bg-amber-400",
      dot: "bg-amber-400",
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      title: "text-gray-700 dark:text-gray-300",
      sectionBorder: "border-amber-200 dark:border-amber-800/40",
    },
    red: {
      label: texts.talks.freshness.redLabel,
      shortLabel: texts.talks.freshness.redShort,
      description: texts.talks.freshness.redDescription,
      bar: "bg-red-500",
      dot: "bg-red-500",
      badge: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      title: "text-gray-400 dark:text-gray-500",
      sectionBorder: "border-red-200 dark:border-red-800/40",
    },
  }[talk.freshnessLevel];

  const monthsLabel =
    talk.monthsSincePresented !== null
      ? `${talk.monthsSincePresented} ${texts.talks.monthsAgo}`
      : null;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-900 ${
        talk.freshnessLevel === "red"
          ? "border-red-200/60 dark:border-red-800/40"
          : talk.freshnessLevel === "orange"
            ? "border-amber-200/60 dark:border-amber-800/40"
            : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Freshness accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 ${cfg.bar}`} />

      <button
        type="button"
        onClick={() => count > 0 && setOpen((o) => !o)}
        className={`flex w-full flex-col gap-3 p-4 pl-5 text-left ${
          count > 0 ? "cursor-pointer" : "cursor-default"
        }`}
      >
        {/* Top row: Talk number + freshness badge */}
        <div className="flex items-center justify-between">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold tabular-nums text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            #{talk.id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
            title={cfg.description}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Title */}
        <h3 className={`text-sm font-semibold leading-snug ${cfg.title}`}>
          {talk.title}
        </h3>

        {/* Footer: last presented + expand hint */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400 dark:text-gray-500">
            {count === 0
              ? texts.talks.neverPresented
              : monthsLabel
                ? `${texts.talks.lastPresented} ${formattedLastPresentedDate} (${monthsLabel})`
                : `${texts.talks.lastPresented} ${formattedLastPresentedDate}`}
          </span>
          {count > 0 && (
            <span className="flex items-center gap-1 text-gray-400 transition-colors group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400">
              {count}{" "}
              {count !== 1
                ? texts.talks.presentations
                : texts.talks.presentation}
              <svg
                className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          )}
        </div>
      </button>

      {/* Expandable presentation history */}
      {open && count > 0 && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 pl-5 dark:border-gray-800 dark:bg-gray-800/30">
          <div className="space-y-2">
            {talk.presentations.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400"
              >
                <span className="shrink-0 font-mono text-[11px] text-gray-400 dark:text-gray-500">
                  {format(parseISO(p.date), "d MMM yyyy", {
                    locale: dateLocale,
                  })}
                </span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span className="truncate text-right">
                  {p.speaker
                    ? `${p.speaker.firstName} ${p.speaker.lastName}`
                    : "—"}
                </span>
                {p.speaker?.congregation && (
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-400 dark:bg-gray-700 dark:text-gray-500">
                    {p.speaker.congregation}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
