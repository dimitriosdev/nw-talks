# Quick Reference

Common tasks and commands for NW-Talks developers.

---

## Daily Development

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
npm run build
```

### Run Production Locally

```bash
npm run build
npm run start
```

### Lint Code

```bash
npm run lint
```

---

## Git Workflow

### Create Feature Branch

```bash
git checkout -b feature/speaker-photos
# make changes
git add .
git commit -m "feat: add speaker photos"
git push origin feature/speaker-photos
```

### Commit Message Format

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code formatting (no logic change)
- `refactor:` — Code restructure (no behavior change)
- `test:` — Add/update tests
- `chore:` — Maintenance tasks

### Deploy to Production

```bash
git checkout main
git merge feature/speaker-photos
git push origin main
```

GitHub Actions auto-deploys to Vercel.

---

## Firebase Console

### View Database

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select project
3. **Build** → **Firestore Database**

### Check Auth Users

1. **Build** → **Authentication**
2. **Users** tab

### Update Security Rules

1. **Firestore Database** → **Rules**
2. Edit and **Publish**

---

## Common Code Tasks

### Add a New Route

**Public Route:**

```bash
# Create file
src/app/events/page.tsx
```

```tsx
export default function EventsPage() {
  return <h1>Events</h1>;
}
```

**Admin Route:**

```bash
src/app/admin/reports/page.tsx
```

```tsx
export default function ReportsPage() {
  return <h1>Reports</h1>;
}
```

---

### Create a New Component

```bash
src/components/ui/Dropdown.tsx
```

```tsx
"use client";

interface DropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export function Dropdown({ options, value, onChange }: DropdownProps) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
```

---

### Add a Firestore Function

In `src/lib/firestore.ts`:

```tsx
export async function getRecentTalks(limit: number): Promise<Talk[]> {
  const snap = await getDocs(
    query(talksCol(), orderBy("id", "desc"), limit(limit)),
  );
  return snap.docs.map((d) => d.data() as Talk);
}
```

---

### Add a Custom Hook

```bash
src/hooks/useLocalStorage.ts
```

```tsx
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

**Usage:**

```tsx
const [count, setCount] = useLocalStorage("count", 0);
```

---

### Add Localized Text

In `src/lib/localization.ts`:

```tsx
export const texts = {
  en: {
    // ... existing
    events: {
      title: "Events",
      upcoming: "Upcoming Events",
    },
  },
  el: {
    // ... existing
    events: {
      title: "Εκδηλώσεις",
      upcoming: "Προσεχείς Εκδηλώσεις",
    },
  },
};
```

**Usage:**

```tsx
const { texts } = usePreferences()
<h1>{texts.events.title}</h1>
```

---

## Data Management

### Seed Database

```bash
node scripts/seed.mjs
```

Imports:

- 200 talks from `scripts/titles.json`
- Sample speakers from `scripts/speakers.json`
- Sample schedule from `scripts/2026.json`

### Export Data Backup

From Firebase Console:

1. **Firestore Database**
2. **Import/Export** tab
3. **Export**
4. Select collections
5. Download

### Revert to Backup

```bash
npm run revert:export
```

Restores from most recent export in `scripts/exports/`

---

## Troubleshooting

### Build Fails

**Check TypeScript errors:**

```bash
npm run build
```

**Common fixes:**

- Add missing types
- Remove unused imports
- Fix type mismatches

### Firebase "Permission Denied"

**Check:**

1. Is user signed in?
2. Is email in `settings/global.adminEmails`?
3. Are Firestore rules published?

**Fix:**

```bash
# Sign out and sign in again
```

### Port Already in Use

**Kill process:**

```bash
npx kill-port 3000
```

**Or use different port:**

```bash
npm run dev -- -p 3001
```

### Environment Variables Not Loading

**Check:**

1. File named exactly `.env.local` (not `.env.local.txt`)
2. All 6 Firebase variables present
3. No quotes around values
4. Restart dev server after changes

