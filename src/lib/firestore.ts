import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";
import type {
  Talk,
  Speaker,
  ScheduleEntry,
  ScheduleStatus,
  Settings,
} from "@/types";
import { getDatesForYear } from "./dates";

/** Shorthand — lazy accessor so we never call Firestore at module-eval time. */
const db = () => getFirebaseDb();

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const SETTINGS_REF = () => doc(db(), "settings", "global");

export async function getSettings(): Promise<Settings | null> {
  const snap = await getDoc(SETTINGS_REF());
  return snap.exists() ? (snap.data() as Settings) : null;
}

export async function saveSettings(settings: Partial<Settings>): Promise<void> {
  await setDoc(SETTINGS_REF(), settings, { merge: true });
}

// ---------------------------------------------------------------------------
// Talks
// ---------------------------------------------------------------------------

const talksCol = () => collection(db(), "talks");

export async function getTalks(): Promise<Talk[]> {
  const snap = await getDocs(query(talksCol(), orderBy("id")));
  return snap.docs.map((d) => ({ id: d.data().id, title: d.data().title }));
}

export async function getTalk(id: number): Promise<Talk | null> {
  const snap = await getDoc(doc(db(), "talks", String(id)));
  return snap.exists() ? (snap.data() as Talk) : null;
}

export async function saveTalk(talk: Talk): Promise<void> {
  await setDoc(doc(db(), "talks", String(talk.id)), talk);
}

export async function deleteTalk(id: number): Promise<void> {
  await deleteDoc(doc(db(), "talks", String(id)));
}

/** Bulk-import an array of talks. Uses batched writes (max 500 per batch). */
export async function importTalks(talks: Talk[]): Promise<void> {
  const BATCH_SIZE = 500;
  for (let i = 0; i < talks.length; i += BATCH_SIZE) {
    const batch = writeBatch(db());
    const chunk = talks.slice(i, i + BATCH_SIZE);
    for (const talk of chunk) {
      batch.set(doc(db(), "talks", String(talk.id)), talk);
    }
    await batch.commit();
  }
}

// ---------------------------------------------------------------------------
// Speakers
// ---------------------------------------------------------------------------

const speakersCol = () => collection(db(), "speakers");

export async function getSpeakers(): Promise<Speaker[]> {
  const snap = await getDocs(query(speakersCol(), orderBy("lastName")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Speaker);
}

export async function getSpeaker(id: string): Promise<Speaker | null> {
  const snap = await getDoc(doc(db(), "speakers", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Speaker) : null;
}

export async function saveSpeaker(
  speaker: Omit<Speaker, "id"> & { id?: string },
): Promise<string> {
  if (speaker.id) {
    const ref = doc(db(), "speakers", speaker.id);
    await setDoc(ref, speaker);
    return speaker.id;
  }
  // Create with auto-ID
  const ref = doc(speakersCol());
  await setDoc(ref, { ...speaker, id: ref.id });
  return ref.id;
}

export async function deleteSpeaker(id: string): Promise<void> {
  await deleteDoc(doc(db(), "speakers", id));
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

const scheduleCol = () => collection(db(), "schedule");

export async function getScheduleEntries(
  year?: number,
): Promise<ScheduleEntry[]> {
  let q;
  if (year) {
    q = query(
      scheduleCol(),
      where("date", ">=", `${year}-01-01`),
      where("date", "<=", `${year}-12-31`),
      orderBy("date"),
    );
  } else {
    q = query(scheduleCol(), orderBy("date"));
  }
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ customTalkTitle: "", ...d.data(), id: d.id }) as ScheduleEntry);
}

export async function getConfirmedEntries(): Promise<ScheduleEntry[]> {
  const q = query(scheduleCol(), where("status", "==", "confirmed"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ customTalkTitle: "", ...d.data(), id: d.id }) as ScheduleEntry);
}

/** Return the distinct years that have at least one schedule entry. */
export async function getScheduleYears(): Promise<number[]> {
  const snap = await getDocs(scheduleCol());
  const years = new Set<number>();
  for (const d of snap.docs) {
    const date = (d.data() as ScheduleEntry).date;
    if (date) years.add(Number(date.slice(0, 4)));
  }
  return [...years].sort((a, b) => b - a);
}

export async function updateScheduleEntry(
  id: string,
  data: Partial<Omit<ScheduleEntry, "id">>,
): Promise<void> {
  await updateDoc(doc(db(), "schedule", id), data as DocumentData);
}

export async function deleteScheduleEntry(id: string): Promise<void> {
  await deleteDoc(doc(db(), "schedule", id));
}

export async function createScheduleEntry(
  data: Omit<ScheduleEntry, "id">,
): Promise<string> {
  const ref = doc(scheduleCol());
  await setDoc(ref, { ...data, id: ref.id });
  return ref.id;
}

/**
 * Initialise a year's schedule. Creates `open` entries for every occurrence
 * of the preferred day that doesn't already exist.
 */
export async function initializeYear(
  year: number,
  day: "Saturday" | "Sunday",
  blackoutDates: string[] = [],
): Promise<number> {
  const dates = getDatesForYear(year, day, blackoutDates);

  // Fetch existing dates for this year to preserve them
  const existing = await getScheduleEntries(year);
  const existingDateSet = new Set(existing.map((e) => e.date));

  const batch = writeBatch(db());
  let created = 0;

  for (const date of dates) {
    if (existingDateSet.has(date)) continue; // idempotent
    const ref = doc(scheduleCol());
    batch.set(ref, {
      id: ref.id,
      date,
      talkId: null,
      customTalkTitle: "",
      speakerId: null,
      status: "open" as ScheduleStatus,
      notes: "",
    });
    created++;
  }

  if (created > 0) await batch.commit();
  return created;
}
