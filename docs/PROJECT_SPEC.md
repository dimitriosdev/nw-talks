# NW-Talks — Project Specification

> This document serves as the single source of truth for the application. When prompting GitHub Copilot, ensure this file is open and referenced.

---

## 1. Goal

Build a mobile-first web application for a congregation to manage public talk schedules. The system replaces a manual Excel workflow with automated date generation, "talk freshness" validation, and distinct access levels for admins and speakers.

---

## 2. Technical Architecture

| Layer           | Technology                                                             |
| --------------- | ---------------------------------------------------------------------- |
| Framework       | Next.js 15 (App Router) with TypeScript                                |
| Styling         | Tailwind CSS 4 (Mobile-first, responsive design)                       |
| Database        | Firebase Firestore (NoSQL)                                             |
| Authentication  | Firebase Auth (Google Login for Admins; Public/read-only for Speakers) |
| Date Utilities  | `date-fns`                                                             |
| Deployment      | Vercel                                                                 |
| Node            | >= 20 LTS                                                              |
| Package Manager | npm                                                                    |

### 2a. Environment Variables

The following env vars are required (stored in `.env.local`, never committed):

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

## 3. Data Entities (Firestore Collections)

### `talks` (Static Reference Data)

| Field   | Type   | Notes                                |
| ------- | ------ | ------------------------------------ |
| `id`    | Number | Document ID / Primary Key (e.g., 25) |
| `title` | String | The theme of the talk                |

> **Seeding:** The initial 200 talks are loaded via an admin-only "Import Talks" feature that accepts a JSON or CSV file. Talks can also be added/edited individually.

### `speakers`

| Field            | Type          | Notes                                |
| ---------------- | ------------- | ------------------------------------ |
| `id`             | String (auto) | Firestore auto-generated document ID |
| `firstName`      | String        | First name                           |
| `lastName`       | String        | Last name                            |
| `congregation`   | String        | Congregation name                    |
| `phone`          | String        | Phone number                         |
| `availableTalks` | Number[]      | Talk IDs this speaker can present    |

### `schedule` (The "Live" Plan)

| Field       | Type           | Notes                                              |
| ----------- | -------------- | -------------------------------------------------- |
| `id`        | String (auto)  | Firestore auto-generated document ID               |
| `date`      | String         | Format: `YYYY-MM-DD`                               |
| `talkId`    | Number \| null | FK → `talks`. `null` when date is open             |
| `speakerId` | String \| null | FK → `speakers`. `null` when date is open          |
| `status`    | String         | `open` · `pending` · `confirmed` · `cancelled`     |
| `notes`     | String         | Optional remarks (e.g., "Memorial week — no talk") |

### `settings` (Single Document: `settings/global`)

| Field               | Type                       | Notes                                               |
| ------------------- | -------------------------- | --------------------------------------------------- |
| `activeYear`        | Number                     | Currently managed year                              |
| `preferredDay`      | `'Saturday'` \| `'Sunday'` | Day of the week for talks                           |
| `localCongregation` | String                     | Name of the home congregation (e.g. "Zürich")       |
| `adminEmails`       | String[]                   | Allow-list of Google emails that grant admin access |

---

## 4. Authentication & Authorization

### Admin access

1. User signs in with **Google** via Firebase Auth.
2. The app checks if `user.email` exists in `settings/global.adminEmails`.
3. If yes → full read/write access. If no → redirect to the public speaker view.

### Speaker (public) access

- No login required.
- Read-only access to the schedule and talk gallery.
- Speakers never write to Firestore directly.

### Route Protection

- All `/admin/*` routes are protected by a **Next.js middleware** or layout-level auth check.
- Unauthenticated users accessing `/admin/*` are redirected to `/`.

---

## 5. App Routes & Page Structure

| Route             | Access | Description                                                                   |
| ----------------- | ------ | ----------------------------------------------------------------------------- |
| `/`               | Public | Landing / upcoming schedule view (card list)                                  |
| `/talks`          | Public | Searchable "Talk Gallery" — browse all 200 talks with freshness indicators    |
| `/login`          | Public | Google sign-in page                                                           |
| `/admin`          | Admin  | Dashboard — overview of upcoming open/pending/confirmed dates                 |
| `/admin/schedule` | Admin  | Full schedule manager: assign speakers & talks, change status, blackout dates |
| `/admin/speakers` | Admin  | CRUD list for speakers                                                        |
| `/admin/talks`    | Admin  | CRUD list for talks + bulk CSV/JSON import                                    |
| `/admin/settings` | Admin  | Manage year, preferred day, cooldown, admin email allow-list                  |

---

## 6. Key Logic & Functional Requirements

### A. Dynamic Calendar Generation

- The Admin can **"Initialize"** a year.
  - **Input:** Year (e.g., 2026) and Day (e.g., Sunday).
  - **Logic:** The system calculates every occurrence of that day in the year using `date-fns` and creates a `schedule` document for each with `status: 'open'`.
  - **Idempotency:** If a year is re-initialized, existing confirmed/pending dates are preserved; only missing dates are added.
  - **Blackout:** Admins can mark specific dates as blacked-out (sets `status: 'cancelled'` with a note) for conventions or assemblies.