---

## Testing Locally

### Test as Admin

1. Sign in with Google
2. Go to Firebase Console
3. **Firestore** → `settings/global`
4. Add your email to `adminEmails` array
5. Sign out and sign in again

### Test as Public User

1. Open incognito window
2. Navigate to [http://localhost:3000](http://localhost:3000)
3. Should see public views only (no Admin button)

### Test Different Years

1. Go to `/admin/settings`
2. Change `Active Year`
3. Navigate to `/admin/schedule`
4. Should see schedule for new year

---

## Deployment

### Check Deployment Status

**GitHub:**

- Go to repo **Actions** tab
- Click latest workflow run

**Vercel:**

- Go to project dashboard
- Click **Deployments**

### View Production Logs

1. Vercel dashboard
2. Click deployment
3. **Runtime Logs** tab

### Rollback Production

**Option 1: Vercel Dashboard**

1. **Deployments**
2. Find last working deployment
3. **⋯** → **Promote to Production**

**Option 2: Git Revert**

```bash
git revert HEAD
git push origin main
```

---

## Keyboard Shortcuts (VS Code)

| Action               | Shortcut       |
| -------------------- | -------------- |
| Open file            | `Ctrl+P`       |
| Find in files        | `Ctrl+Shift+F` |
| Open terminal        | `Ctrl+` `      |
| Format document      | `Shift+Alt+F`  |
| Go to definition     | `F12`          |
| Rename symbol        | `F2`           |
| Quick fix            | `Ctrl+.`       |
| Open command palette | `Ctrl+Shift+P` |

---

## Useful VS Code Extensions

- **ESLint** — Real-time linting
- **Prettier** — Code formatting
- **Tailwind CSS IntelliSense** — Class suggestions
- **Firebase** — Firestore explorer
- **Error Lens** — Inline error messages

---

## Environment Quick Reference

### Development

```bash
npm run dev
# http://localhost:3000
# .env.local for Firebase config
```

### Production (Vercel)

```bash
git push origin main
# Auto-deployed via GitHub Actions
# Environment vars set in Vercel dashboard
```

### Preview (Pull Request)

```bash
# Open PR to main
# Auto-deployed via GitHub Actions
# Preview URL posted in PR comments
```

---

## File Quick Reference

| File                      | Purpose                         |
| ------------------------- | ------------------------------- |
| `.env.local`              | Firebase config (local only)    |
| `src/app/layout.tsx`      | Root layout (providers, navbar) |
| `src/app/page.tsx`        | Home page (public schedule)     |
| `src/lib/firestore.ts`    | All database operations         |
| `src/lib/localization.ts` | English/Greek translations      |
| `src/types/index.ts`      | TypeScript type definitions     |
| `package.json`            | Dependencies and scripts        |
| `next.config.ts`          | Next.js configuration           |
| `tailwind.config.ts`      | Tailwind CSS configuration      |
| `.github/workflows/`      | GitHub Actions workflows        |

---

## Helpful Links

- **Next.js Docs:** [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind Docs:** [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Firestore Docs:** [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)
- **React Docs:** [react.dev](https://react.dev)
- **TypeScript Docs:** [typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **date-fns Docs:** [date-fns.org/docs](https://date-fns.org/docs)

---

## Support

For bugs or questions:

1. Check existing documentation
2. Search closed issues on GitHub
3. Create new issue with reproduction steps

---

## Quick Health Check

Run this checklist to verify setup:

- [ ] `npm run dev` starts without errors
- [ ] Can sign in at `/login`
- [ ] Admin redirect works (if admin email set)
- [ ] Public pages load (`/`, `/talks`, `/past`)
- [ ] Data appears (talks, speakers, schedule)
- [ ] Language toggle works
- [ ] `npm run build` completes successfully
- [ ] No TypeScript errors
- [ ] Firebase Firestore shows data

If all checked, you're good to go! 🚀
