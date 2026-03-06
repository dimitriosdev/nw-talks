/**
 * Reverse export script: Firestore -> JSON files in /scripts.
 *
 * Usage:
 *   node scripts/revert-export.mjs
 *   npm run revert:export
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const scriptsDir = resolve(rootDir, "scripts");

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

function writeJson(fileName, payload) {
  const filePath = resolve(scriptsDir, fileName);
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function toSpeakerName(speaker) {
  const first = String(speaker.firstName ?? "").trim();
  const last = String(speaker.lastName ?? "").trim();
  return `${first} ${last}`.trim() || null;
}

function toYear(dateStr) {
  return Number(String(dateStr).slice(0, 4));
}

async function run() {
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

  const talksSnap = await getDocs(
    query(collection(db, "talks"), orderBy("id")),
  );
  const speakersSnap = await getDocs(
    query(
      collection(db, "speakers"),
      orderBy("lastName"),
      orderBy("firstName"),
    ),
  );
  const scheduleSnap = await getDocs(
    query(collection(db, "schedule"), orderBy("date")),
  );

  const talksJson = talksSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: Number(data.id ?? docSnap.id),
      title: String(data.title ?? ""),
    };
  });

  const speakersById = new Map();
  const speakersJson = speakersSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    const speaker = {
      firstName: String(data.firstName ?? ""),
      lastName: String(data.lastName ?? ""),
      congregation: String(data.congregation ?? ""),
      phone: String(data.phone ?? ""),
      availableTalks: Array.isArray(data.availableTalks)
        ? data.availableTalks
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id))
            .sort((a, b) => a - b)
        : [],
    };

    speakersById.set(docSnap.id, speaker);
    return speaker;
  });

  const scheduleByYear = new Map();
  for (const docSnap of scheduleSnap.docs) {
    const data = docSnap.data();
    const date = String(data.date ?? "");
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(date)) continue;

    const year = toYear(date);
    const talkIdRaw = data.talkId;
    const talkId = Number.isInteger(talkIdRaw) ? talkIdRaw : null;

    let speaker = null;
    if (typeof data.speakerId === "string" && data.speakerId) {
      const speakerRow = speakersById.get(data.speakerId);
      speaker = speakerRow ? toSpeakerName(speakerRow) : null;
    }

    const row = {
      date,
      talkId,
      speaker,
      notes: String(data.notes ?? ""),
    };

    const bucket = scheduleByYear.get(year) ?? [];
    bucket.push(row);
    scheduleByYear.set(year, bucket);
  }

  writeJson("titles.json", talksJson);
  writeJson("speakers.json", speakersJson);

  const years = [...scheduleByYear.keys()].sort((a, b) => a - b);
  for (const year of years) {
    const rows = scheduleByYear
      .get(year)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    writeJson(`${year}.json`, rows);
  }

  console.log(`Exported talks: ${talksJson.length}`);
  console.log(`Exported speakers: ${speakersJson.length}`);
  console.log(`Exported schedule years: ${years.join(", ") || "none"}`);
  console.log("Revert export complete.");
}

run().catch((error) => {
  console.error("Revert export failed:", error);
  process.exit(1);
});
