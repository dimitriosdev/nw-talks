import {
  eachWeekOfInterval,
  startOfYear,
  endOfYear,
  format,
  getDay,
  addDays,
} from "date-fns";

/**
 * Return every occurrence of a given weekday (Saturday = 6, Sunday = 0)
 * in the specified year, excluding any blackout dates.
 *
 * @param year          — e.g. 2026
 * @param day           — "Saturday" | "Sunday"
 * @param blackoutDates — array of "YYYY-MM-DD" strings to skip
 * @returns sorted array of "YYYY-MM-DD" strings
 */
export function getDatesForYear(
  year: number,
  day: "Saturday" | "Sunday",
  blackoutDates: string[] = []
): string[] {
  const targetDay = day === "Sunday" ? 0 : 6;

  // eachWeekOfInterval gives the start (Monday by default) of each week.
  // We shift to the target day and filter to our year.
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const weeks = eachWeekOfInterval(
    { start: yearStart, end: yearEnd },
    { weekStartsOn: 1 } // Monday
  );

  const blackoutSet = new Set(blackoutDates);

  const dates: string[] = [];

  for (const weekStart of weeks) {
    // Calculate the offset from Monday (1) to the target day
    const offset = (targetDay - 1 + 7) % 7; // Sunday(0) → 6, Saturday(6) → 5
    const candidate = addDays(weekStart, offset);

    // Ensure the candidate falls within the requested year
    if (candidate.getFullYear() !== year) continue;

    // Sanity-check: the day of week must match
    if (getDay(candidate) !== targetDay) continue;

    const dateStr = format(candidate, "yyyy-MM-dd");
    if (!blackoutSet.has(dateStr)) {
      dates.push(dateStr);
    }
  }

  return dates;
}
