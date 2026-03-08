// import-titles.mjs
// Script to automate importing titles.json from scripts/imports/titles/
// - Fetches latest talks from Firestore
// - Compares schema, adds empty string for missing fields
// - Imports titles.json into Firestore

import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  getDocs,
  collection,
  doc,
  setDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";

const rootDir = resolve(".");
const importDir = resolve(rootDir, "scripts", "imports", "titles");
const importFile = resolve(importDir, "titles.json");

function parseEnvLocal(filePath) {
  const envText = readFileSync(filePath, "utf8");
  const out = {};
  for (const line of envText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed
      .slice(idx + 1)
      .trim()
      .replace(/^"|"$/g, "");
    out[key] = value;
  }
  return out;
}

const env = parseEnvLocal(resolve(rootDir, ".env.local"));
const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

async function fetchLatestTalks() {
  const snap = await getDocs(query(collection(db, "talks"), orderBy("id")));
  return snap.docs.map((d) => d.data());
}

function getSchema(talks) {
  // Collect all keys from all talks
  const keys = new Set();
  for (const t of talks) Object.keys(t).forEach((k) => keys.add(k));
  return Array.from(keys);
}

function normalizeRows(rows, schema) {
  // Always include 'category' in schema
  const fullSchema = schema.includes("category")
    ? schema
    : [...schema, "category"];
  return rows.map((row) => {
    const out = {};
    for (const key of fullSchema) {
      out[key] = key in row ? row[key] : "";
    }
    return out;
  });
}

async function importTitles() {
  // Step 1: Fetch latest schema
  const latest = await fetchLatestTalks();
  const schema = getSchema(latest);

  // Step 2: Read import file
  const rows = JSON.parse(readFileSync(importFile, "utf8"));
  const normalized = normalizeRows(rows, schema);

  // Step 3: Import
  const BATCH_SIZE = 400;
  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = normalized.slice(i, i + BATCH_SIZE);
    for (const row of chunk) {
      batch.set(doc(db, "talks", String(row.id)), row);
    }
    await batch.commit();
  }
  console.log(`Imported ${normalized.length} titles.`);
}

importTitles().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
