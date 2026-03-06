# Architecture Guide

Code structure, patterns, and design decisions for NW-Talks.

---

## Project Structure

```
nw-talks/
├── .github/
│   └── workflows/
│       └── vercel-deploy.yml    # CI/CD pipeline
├── docs/                         # Documentation
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── PROJECT_SPEC.md
│   ├── QUICK_REFERENCE.md
│   └── SETUP.md
├── public/                       # Static assets
├── scripts/                      # Data seeding & migrations
│   ├── seed.mjs                 # Import talks/speakers/schedule
│   ├── revert-export.mjs        # Restore from backup
│   ├── titles.json              # 200 standard talks
│   ├── speakers.json            # Sample speakers
│   └── 2023-2026.json           # Sample schedules
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home (public schedule)
│   │   ├── providers.tsx        # Context providers
│   │   ├── globals.css          # Global styles
│   │   ├── login/               # Google sign-in
│   │   ├── talks/               # Talk gallery
│   │   ├── past/                # Past presentations
│   │   └── admin/               # Protected admin routes
│   │       ├── layout.tsx       # Admin auth check
│   │       ├── page.tsx         # Admin dashboard
│   │       ├── schedule/        # Schedule editor
│   │       ├── speakers/        # Speaker CRUD
│   │       ├── talks/           # Talk CRUD + import
│   │       └── settings/        # App settings
│   ├── components/
│   │   ├── Navbar.tsx           # Top navigation
│   │   ├── schedule/            # Schedule components
│   │   │   ├── ScheduleCard.tsx # Single schedule entry
│   │   │   └── TalkList.tsx     # Filterable talk list
│   │   └── ui/                  # Reusable primitives
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       ├── Toast.tsx
│   │       ├── Spinner.tsx
│   │       └── BackToTop.tsx
│   ├── hooks/
│   │   ├── useAuth.tsx          # Firebase auth state
│   │   ├── usePreferences.tsx   # Language + settings
│   │   └── useSchedule.ts       # Schedule data fetching
│   ├── lib/
│   │   ├── firebase.ts          # Firebase init
│   │   ├── firestore.ts         # CRUD operations
│   │   ├── auth.ts              # Auth helpers
│   │   ├── freshness.ts         # Talk freshness logic
│   │   ├── localization.ts      # English/Greek texts
│   │   └── dates.ts             # Calendar generation
│   └── types/
│       └── index.ts             # TypeScript definitions
├── .env.local.example           # Template for env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
└── tailwind.config.ts
```

---

## Tech Stack Decisions

### Next.js 16 App Router

**Why:**

- React Server Components reduce client bundle
- File-based routing
- Built-in API routes (not used, Firebase direct)
- Excellent Vercel integration

**Key Features Used:**

- `app/` directory structure
- Server/client component split
- Layouts for auth checks
- Route groups `(public)` vs `(admin)`

### Firebase (Firestore + Auth)

**Why:**

- NoSQL schema flexibility
- Real-time listeners (not used yet, future feature)
- Google Auth built-in
- Generous free tier
- No backend code needed

**Collections:**

- `talks` — static reference data
- `speakers` — speaker profiles
- `schedule` — yearly schedule entries
- `settings` — single global doc

### Tailwind CSS 4

**Why:**

- Mobile-first utilities
- Dark mode support
- Minimal custom CSS
- Consistent spacing/colors
- Fast iteration

**Patterns:**

- Semantic color classes (`bg-emerald-500` = green freshness)
- Responsive breakpoints (`sm:`, `md:`, `lg:`)
- Dark mode with `dark:` prefix

### TypeScript

**Why:**

- Catch errors at build time
- IntelliSense in VS Code
- Self-documenting code
- Firestore type safety

**Patterns:**

- Interfaces in `types/index.ts`
- Strict mode enabled
- No implicit `any`

---

## Design Patterns

### 1. Server vs. Client Components

**Server Components (default):**

- Pages with static content
- No interactivity needed
- Faster initial load

**Client Components (`"use client"`):**

- Forms with state
- Event handlers
- Hooks (useState, useEffect)
- Contexts (Auth, Preferences)

