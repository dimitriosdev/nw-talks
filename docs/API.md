# API Reference

Complete reference for functions, hooks, and utilities in NW-Talks.

---

## Table of Contents

1. [Hooks](#hooks)
2. [Firestore Functions](#firestore-functions)
3. [Auth Functions](#auth-functions)
4. [Freshness Functions](#freshness-functions)
5. [Date Functions](#date-functions)
6. [Localization](#localization)
7. [Types](#types)

---

## Hooks

### `useAuth()`

**Location:** `src/hooks/useAuth.tsx`

**Purpose:** Get current Firebase auth state and admin status

**Returns:**

```tsx
{
  user: User | null; // Firebase user object
  isAdmin: boolean; // true if email in adminEmails
  loading: boolean; // true during initial auth check
}
```

**Example:**

```tsx
import { useAuth } from "@/hooks/useAuth";

function AdminButton() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!isAdmin) return null;

  return <button>Admin Actions</button>;
}
```

---

### `usePreferences()`

**Location:** `src/hooks/usePreferences.tsx`

**Purpose:** Get/set language, theme, and localized texts

**Returns:**

```tsx
{
  language: "en" | "el"       // Current language
  setLanguage: (lang) => void // Change language
  theme: "light" | "dark"     // Current theme
  setTheme: (theme) => void   // Change theme
  texts: AppTranslations      // Localized strings
}
```

**Example:**

```tsx
import { usePreferences } from "@/hooks/usePreferences";

function LanguageToggle() {
  const { language, setLanguage, texts } = usePreferences();

  return (
    <button onClick={() => setLanguage(language === "en" ? "el" : "en")}>
      {texts.navbar.switchLanguage}
    </button>
  );
}
```

**Storage:** Persisted in `localStorage` as `nw-talks-preferences`

---

### `useSchedule(year: number)`

**Location:** `src/hooks/useSchedule.ts`

**Purpose:** Fetch and filter schedule entries for a year

**Parameters:**

- `year` — The year to fetch (e.g., 2026)

**Returns:**

```tsx
{
  entries: ScheduleEntry[]    // All schedule entries
  loading: boolean            // true while fetching
  error: Error | null         // Error if fetch failed
}
```

**Example:**

```tsx
import { useSchedule } from "@/hooks/useSchedule";

function SchedulePage() {
  const { entries, loading } = useSchedule(2026);

  if (loading) return <Spinner />;

  return entries.map((entry) => <ScheduleCard key={entry.id} entry={entry} />);
}
```

---

## Firestore Functions

All Firestore operations are in `src/lib/firestore.ts`

### Settings

#### `getSettings(): Promise<Settings | null>`

Fetch global settings from `settings/global`

**Returns:** Settings object or `null` if not found

**Example:**

```tsx
const settings = await getSettings();
console.log(settings?.activeYear); // 2026
```

---

#### `saveSettings(settings: Partial<Settings>): Promise<void>`

Update global settings (merges with existing)

**Parameters:**

- `settings` — Partial settings object to update

**Example:**

```tsx
await saveSettings({ activeYear: 2027 });
```

---

### Talks

#### `getTalks(): Promise<Talk[]>`

Fetch all talks, ordered by ID

**Returns:** Array of talks

**Example:**

```tsx
const talks = await getTalks();
// [{ id: 1, title: "..." }, ...]
```

---

#### `getTalk(id: number): Promise<Talk | null>`

Fetch a single talk by ID

**Parameters:**

- `id` — Talk ID (e.g., 25)

**Returns:** Talk object or `null` if not found

**Example:**

```tsx
const talk = await getTalk(25);
```

---

#### `saveTalk(talk: Talk): Promise<void>`

Create or update a talk

**Parameters:**

- `talk` — Full talk object with `id` and `title`

**Example:**

```tsx
await saveTalk({ id: 201, title: "New Talk" });
```

---

#### `deleteTalk(id: number): Promise<void>`

Delete a talk by ID

**Parameters:**

- `id` — Talk ID to delete

**Example:**

```tsx
await deleteTalk(201);
```

---

#### `importTalks(talks: Talk[]): Promise<void>`

Bulk-import talks (batched writes, max 500 per batch)

**Parameters:**

- `talks` — Array of talk objects

**Example:**

```tsx
const talks = [
  { id: 1, title: "Talk 1" },
  { id: 2, title: "Talk 2" },
  // ... 200 more
];
await importTalks(talks);
```

---

### Speakers

#### `getSpeakers(): Promise<Speaker[]>`

Fetch all speakers, ordered by last name

**Returns:** Array of speakers

**Example:**

```tsx
const speakers = await getSpeakers();
// [{ id: "abc", firstName: "John", ... }, ...]
```

---

#### `getSpeaker(id: string): Promise<Speaker | null>`

Fetch a single speaker by ID

**Parameters:**

- `id` — Firestore document ID

**Returns:** Speaker object or `null`

**Example:**

```tsx
const speaker = await getSpeaker("abc123");
```

---

#### `saveSpeaker(speaker: Omit<Speaker, "id"> & { id?: string }): Promise<string>`

Create or update a speaker

**Parameters:**

- `speaker` — Speaker object (omit `id` for new, include for update)

**Returns:** Document ID (new or existing)

**Example:**

```tsx
// Create new
const id = await saveSpeaker({
  firstName: "John",
  lastName: "Doe",
  congregation: "Zürich",
  phone: "555-1234",
  availableTalks: [1, 5, 25],
});

// Update existing
await saveSpeaker({
  id: "abc123",
  firstName: "Jane",
  lastName: "Smith",
  // ...
});
```

---

#### `deleteSpeaker(id: string): Promise<void>`

Delete a speaker by ID

**Parameters:**

- `id` — Firestore document ID

**Example:**

```tsx
await deleteSpeaker("abc123");
```

---

### Schedule

#### `getScheduleEntries(year?: number): Promise<ScheduleEntry[]>`

Fetch schedule entries, optionally filtered by year

**Parameters:**

- `year` (optional) — Filter by year (e.g., 2026)

**Returns:** Array of schedule entries, sorted by date

**Example:**

```tsx
// All entries
const all = await getScheduleEntries();

// Only 2026
const entries2026 = await getScheduleEntries(2026);
```

---

#### `getScheduleEntry(id: string): Promise<ScheduleEntry | null>`

Fetch a single schedule entry by ID

**Parameters:**

- `id` — Firestore document ID

**Returns:** Schedule entry or `null`

**Example:**

```tsx
const entry = await getScheduleEntry("xyz789");
```

---

#### `saveScheduleEntry(entry: Partial<ScheduleEntry> & { id?: string }): Promise<string>`

Create or update a schedule entry

**Parameters:**

- `entry` — Schedule entry object

**Returns:** Document ID

**Example:**

```tsx
await saveScheduleEntry({
  date: "2026-03-15",
  talkId: 25,
  speakerId: "abc123",
  status: "confirmed",
  notes: "",
});
```

---

#### `deleteScheduleEntry(id: string): Promise<void>`

Delete a schedule entry by ID

**Parameters:**

- `id` — Firestore document ID

**Example:**

```tsx
await deleteScheduleEntry("xyz789");
```

---

#### `initializeYear(year: number, day: "Saturday" | "Sunday"): Promise<void>`

Auto-generate schedule entries for a year

**Parameters:**

- `year` — Year to initialize (e.g., 2026)
- `day` — Meeting day ("Saturday" or "Sunday")

**Logic:**

1. Gets all existing entries for the year
2. Generates dates using `getDatesForYear()`
3. Creates entries for missing dates only (idempotent)
4. Sets `status: "open"`, `talkId: null`, `speakerId: null`

**Example:**

```tsx
await initializeYear(2026, "Sunday");
```

---

## Auth Functions

**Location:** `src/lib/auth.ts`

### `googleSignIn(): Promise<void>`

Sign in with Google popup

**Example:**

```tsx
import { googleSignIn } from "@/lib/auth";

function LoginButton() {
  return <button onClick={googleSignIn}>Sign In</button>;
}
```

---

### `signOut(): Promise<void>`

Sign out current user

**Example:**

```tsx
import { signOut } from "@/lib/auth";

function LogoutButton() {
  return <button onClick={signOut}>Sign Out</button>;
}
```

---

### `isAdmin(email: string | null): Promise<boolean>`

Check if email is in admin allow-list

**Parameters:**

- `email` — User's email address

**Returns:** `true` if admin, `false` otherwise

**Example:**

```tsx
import { isAdmin } from "@/lib/auth";

const admin = await isAdmin("user@example.com");
if (admin) {
  // Show admin UI
}
```

**Note:** Reads from `settings/global.adminEmails`

---

### `onAuthChange(callback: (user: User | null) => void): () => void`

Listen to auth state changes

**Parameters:**

- `callback` — Called with user object when auth state changes

**Returns:** Unsubscribe function

**Example:**

```tsx
import { onAuthChange } from "@/lib/auth";

const unsub = onAuthChange((user) => {
  if (user) {
    console.log("Signed in:", user.email);
  } else {
    console.log("Signed out");
  }
});

// Later: unsub()
```

---

## Freshness Functions

**Location:** `src/lib/freshness.ts`

### `computeFreshness(talks, confirmedEntries, speakers, referenceDate?): TalkWithFreshness[]`

Calculate freshness for all talks

**Parameters:**

- `talks` — Array of all talks
- `confirmedEntries` — Schedule entries with `status: "confirmed"`
- `speakers` — Array of all speakers
- `referenceDate` (optional) — Date to calculate from (default: now)

**Returns:** Array of talks with freshness metadata

**Algorithm:**

1. For each talk, find all confirmed presentations
2. Get most recent date
3. Calculate months since presented
4. Classify as:
   - **Green:** 12+ months or never
   - **Orange:** 6-12 months
   - **Red:** <6 months

**Example:**

```tsx
import { computeFreshness } from "@/lib/freshness";

const talks = await getTalks();
const entries = await getScheduleEntries();
const speakers = await getSpeakers();

const confirmed = entries.filter((e) => e.status === "confirmed");
const withFreshness = computeFreshness(talks, confirmed, speakers);

withFreshness.forEach((talk) => {
  console.log(talk.title, talk.freshnessLevel); // "green" | "orange" | "red"
});
```

**Return Type:**

```tsx
{
  ...talk,                           // Original talk fields
  lastPresentedDate: string | null   // "YYYY-MM-DD" or null
  presentations: PresentationRecord[] // All presentations, newest first
  isFresh: boolean                   // true if green
  freshnessLevel: FreshnessLevel     // "green" | "orange" | "red"
  monthsSincePresented: number | null // Months since last, or null
}
```

---

## Date Functions

**Location:** `src/lib/dates.ts`

### `getDatesForYear(year, day, blackoutDates?): string[]`

Generate all occurrences of a weekday in a year

**Parameters:**

- `year` — Year number (e.g., 2026)
- `day` — `"Saturday"` or `"Sunday"`
- `blackoutDates` (optional) — Array of `"YYYY-MM-DD"` to exclude

**Returns:** Sorted array of date strings in `YYYY-MM-DD` format

**Example:**

```tsx
import { getDatesForYear } from "@/lib/dates";

// All Sundays in 2026
const sundays = getDatesForYear(2026, "Sunday");
// ["2026-01-04", "2026-01-11", ...]

// Exclude conventions
const blackout = ["2026-06-14", "2026-06-21"];
const available = getDatesForYear(2026, "Sunday", blackout);
```

---

## Localization

**Location:** `src/lib/localization.ts`

### `getTranslations(language: "en" | "el"): AppTranslations`

Get all localized strings for a language

**Parameters:**

- `language` — `"en"` (English) or `"el"` (Greek)

**Returns:** Nested object with all translations

**Example:**

```tsx
import { getTranslations } from "@/lib/localization";

const en = getTranslations("en");
console.log(en.navbar.home); // "Home"

const el = getTranslations("el");
console.log(el.navbar.home); // "Αρχική"
```

**Structure:**

```tsx
{
  navbar: { home, talks, admin, ... },
  talks: {
    freshness: { greenLabel, orangeLabel, redLabel, ... },
    searchPlaceholder,
    ...
  },
  schedule: { ... },
  speakers: { ... },
  settings: { ... },
  ...
}
```

---

### Constants

```tsx
export const DEFAULT_LANGUAGE = "en";
export const DEFAULT_THEME = "light";
```

---

## Types

**Location:** `src/types/index.ts`

### Core Entities

#### `Talk`

```tsx
interface Talk {
  id: number; // Numeric ID (1-200)
  title: string; // Talk title
}
```

#### `Speaker`

```tsx
interface Speaker {
  id: string; // Firestore document ID
  firstName: string;
  lastName: string;
  congregation: string;
  phone: string;
  availableTalks: number[]; // Talk IDs
}
```

#### `ScheduleEntry`

```tsx
interface ScheduleEntry {
  id: string; // Firestore document ID
  date: string; // "YYYY-MM-DD"
  talkId: number | null; // FK to Talk, null if open
  customTalkTitle: string; // Free text for special talks
  speakerId: string | null; // FK to Speaker, null if open
  status: ScheduleStatus; // "open" | "confirmed" | "cancelled"
  notes: string; // Admin remarks
}
```

#### `Settings`

```tsx
interface Settings {
  activeYear: number; // Current year
  meetingDay: "Saturday" | "Sunday"; // Default meeting day
  meetingDays?: Record<string, "Saturday" | "Sunday">; // Per-year overrides
  localCongregation: string; // Home congregation name
  adminEmails: string[]; // Admin allow-list
}
```

### Derived Types

#### `TalkWithFreshness`

```tsx
interface TalkWithFreshness extends Talk {
  lastPresentedDate: string | null; // Most recent presentation
  presentations: PresentationRecord[]; // All presentations
  isFresh: boolean; // true if green
  freshnessLevel: FreshnessLevel; // "green" | "orange" | "red"
  monthsSincePresented: number | null; // Months since last
}
```

#### `PresentationRecord`

```tsx
interface PresentationRecord {
  date: string; // "YYYY-MM-DD"
  speaker: Speaker | null;
}
```

#### `FreshnessLevel`

```tsx
type FreshnessLevel = "green" | "orange" | "red";
```

#### `ScheduleStatus`

```tsx
type ScheduleStatus = "open" | "confirmed" | "cancelled";
```

---

## Error Handling

All async Firestore functions can throw errors. Wrap in try/catch:

```tsx
try {
  await saveTalk({ id: 1, title: "Updated" });
  setSuccess("Saved!");
} catch (error) {
  console.error(error);
  setError("Failed to save");
}
```

**Common errors:**

- **Permission denied:** User not admin
- **Network error:** No internet connection
- **Not found:** Document doesn't exist

---

## TypeScript Tips

### Firestore Type Casting

Firestore returns `DocumentData` — always cast to your types:

```tsx
const snap = await getDoc(docRef);
const data = snap.data() as Talk;
```

### Partial Updates

Use `Partial<T>` for update operations:

```tsx
function updateSettings(updates: Partial<Settings>) {
  await saveSettings(updates);
}

updateSettings({ activeYear: 2027 }); // OK, don't need all fields
```

### Type Guards

Check types before use:

```tsx
if (entry.talkId !== null) {
  const talk = await getTalk(entry.talkId); // TypeScript knows talkId is number
}
```

---

## Performance Notes

### Batch Writes

Use `importTalks()` for bulk imports (500 per batch):

```tsx
// ❌ Slow (200 individual writes)
for (const talk of talks) {
  await saveTalk(talk);
}

// ✅ Fast (batched)
await importTalks(talks);
```

### Query Optimization

Firestore charges per document read. Optimize queries:

```tsx
// ❌ Reads all entries
const all = await getScheduleEntries();
const filtered = all.filter((e) => e.status === "confirmed");

// ✅ Filter in query (requires Firestore index)
const confirmed = await getDocs(
  query(collection(db(), "schedule"), where("status", "==", "confirmed")),
);
```

### Caching

Consider caching settings (rarely change):

```tsx
let cachedSettings: Settings | null = null;

async function getSettingsCached() {
  if (!cachedSettings) {
    cachedSettings = await getSettings();
  }
  return cachedSettings;
}
```

---

## Next Steps

- See [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
- See [SETUP.md](./SETUP.md) for environment setup
- See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for requirements
