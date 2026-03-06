/**
 * JSON-driven Firestore seed script for nw-talks.
 *
 * Usage:
 *   node scripts/seed.mjs
 *   node scripts/seed.mjs --reset
 *
 * Notes:
 * - Reads data from scripts/titles.json, scripts/speakers.json, scripts/YYYY.json
 * - Idempotent writes (stable document IDs)
 * - `--reset` deletes talks/speakers/schedule before importing
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  limit,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const scriptsDir = resolve(rootDir, "scripts");

const BATCH_SIZE = 400;
const LOCAL_CONGREGATION = "Zürich";
const args = new Set(process.argv.slice(2));
const shouldReset = args.has("--reset");

function parseEnvFile(filePath) {
  const envText = readFileSync(filePath, "utf8");
  const pairs = envText
    .split(/\r?\n/u)
    .filter((line) => line.trim() && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      if (idx < 0) return null;
      const key = line.slice(0, idx).trim();
      const rawValue = line.slice(idx + 1).trim();
      const value = rawValue.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      return [key, value];
    })
    .filter(Boolean);

  return Object.fromEntries(pairs);
}

function readJson(fileName) {
  const filePath = resolve(scriptsDir, fileName);
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toSlug(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function toYear(dateStr) {
  return Number(String(dateStr).slice(0, 4));
}

function dayNameFromIsoDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const day = d.getUTCDay();
  return day === 6 ? "Saturday" : "Sunday";
}

function inferMeetingDays(scheduleRows) {
  const perYear = new Map();

  for (const row of scheduleRows) {
    const year = toYear(row.date);
    const day = dayNameFromIsoDate(row.date);
    if (!perYear.has(year)) {
      perYear.set(year, { Saturday: 0, Sunday: 0 });
    }
    perYear.get(year)[day] += 1;
  }

  const out = {};
  for (const [year, counts] of perYear.entries()) {
    out[String(year)] =
      counts.Saturday >= counts.Sunday ? "Saturday" : "Sunday";
  }
  return out;
}

function makeSpeakerDocs(speakers) {
  const used = new Map();
  const speakerDocs = [];

  for (const speaker of speakers) {
    const base =
      toSlug(`${speaker.firstName}-${speaker.lastName}`) || "speaker";
    const seq = (used.get(base) ?? 0) + 1;
    used.set(base, seq);

    const id = seq === 1 ? base : `${base}-${seq}`;
    speakerDocs.push({ id, ...speaker });
  }

  return speakerDocs;
}

function buildSpeakerLookup(speakerDocs) {
  const byName = new Map();

  for (const speaker of speakerDocs) {
    const first = normalizeName(speaker.firstName);
    const last = normalizeName(speaker.lastName);
    const full = `${first} ${last}`.trim();
    const reverse = `${last} ${first}`.trim();
    if (full) byName.set(full, speaker.id);
    if (reverse) byName.set(reverse, speaker.id);
  }

  return {
    byName,
    fallbackMatch(rawName) {
      const normalized = normalizeName(rawName);
      if (!normalized) return null;

      const tokens = normalized.split(" ").filter(Boolean);
      if (tokens.length < 2) return null;

      let bestId = null;
      let bestScore = 0;
      let ties = 0;

      for (const speaker of speakerDocs) {
        const full = normalizeName(`${speaker.firstName} ${speaker.lastName}`);
        const fullTokens = new Set(full.split(" ").filter(Boolean));
        const score = tokens.reduce(
          (acc, token) => (fullTokens.has(token) ? acc + 1 : acc),
          0,
        );

        if (score > bestScore) {
          bestScore = score;
          bestId = speaker.id;
          ties = 0;
        } else if (score === bestScore && score > 0) {
          ties += 1;
        }
      }

      if (bestScore >= 2 && ties === 0) return bestId;
      return null;
    },
  };
}

function getScheduleStatus(entry, speakerId, todayIso) {
  const hasTalk = entry.talkId !== null;
  const hasSpeaker = Boolean(speakerId);
  const hasNotes = Boolean(entry.notes.trim());

  if (entry.date > todayIso) {
    if (!hasTalk && !hasSpeaker && hasNotes) return "cancelled";
    return "open";
  }

  if (!hasTalk && !hasSpeaker && hasNotes) return "cancelled";
  if (hasTalk || hasSpeaker) return "confirmed";
  return "open";
}

function validateTalks(talks) {
  const seen = new Set();
  for (const talk of talks) {
    if (typeof talk.id !== "number" || !Number.isInteger(talk.id)) {
      throw new Error(`Invalid talk id: ${JSON.stringify(talk)}`);
    }
    if (!talk.title || typeof talk.title !== "string") {
      throw new Error(`Invalid talk title for id=${talk.id}`);
    }
    if (seen.has(talk.id)) {
      throw new Error(`Duplicate talk id found: ${talk.id}`);
    }
    seen.add(talk.id);
  }
}

function validateSpeakers(speakers, talkIds) {
  for (const speaker of speakers) {
    if (!speaker.firstName || !speaker.lastName) {
      throw new Error(`Invalid speaker name: ${JSON.stringify(speaker)}`);
    }
    if (!Array.isArray(speaker.availableTalks)) {
      throw new Error(
        `Invalid availableTalks for ${speaker.firstName} ${speaker.lastName}`,
      );
    }
    for (const talkId of speaker.availableTalks) {
      if (!talkIds.has(talkId)) {
        throw new Error(
          `Unknown talk ${talkId} in availableTalks for ${speaker.firstName} ${speaker.lastName}`,
        );
      }
    }
  }
}

function validateScheduleRows(scheduleRows, talkIds) {
  const seenDates = new Set();
  for (const row of scheduleRows) {
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(row.date)) {
      throw new Error(`Invalid schedule date: ${row.date}`);
    }
    if (seenDates.has(row.date)) {
      throw new Error(`Duplicate schedule date found: ${row.date}`);
    }
    seenDates.add(row.date);

    if (row.talkId !== null && !talkIds.has(row.talkId)) {
      throw new Error(`Unknown talk ${row.talkId} referenced on ${row.date}`);
    }
  }
}

async function clearCollection(db, name) {
  while (true) {
    const snap = await getDocs(query(collection(db, name), limit(BATCH_SIZE)));
    if (snap.empty) return;

    const batch = writeBatch(db);
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
  }
}

async function upsertById(db, collectionName, rows, getId) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = rows.slice(i, i + BATCH_SIZE);

    for (const row of chunk) {
      const id = getId(row);
      batch.set(doc(db, collectionName, id), row);
    }

    await batch.commit();
  }
}

async function seed() {
  const env = parseEnvFile(resolve(rootDir, ".env.local"));
  const requiredEnv = [
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
  ];

  for (const key of requiredEnv) {
    if (!env[key]) {
      throw new Error(`Missing required env var in .env.local: ${key}`);
    }
  }

  const app = initializeApp({
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });

  const db = getFirestore(app);

  const talks = readJson("titles.json");
  const speakers = readJson("speakers.json");
  const yearlyFiles = readdirSync(scriptsDir)
    .filter((name) => /^\d{4}\.json$/u.test(name))
    .sort();

  const scheduleRows = yearlyFiles
    .flatMap((fileName) => readJson(fileName))
    .map((entry) => ({
      date: String(entry.date),
      talkId: entry.talkId === null ? null : Number(entry.talkId),
      speaker: entry.speaker ? String(entry.speaker) : null,
      notes: entry.notes ? String(entry.notes) : "",
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  validateTalks(talks);
  const talkIds = new Set(talks.map((t) => t.id));
  validateSpeakers(speakers, talkIds);
  validateScheduleRows(scheduleRows, talkIds);

  const speakerDocs = makeSpeakerDocs(speakers);
  const lookup = buildSpeakerLookup(speakerDocs);
  const unresolvedSpeakers = new Set();
  const todayIso = new Date().toISOString().slice(0, 10);

  const scheduleDocs = scheduleRows.map((entry) => {
    let speakerId = null;

    if (entry.speaker) {
      const normalized = normalizeName(entry.speaker);
      speakerId =
        lookup.byName.get(normalized) ?? lookup.fallbackMatch(entry.speaker);
      if (!speakerId) unresolvedSpeakers.add(entry.speaker);
    }

    return {
      id: entry.date,
      date: entry.date,
      talkId: entry.talkId,
      customTalkTitle: "",
      speakerId,
      status: getScheduleStatus(entry, speakerId, todayIso),
      notes: entry.notes,
    };
  });

  const years = scheduleRows.map((row) => toYear(row.date));
  const activeYear = Math.max(...years);
  const meetingDays = inferMeetingDays(scheduleRows);
  const meetingDay = meetingDays[String(activeYear)] ?? "Sunday";

  if (shouldReset) {
    console.log("Reset mode enabled: deleting talks, speakers, schedule...");
    await clearCollection(db, "talks");
    await clearCollection(db, "speakers");
    await clearCollection(db, "schedule");
  }

  console.log("Seeding settings...");
  await setDoc(
    doc(db, "settings", "global"),
    {
      activeYear,
      meetingDay,
      meetingDays,
      localCongregation: LOCAL_CONGREGATION,
    },
    { merge: true },
  );

  console.log(`Seeding talks (${talks.length})...`);
  await upsertById(db, "talks", talks, (row) => String(row.id));

  console.log(`Seeding speakers (${speakerDocs.length})...`);
  await upsertById(db, "speakers", speakerDocs, (row) => row.id);

  console.log(`Seeding schedule (${scheduleDocs.length})...`);
  await upsertById(db, "schedule", scheduleDocs, (row) => row.id);

  if (unresolvedSpeakers.size > 0) {
    console.warn(
      `Unresolved speaker names (${unresolvedSpeakers.size}):`,
      [...unresolvedSpeakers].sort(),
    );
  }

  console.log("Seed complete.");
  console.log(`Years loaded: ${yearlyFiles.join(", ")}`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
