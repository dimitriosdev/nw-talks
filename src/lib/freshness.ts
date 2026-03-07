import { differenceInMonths, parseISO } from "date-fns";
import type {
  FreshnessLevel,
  PresentationRecord,
  ScheduleEntry,
  Speaker,
  Talk,
  TalkWithFreshness,
} from "@/types";

/**
 * Classify a talk into one of three freshness tiers based on how many
 * months ago it was last presented:
 *
 * - **red**    — fewer than 6 months ago.  Should not be presented
 *               unless the admin explicitly overrides.
 * - **orange** — 6–12 months ago.  Not recommended but allowed.
 * - **green**  — 12+ months ago, or never presented.  Safe to assign.
 */
function classifyFreshness(monthsSince: number | null): FreshnessLevel {
  if (monthsSince === null) return "green"; // never presented
  if (monthsSince < 6) return "red";
  if (monthsSince < 12) return "orange";
  return "green";
}

/**
 * Given all schedule entries, speakers, and the full talk list,
 * compute freshness metadata for each talk.
 *
 * Freshness is determined by the 3-tier system:
 * - **red** — fewer than 6 months since last presented
 * - **orange** — 6–12 months
 * - **green** — 12+ months or never presented
 */
export function computeFreshness(
  talks: Talk[],
  allEntries: ScheduleEntry[],
  speakers: Speaker[],
  referenceDate: Date = new Date(),
): TalkWithFreshness[] {
  const speakerMap = new Map(speakers.map((s) => [s.id, s]));

  // Split entries into past and future based on reference date
  const referenceDateStr = referenceDate.toISOString().split("T")[0]; // YYYY-MM-DD
  const pastEntries = allEntries.filter(
    (entry) => entry.status === "confirmed" && entry.date < referenceDateStr,
  );
  const futureEntries = allEntries.filter(
    (entry) => entry.talkId !== null && entry.date >= referenceDateStr,
  );

  // Build a map of talkId → array of presentation records (past confirmed only)
  const presentationsMap = new Map<number, PresentationRecord[]>();

  for (const entry of pastEntries) {
    if (entry.talkId === null) continue;
    const record: PresentationRecord = {
      date: entry.date,
      speaker: entry.speakerId
        ? (speakerMap.get(entry.speakerId) ?? null)
        : null,
    };
    const list = presentationsMap.get(entry.talkId) ?? [];
    list.push(record);
    presentationsMap.set(entry.talkId, list);
  }

  // Build a map of talkId → next scheduled date (future only, any status)
  const futureScheduleMap = new Map<number, string>();
  for (const entry of futureEntries) {
    if (entry.talkId === null) continue;
    const currentNext = futureScheduleMap.get(entry.talkId);
    if (!currentNext || entry.date < currentNext) {
      futureScheduleMap.set(entry.talkId, entry.date);
    }
  }

  return talks.map((talk) => {
    const presentations = (presentationsMap.get(talk.id) ?? []).sort((a, b) =>
      b.date.localeCompare(a.date),
    ); // newest-first

    const lastDate = presentations.length > 0 ? presentations[0].date : null;

    const monthsSincePresented = lastDate
      ? differenceInMonths(referenceDate, parseISO(lastDate))
      : null;

    const freshnessLevel = classifyFreshness(monthsSincePresented);

    // Legacy boolean: true when green
    const isFresh = freshnessLevel === "green";

    // Check if this talk is scheduled for a future date
    const nextScheduledDate = futureScheduleMap.get(talk.id) ?? null;
    const isScheduledForFuture = nextScheduledDate !== null;

    return {
      ...talk,
      lastPresentedDate: lastDate,
      presentations,
      isFresh,
      freshnessLevel,
      monthsSincePresented,
      isScheduledForFuture,
      nextScheduledDate,
    };
  });
}
