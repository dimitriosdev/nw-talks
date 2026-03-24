"use client";

import { format, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import type { ScheduleEntry, Speaker, TalkWithFreshness } from "@/types";

interface Props {
  entry: ScheduleEntry;
  speaker: Speaker | undefined;
  talk: TalkWithFreshness | undefined;
  isCancelled: boolean;
  isFirstFuture: boolean;
  dateLocale: Locale;
  zoomLabel: string;
  physicalLabel: string;
  onEdit: () => void;
}

export function ScheduleEntryCard({
  entry,
  speaker,
  talk,
  isCancelled,
  isFirstFuture,
  dateLocale,
  zoomLabel,
  physicalLabel,
  onEdit,
}: Props) {
  const isConfirmed = entry.status === "confirmed";
  const isSpecialTalk = !talk && !!entry.customTalkTitle;
  const displayTitle = talk
    ? `${talk.id} — ${talk.title}`
    : entry.customTalkTitle
      ? entry.customTalkTitle
      : "Δεν έχει ανατεθεί ομιλία";

  const needsAttention = (!talk && !entry.customTalkTitle) || !speaker;
  return (
    <div
      onClick={onEdit}
      className={`group rounded-xl border px-4 py-3 transition
        ${
          isCancelled
            ? "cursor-pointer border-red-200 bg-red-50/40 hover:border-red-300 hover:shadow-sm dark:border-red-900 dark:bg-red-950/20 dark:hover:border-red-700"
            : needsAttention
              ? "cursor-pointer border-orange-200 bg-orange-50 hover:border-orange-300 hover:shadow-sm dark:border-orange-900 dark:bg-orange-950/20 dark:hover:border-orange-700"
              : isFirstFuture
                ? "cursor-pointer border-blue-400 bg-blue-50 ring-2 ring-blue-200 hover:border-blue-500 hover:shadow-sm dark:border-blue-600 dark:bg-blue-950 dark:ring-blue-800 dark:hover:border-blue-500"
                : "cursor-pointer border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm text-gray-500">
            {format(parseISO(entry.date), "EEEE, d MMMM yyyy", {
              locale: dateLocale,
            })}
          </p>
          {isCancelled ? (
            <>
              <p className="text-sm font-medium text-red-400 line-through">
                {entry.notes || "Ακυρωμένο"}
              </p>
              <p className="text-xs text-red-500/80">
                Πάτησε για επανεισαγωγή αυτής της ημερομηνίας
              </p>
            </>
          ) : (
            <>
              <p className="font-medium">
                {isSpecialTalk && (
                  <span
                    className="mr-1.5 inline-block rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
                    title="Ειδική ομιλία / εκδήλωση"
                  >
                    Ειδική
                  </span>
                )}
                {displayTitle}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {speaker
                  ? `${speaker.lastName} ${speaker.firstName} (${speaker.congregation})`
                  : "Δεν έχει ανατεθεί ομιλητής"}
              </p>
              {entry.notes && (
                <p className="text-xs italic text-gray-400">{entry.notes}</p>
              )}
              {typeof entry.presentedViaZoom === "boolean" && (
                <div className="mt-1">
                  <span
                    className={
                      entry.presentedViaZoom
                        ? "inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                        : "inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400"
                    }
                    title={entry.presentedViaZoom ? zoomLabel : physicalLabel}
                  >
                    {entry.presentedViaZoom ? zoomLabel : physicalLabel}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right side: confirmed badge + reinstate button */}
        <div
          className="flex shrink-0 flex-col items-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isCancelled ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
              title="Επανεισαγωγή αυτής της ημερομηνίας"
            >
              ↺ Επανεισαγωγή
            </button>
          ) : isConfirmed ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              title="Επιβεβαιωμένο"
            >
              ✓ Επιβεβαιωμένο
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-400 dark:bg-gray-800"
              title="Ανοιχτό"
            >
              ○ Ανοιχτό
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
