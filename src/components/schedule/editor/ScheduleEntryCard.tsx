"use client";

import { format, parseISO, isAfter } from "date-fns";
import type { Locale } from "date-fns";
import type { ScheduleEntry, Speaker, TalkWithFreshness } from "@/types";

function isSpecialEventTalk(talk: TalkWithFreshness | undefined) {
  return talk && [996, 997, 998, 999].includes(talk.id);
}

function isConventionTalk(talk: TalkWithFreshness | undefined) {
  return talk && talk.id === 999;
}

interface Props {
  entry: ScheduleEntry;
  speaker: Speaker | undefined;
  talk: TalkWithFreshness | undefined;
  isCancelled: boolean;
  isFirstFuture: boolean;
  dateLocale: Locale;
  zoomLabel: string;
  physicalLabel: string;
  whatsappUrl?: string;
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
  whatsappUrl,
  onEdit,
}: Props) {
  const isConfirmed = entry.status === "confirmed";
  const isSpecialTalk = !talk && !!entry.customTalkTitle;
  const isSpecialEvent = isSpecialEventTalk(talk);
  const displayTitle = talk
    ? `${talk.id} — ${talk.title}`
    : entry.customTalkTitle
      ? entry.customTalkTitle
      : "Δεν έχει ανατεθεί ομιλία";

  const needsAttention =
    !isSpecialEvent && ((!talk && !entry.customTalkTitle) || !speaker);
  const isFuture = isAfter(parseISO(entry.date), new Date());

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
                : "cursor-pointer border-l-4 border-l-violet-400 border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-l-violet-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600"
        }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
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
                    ✦
                  </span>
                )}
                {displayTitle}
              </p>
              {isSpecialEvent ? (
                speaker && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {`${speaker.lastName} ${speaker.firstName} (${speaker.congregation})`}
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {speaker
                    ? `${speaker.lastName} ${speaker.firstName} (${speaker.congregation})`
                    : !isConventionTalk
                      ? "Δεν έχει ανατεθεί ομιλητής"
                      : ""}
                </p>
              )}
              {entry.notes && (
                <p className="text-xs italic text-gray-400">{entry.notes}</p>
              )}
              {entry.presentedViaZoom === true && (
                <div className="mt-1">
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                    title={zoomLabel}
                  >
                    {zoomLabel}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="flex shrink-0 flex-col items-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {whatsappUrl && isFuture && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-md bg-green-500 px-2 py-1 text-xs font-medium text-white hover:bg-green-600"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 fill-current"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Υπενθύμιση
            </a>
          )}
          {isCancelled ? (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600 transition hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60"
              title="Επανεισαγωγή αυτής της ημερομηνίας"
            >
              ↺ Επανεισαγωγή
            </button>
          ) : isConfirmed && isFuture ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
              title="Επιβεβαιωμένο"
            >
              ✓ Επιβεβαιωμένο
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