**Example:**

```tsx
// Server component (no "use client")
export default function Page() {
  return <StaticContent />;
}

// Client component
("use client");
export function Form() {
  const [value, setValue] = useState("");
  // ...
}
```

### 2. Context Providers

**Location:** `src/app/providers.tsx`

**Providers:**

- `AuthProvider` — Firebase auth state
- `PreferencesProvider` — Language + settings

**Pattern:**

```tsx
<AuthProvider>
  <PreferencesProvider>{children}</PreferencesProvider>
</AuthProvider>
```

### 3. Custom Hooks

**Purpose:** Reusable stateful logic

**Examples:**

- `useAuth()` — Get current user, admin status
- `usePreferences()` — Language, texts, settings
- `useSchedule()` — Fetch schedule with filters

**Pattern:**

```tsx
export function useSchedule(year: number) {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from Firestore
  }, [year]);

  return { entries, loading };
}
```

### 4. Firestore Abstractions

**Location:** `src/lib/firestore.ts`

**Pattern:** One function per operation

```tsx
export async function getTalks(): Promise<Talk[]>;
export async function saveTalk(talk: Talk): Promise<void>;
export async function deleteTalk(id: number): Promise<void>;
```

**Why:**

- Centralized data access
- Easy to mock in tests
- Type-safe queries

### 5. Freshness Algorithm

**Location:** `src/lib/freshness.ts`

**Logic:**

1. Get all `confirmed` schedule entries for a talk
2. Find most recent date
3. Calculate months since
4. Return tier: `green` (12+mo), `orange` (6-12mo), `red` (<6mo)

**Usage:**

```tsx
import { calculateFreshness } from "@/lib/freshness";

const freshness = calculateFreshness(talk, scheduleEntries);
// { isFresh, level, monthsSince, lastDate, presentations }
```

### 6. Localization

**Location:** `src/lib/localization.ts`

**Pattern:** Nested object with English/Greek keys

```tsx
export const texts = {
  en: {
    navbar: { home: "Home", admin: "Admin" },
    talks: { freshness: { greenLabel: "Fresh" } },
  },
  el: {
    navbar: { home: "Αρχική", admin: "Διαχείριση" },
    talks: { freshness: { greenLabel: "Διαθέσιμη" } },
  },
};
```

**Usage:**

```tsx
const { texts, language } = usePreferences()
<h1>{texts.navbar.home}</h1>
```

---

## Data Flow

### Read Path (Public Schedule)

```
User visits /
  ↓
Page.tsx (server component)
  ↓
useSchedule() hook
  ↓
getScheduleEntries() from firestore.ts
  ↓
Firestore query
  ↓
Data rendered in <ScheduleCard />
```

### Write Path (Admin Assigns Talk)

```
Admin clicks "Confirm" in /admin/schedule
  ↓
Form submit handler
  ↓
updateScheduleEntry() from firestore.ts
  ↓
Firestore setDoc()
  ↓
State updates
  ↓
UI refreshes
```

### Auth Check (Admin Routes)

```
User navigates to /admin
  ↓
layout.tsx (admin)
  ↓
useAuth() hook
  ↓
Check user.email in settings.adminEmails
  ↓
If no → redirect to /login
If yes → render admin UI
```

---

## State Management

**No global state library (Redux, Zustand, etc.)**

**Why:**

- React Context sufficient for auth + preferences
- Firestore is source of truth
- Most state is local to components

**Patterns:**

- `useState` for form inputs
- `useContext` for auth/language
- Direct Firestore reads (no cache layer yet)

---

## File Naming Conventions

| Type       | Pattern      | Example                |
| ---------- | ------------ | ---------------------- |
| Pages      | `page.tsx`   | `app/talks/page.tsx`   |
| Layouts    | `layout.tsx` | `app/admin/layout.tsx` |
| Components | PascalCase   | `Button.tsx`           |
| Hooks      | `use*.tsx`   | `useAuth.tsx`          |
| Libs       | camelCase    | `firestore.ts`         |
| Types      | `index.ts`   | `types/index.ts`       |
| Scripts    | kebab-case   | `seed.mjs`             |