### B. The "Freshness" Algorithm

To help choose a talk that hasn't been heard recently:

1. Query the `schedule` collection for a specific `talkId`.
2. Find the most recent `date` where `status == 'confirmed'`.
3. **Validation:** Talks are classified into three freshness tiers based on months since last presented: **red** (<6 months), **orange** (6–12 months), **green** (12+ months or never).
4. **UI:** Freshness is shown via color-coded badges (red / orange / green).

### C. Admin Workflow

1. View a list of upcoming **Open** dates.
2. Assign a speaker from the `speakers` list to a date.
3. Select a `talkId` from the **Fresh** list.
4. Update `status` from `open` → `pending` → `confirmed`.
5. Ability to cancel or reassign.

### D. Speaker Workflow (Public, Read-Only)

1. Searchable view of the upcoming schedule.
2. Searchable "Talk Gallery" to browse titles.
3. Filter talks by **"Never presented"** or **"Oldest first."**

### E. CRUD Operations

| Entity   | Create                       | Read                          | Update | Delete                                        |
| -------- | ---------------------------- | ----------------------------- | ------ | --------------------------------------------- |
| Talks    | Admin (single + bulk import) | Public                        | Admin  | Admin (with confirmation)                     |
| Speakers | Admin                        | Admin                         | Admin  | Admin (soft-delete if referenced in schedule) |
| Schedule | Auto-generated on year init  | Public (future) / Admin (all) | Admin  | Admin (blackout only)                         |

---

## 7. UI/UX Design Guidelines

- **Mobile-First:** Use vertical card stacks for the schedule rather than horizontal tables.
- **Visual Cues:** Color-coded badges for status:
  - 🟢 **Confirmed** (green)
  - 🟡 **Pending** (yellow)
  - ⚪ **Open** (gray)
  - 🔴 **Cancelled** (red)
- **Performance:** Implement pagination (20 items per page) for the talk list (200+ items).
- **Empty States:** Show helpful messages when no data exists (e.g., "No schedule for 2026 yet — initialize the year to get started.").
- **Loading States:** Use skeleton cards/spinners while Firestore queries resolve.
- **Toasts/Notifications:** Confirm destructive actions (delete, blackout) with a modal; show success/error toasts for mutations.

---

## 8. Firestore Security Rules (Summary)

```
talks:     read: public  |  write: admin only
speakers:  read: admin   |  write: admin only
schedule:  read: public  |  write: admin only
settings:  read: admin   |  write: admin only
```

> Admin is determined by checking `request.auth.token.email` against the `adminEmails` array in `settings/global`. For the MVP, security rules can use a hard-coded list; later they can read from the document.

---

## 9. Project Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers, nav)
│   ├── page.tsx            # Public schedule view
│   ├── login/
│   │   └── page.tsx
│   ├── talks/
│   │   └── page.tsx        # Public talk gallery
│   └── admin/
│       ├── layout.tsx      # Admin guard layout
│       ├── page.tsx        # Admin dashboard
│       ├── schedule/
│       │   └── page.tsx
│       ├── speakers/
│       │   └── page.tsx
│       ├── talks/
│       │   └── page.tsx
│       └── settings/
│           └── page.tsx
├── components/             # Shared UI components
│   ├── ui/                 # Primitives (Button, Badge, Card, Modal, Toast)
│   └── schedule/           # Domain components (ScheduleCard, TalkList, etc.)
├── lib/                    # Utilities & services
│   ├── firebase.ts         # Firebase app initialization
│   ├── auth.ts             # Auth helpers (sign-in, sign-out, admin check)
│   ├── firestore.ts        # Firestore CRUD helpers
│   ├── dates.ts            # date-fns calendar generation utilities
│   └── freshness.ts        # Freshness algorithm
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   └── useSchedule.ts
├── types/                  # TypeScript interfaces & types
│   └── index.ts            # Talk, Speaker, ScheduleEntry, Settings
└── middleware.ts            # Next.js middleware for route protection
```

---

## 10. Edge Cases & Constraints

- **Past dates** are read-only in the admin schedule view (no edits allowed).
- **Duplicate talk on same date** is prevented at the UI level (talkId must be unique within 4 consecutive weeks).
- **Speaker double-booking** is prevented: a speaker cannot be assigned to two dates within the same month.
- **Re-initializing a year** must not overwrite existing confirmed/pending entries.
- **Deleting a speaker** who has future schedule entries should prompt the admin to reassign first.
- **Offline resilience:** Firestore's built-in offline persistence is enabled; the app should gracefully show stale data with a banner when offline.

---

## 11. Implementation Prompts for Copilot

- **Date Logic:** "Based on #PROJECT_SPEC.md, write a TypeScript utility using date-fns to find every Saturday or Sunday in a given year, excluding a provided list of blackout dates."
- **Firestore Query:** "Write a Firestore query for #PROJECT_SPEC.md that retrieves the last presentation date for every talk in the talks collection."
- **UI Component:** "Create a responsive React component for a schedule card that displays the date, speaker name, and talk title, with conditional styling based on the status field in #PROJECT_SPEC.md."
