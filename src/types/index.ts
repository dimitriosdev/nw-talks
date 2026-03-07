// ---------------------------------------------------------------------------
// NW-Talks — Shared TypeScript types
// Mirrors the Firestore data model defined in docs/PROJECT_SPEC.md §3
// ---------------------------------------------------------------------------

/** A public talk (static reference data). */
export interface Talk {
  /** Numeric primary key, e.g. 25. Used as the Firestore document ID. */
  id: number;
  /** The theme / title of the talk. */
  title: string;
}

/** A speaker who can be assigned to a scheduled date. */
export interface Speaker {
  /** Firestore auto-generated document ID. */
  id: string;
  /** First name. */
  firstName: string;
  /** Last name. */
  lastName: string;
  /** Congregation the speaker belongs to. */
  congregation: string;
  /** Phone number. */
  phone: string;
  /** Talk IDs this speaker is qualified to present. */
  availableTalks: number[];
}

/** Allowed schedule-entry statuses. */
export type ScheduleStatus = "open" | "confirmed" | "cancelled";

/** A single entry in the schedule collection. */
export interface ScheduleEntry {
  /** Firestore auto-generated document ID. */
  id: string;
  /** Date string in `YYYY-MM-DD` format. */
  date: string;
  /** FK → talks.id. `null` when the date is still open or a special talk. */
  talkId: number | null;
  /** Free-text title for special talks / events (used when talkId is null). */
  customTalkTitle: string;
  /** FK → speakers.id. `null` when the date is still open. */
  speakerId: string | null;
  /** Current status of the schedule entry. */
  status: ScheduleStatus;
  /** Optional admin remarks (e.g. "Memorial week — no talk"). */
  notes: string;
}

/** Global application settings (single doc: settings/global). */
export interface Settings {
  /** The year currently being managed. */
  activeYear: number;
  /** Default day of the week for the weekend meeting. */
  meetingDay: "Saturday" | "Sunday";
  /** Per-year mapping of meeting day, e.g. { "2025": "Saturday", "2026": "Sunday" }. */
  meetingDays?: Record<string, "Saturday" | "Sunday">;
  /** Name of the local / home congregation (e.g. "Zürich"). */
  localCongregation: string;
  /** Google emails that are allowed admin access. */
  adminEmails: string[];
}

// ---------------------------------------------------------------------------
// Convenience / derived types used in the UI
// ---------------------------------------------------------------------------

/** A single past presentation of a talk. */
export interface PresentationRecord {
  /** Date of the presentation in `YYYY-MM-DD` format. */
  date: string;
  /** The speaker who presented, or `null` if unknown. */
  speaker: Speaker | null;
}

/**
 * Three-tier freshness classification.
 * - `green`  — 12+ months since last presentation (or never presented). Safe to assign.
 * - `orange` — 6–12 months. Not recommended but allowed.
 * - `red`    — < 6 months. Should not be presented; admin override required.
 */
export type FreshnessLevel = "green" | "orange" | "red";

/** A talk enriched with freshness metadata for display. */
export interface TalkWithFreshness extends Talk {
  /** The date it was last presented (confirmed), or `null` if never. */
  lastPresentedDate: string | null;
  /** Full history of confirmed presentations, newest-first. */
  presentations: PresentationRecord[];
  /** Whether the talk is currently considered "fresh" (safe to assign). */
  isFresh: boolean;
  /** Three-tier freshness level: green / orange / red. */
  freshnessLevel: FreshnessLevel;
  /** Number of months since the talk was last presented, or `null` if never. */
  monthsSincePresented: number | null;
  /** Whether this talk is scheduled for a future date (confirmed). */
  isScheduledForFuture: boolean;
  /** The next scheduled date for this talk, or `null` if not scheduled. */
  nextScheduledDate: string | null;
}

/** A schedule entry joined with its related speaker & talk data. */
export interface ScheduleEntryPopulated extends ScheduleEntry {
  speaker: Speaker | null;
  talk: Talk | null;
}