---

## Error Handling

### Client-Side

**Pattern:**

```tsx
try {
  await saveTalk(talk);
  setSuccess("Saved!");
} catch (error) {
  console.error(error);
  setError("Failed to save");
}
```

**Future:** Toast notifications (component exists, not wired)

### Server-Side

**Pattern:** Errors logged to console, caught by error boundary

**Future:** Sentry or similar error tracking

---

## Performance Optimizations

### Current

- **React 19 + Compiler:** Automatic memoization
- **Turbopack:** Fast dev builds (~3s)
- **Static generation:** All public pages pre-rendered
- **Lazy loading:** Components load on demand

### Future

- **Firestore indexes:** Speed up complex queries
- **Image optimization:** `next/image` for photos
- **Pagination:** Limit schedule entries per page
- **Real-time listeners:** Replace polling with snapshots

---

## Testing Strategy

**Current:** None (MVP phase)

**Future:**

- **Unit:** Vitest for `lib/` functions
- **Integration:** Playwright for critical flows
- **E2E:** Firestore emulator + test data

---

## Security

### Firestore Rules

**Read:** Public (anyone can view schedule)  
**Write:** Admins only (checked against `settings.adminEmails`)

**Rule snippet:**

```javascript
allow write: if request.auth.token.email in
  get(/databases/$(database)/documents/settings/global).data.adminEmails;
```

### Environment Variables

- All Firebase keys in `.env.local`
- Never committed (in `.gitignore`)
- Set in Vercel for production

### Admin Check

**Client-side:** `useAuth()` checks email  
**Future:** Server-side middleware for API routes

---

## Scalability Considerations

**Current Limits:**

- 200 talks (fixed set)
- ~100 speakers (typical congregation)
- 52 schedule entries/year
- 1-10 admin users

**Firestore Free Tier:**

- 50K reads/day → ~1500 page views/day
- 20K writes/day → plenty for admin actions

**If scaling needed:**

- Add pagination to talks/speakers lists
- Cache settings in memory (reduce reads)
- Use Firestore real-time listeners (one connection vs. polling)

---

## Future Improvements

### Features

- Real-time sync (multiple admins editing simultaneously)
- Email notifications (reminders to speakers)
- Export to PDF/Excel
- Speaker availability calendar
- Talk request system (speakers request assignments)

### Technical

- Add tests (Vitest + Playwright)
- Error tracking (Sentry)
- Analytics (Vercel Analytics)
- PWA support (offline mode)
- Firestore composite indexes for complex queries

### Code Quality

- ESLint + Prettier pre-commit hooks
- Husky for git hooks
- Conventional commits
- Automated release notes

---

## Developer Workflow

### 1. Local Development

```bash
npm run dev
```

- Hot reload enabled
- TypeScript checking in IDE
- Tailwind JIT compilation

### 2. Feature Branch

```bash
git checkout -b feature/speaker-photos
# make changes
npm run build  # verify no errors
git commit -m "feat: add speaker photos"
git push
```

### 3. Pull Request

- Opens preview deploy on Vercel
- Review changes
- Merge to `main`

### 4. Production Deploy

- Automatic on merge to `main`
- GitHub Actions → Vercel
- Monitor logs

---

## Common Gotchas

### 1. `"use client"` Required For:

- `useState`, `useEffect`, `useContext`
- Event handlers (`onClick`, etc.)
- Browser APIs (`localStorage`, `window`)

### 2. Firestore Date Handling

- Store as `YYYY-MM-DD` strings (not Date objects)
- Use `date-fns` for parsing/formatting
- Timezone-aware in schedule generation

### 3. Type Assertions

- `withoutUndefined()` requires `as unknown as Record<>`
- Firestore returns `DocumentData` (must cast to types)

### 4. Environment Variables

- Must start with `NEXT_PUBLIC_` for client access
- Restart dev server after changes

---

## Questions?

For more details:

- [API.md](./API.md) — Function reference
- [SETUP.md](./SETUP.md) — Setup guide
- [PROJECT_SPEC.md](./PROJECT_SPEC.md) — Requirements
