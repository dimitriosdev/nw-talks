# Setup Guide

Complete setup instructions for NW-Talks development environment.

---

## Prerequisites

- **Node.js** >= 20 LTS ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Firebase Account** ([console.firebase.google.com](https://console.firebase.google.com))
- **Git**

---

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd nw-talks
npm install
```

---

## Step 2: Firebase Setup

### A. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add Project**
3. Name: `nw-talks` (or your preference)
4. Disable Google Analytics (optional)
5. Click **Create Project**

### B. Enable Firestore

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **Create Database**
3. Choose **Start in test mode** (change rules later)
4. Select a region (closest to users)
5. Click **Enable**

### C. Enable Authentication

1. In Firebase Console → **Build** → **Authentication**
2. Click **Get Started**
3. Click **Sign-in method** tab
4. Enable **Google** provider
5. Set support email
6. Click **Save**

### D. Get Firebase Config

1. In Firebase Console → **Project Settings** (gear icon)
2. Scroll to **Your apps** → Click **Web** icon (`</>`)
3. Register app name: `nw-talks`
4. Copy the config values

### E. Create `.env.local`

In project root, create `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

⚠️ **Never commit `.env.local`** — it's already in `.gitignore`

---

## Step 3: Firestore Security Rules

In Firebase Console → **Firestore Database** → **Rules**, paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access
    match /{document=**} {
      allow read: true;
    }

    // Admin write access (check against settings/global.adminEmails)
    match /{document=**} {
      allow write: if request.auth != null
        && request.auth.token.email in get(/databases/$(database)/documents/settings/global).data.adminEmails;
    }
  }
}
```

Click **Publish**

---

## Step 4: Seed Initial Data

### A. Create Admin User

1. Run dev server: `npm run dev`
2. Open [http://localhost:3000/login](http://localhost:3000/login)
3. Sign in with your Google account
4. Note your email address

### B. Manually Create Settings Doc

In Firebase Console → **Firestore Database**:

1. Click **Start collection**
2. Collection ID: `settings`
3. Document ID: `global`
4. Add fields:

```
activeYear: 2026 (number)
meetingDay: "Sunday" (string)
localCongregation: "Your Congregation" (string)
adminEmails: [your.email@gmail.com] (array)
```

5. Click **Save**

### C. Seed Talks & Speakers (Optional)

```bash
node scripts/seed.mjs
```

This imports:

- 200 standard public talks from `scripts/titles.json`
- Sample speakers from `scripts/speakers.json`
- Sample schedule entries from `scripts/2026.json`

---

## Step 5: Verify Setup

1. Start dev server: `npm run dev`
2. Visit [http://localhost:3000](http://localhost:3000)
3. Click **Admin** (top right)
4. Should redirect to `/admin` (not `/login`)
5. Check that data loads

---

## Step 6: Deployment (Optional)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel + GitHub Actions setup.

---

## Troubleshooting

### "Firebase not initialized"

- Check `.env.local` exists and has all 6 variables
- Restart dev server after creating `.env.local`

### "Permission denied" errors

- Check Firestore Rules are published
- Verify your email in `settings/global.adminEmails`
- Sign out and sign in again

### Build fails with TypeScript errors

```bash
npm run build
```

Check error messages — common issues:

- Missing return types
- Unused imports
- Type mismatches

### Port 3000 already in use

```bash
# Kill existing process
npx kill-port 3000

# Or use different port
npm run dev -- -p 3001
```

---

## Environment Variables Reference

| Variable                                   | Example                   | Required |
| ------------------------------------------ | ------------------------- | -------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | `AIzaSy...`               | ✅       |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | `project.firebaseapp.com` | ✅       |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | `project-id`              | ✅       |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | `project.appspot.com`     | ✅       |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789`               | ✅       |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | `1:123:web:abc`           | ✅       |

---

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand code structure
- Check [API.md](./API.md) for function reference
- See [PROJECT_SPEC.md](./PROJECT_SPEC.md) for full requirements
