/**
 * Import schedule for a specified year from scripts/YYYY.json into Firestore.
 * Usage:
 *   node scripts/import-schedule.mjs 2026
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, writeBatch } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const scriptsDir = resolve(rootDir, "scripts");

function parseEnvFile(filePath) {
  const envText = readFileSync(filePath, "utf8");
  return Object.fromEntries(
    envText
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
      .filter(Boolean)
  );
}

async function run() {
  const yearArg = process.argv[2];
  if (!yearArg || !/^\d{4}$/.test(yearArg)) {
    console.error("Usage: node scripts/import-schedule.mjs <year>");
    process.exit(1);
  }
  const year = Number(yearArg);
  const inputFile = resolve(scriptsDir, `${year}.json`);

  let scheduleData;
  try {
    scheduleData = JSON.parse(readFileSync(inputFile, "utf8"));
  } catch (err) {
    console.error(`Failed to read or parse ${inputFile}:`, err);
    process.exit(1);
  }

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
  const scheduleCol = collection(db, "schedule");
  const BATCH_SIZE = 400;

  for (let i = 0; i < scheduleData.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = scheduleData.slice(i, i + BATCH_SIZE);
    for (const entry of chunk) {
      // Generate a new doc ref for each entry
      const ref = doc(scheduleCol);
      batch.set(ref, {
        ...entry,
        id: ref.id,
      });
    }
    await batch.commit();
  }

  console.log(`Imported ${scheduleData.length} schedule entries for ${year}.`);
}

run().catch((error) => {
  console.error("Import schedule failed:", error);
  process.exit(1);
});
