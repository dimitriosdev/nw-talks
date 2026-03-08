/**
 * Export speakers only to scripts/exports/[timestamp]/speakers.json
 * Usage:
 *   node scripts/export-speakers.mjs
 */

import { mkdirSync, writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const scriptsDir = resolve(rootDir, "scripts");
const exportsRootDir = resolve(scriptsDir, "exports");

function getTimestampLabel(date = new Date()) {
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`;
}

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

function writeJson(outputDir, fileName, payload) {
  const filePath = resolve(outputDir, fileName);
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function run() {
  const runLabel = getTimestampLabel();
  const outputDir = resolve(exportsRootDir, runLabel);
  mkdirSync(outputDir, { recursive: true });

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
  const speakersSnap = await getDocs(collection(db, "speakers"));
  const speakersJson = speakersSnap.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
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
  });
  speakersJson.sort((a, b) => {
    const byLast = a.lastName.localeCompare(b.lastName, "el");
    if (byLast !== 0) return byLast;
    return a.firstName.localeCompare(b.firstName, "el");
  });

  writeJson(outputDir, "speakers.json", speakersJson);
  console.log(`Export output directory: ${outputDir}`);
  console.log(`Exported speakers: ${speakersJson.length}`);
}

run().catch((error) => {
  console.error("Export speakers failed:", error);
  process.exit(1);
});
