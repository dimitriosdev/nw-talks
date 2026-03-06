# NW-Talks

**Public talk schedule manager for congregations.**

Mobile-first web app for managing weekend public talks with automatic freshness tracking, bilingual support (English/Greek), and distinct admin/public views.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, React 19)
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth (Google)
- **Styling:** Tailwind CSS 4
- **Deployment:** Vercel via GitHub Actions

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd nw-talks
npm install
```

### 2. Configure Firebase

Create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Seed Data (Optional)

```bash
node scripts/seed.mjs
```

---

## Key Features

- **Freshness Tracking:** Color-coded system (green/orange/red) based on months since last presentation
- **Bilingual:** English/Greek localization with instant switching
- **Schedule Management:** Auto-generate yearly schedules based on meeting day
- **Role-Based Access:** Admin (Google auth) vs. public (read-only)
- **Mobile-First:** Optimized for phones and tablets

---

## Project Structure

```
src/
├── app/              # Next.js routes (public + admin)
├── components/       # React components
│   ├── ui/          # Reusable UI primitives
│   └── schedule/    # Schedule-specific components
├── hooks/           # Custom React hooks
├── lib/             # Core logic (Firestore, auth, freshness)
└── types/           # TypeScript definitions

scripts/             # Data seeding & migrations
```

---

## Documentation

- **[QUICK_REFERENCE.md](./docs/QUICK_REFERENCE.md)** — Common tasks & commands
- **[SETUP.md](./docs/SETUP.md)** — Detailed setup & configuration
- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — Code structure & patterns
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** — GitHub Actions + Vercel workflow
- **[API.md](./docs/API.md)** — Functions, hooks & utilities reference
- **[PROJECT_SPEC.md](./docs/PROJECT_SPEC.md)** — Full requirements & data model

---

## Scripts

| Command                 | Description                     |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Start development server        |
| `npm run build`         | Build production bundle         |
| `npm run start`         | Run production server locally   |
| `npm run lint`          | Lint TypeScript/React code      |
| `npm run revert:export` | Restore data from export backup |

---

## Routes

| Path              | Access | Description                |
| ----------------- | ------ | -------------------------- |
| `/`               | Public | Upcoming schedule          |
| `/talks`          | Public | Searchable talk gallery    |
| `/past`           | Public | Past presentations archive |
| `/login`          | Public | Google sign-in             |
| `/admin`          | Admin  | Dashboard                  |
| `/admin/schedule` | Admin  | Schedule editor            |
| `/admin/speakers` | Admin  | Speaker management         |
| `/admin/talks`    | Admin  | Talk library + import      |
| `/admin/settings` | Admin  | Year, meeting day, admins  |

---

## Environment Variables

Required for Firebase connection (see [SETUP.md](./docs/SETUP.md)):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## License

Private project — not licensed for public distribution.
