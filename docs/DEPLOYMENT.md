# Deployment Guide

Deploy NW-Talks to Vercel with automated GitHub Actions workflow.

---

## Overview

This project uses:

- **Vercel** for hosting
- **GitHub Actions** for CI/CD
- **Firebase** for backend (Firestore + Auth)

Workflow triggers:

- `push` to `main` → **Production** deploy
- `pull_request` to `main` → **Preview** deploy

---

## One-Time Setup

### Step 1: Link Project to Vercel

**A. Install Vercel CLI**

```bash
npm install --global vercel@latest
```

**B. Login & Link**

```bash
vercel login
cd d:\repos\nw-talks
vercel link
```

Follow prompts:

- Set up and deploy? **No**
- Link to existing project? **No** (create new)
- Project name: `nw-talks` (or customize)
- Directory: `.` (current)

**C. Get Vercel IDs**

After linking, check `.vercel/project.json`:

```bash
cat .vercel/project.json
```

Note these values:

- `orgId` → use as `VERCEL_ORG_ID`
- `projectId` → use as `VERCEL_PROJECT_ID`

---

### Step 2: Create Vercel Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **Create**
3. Name: `GitHub Actions`
4. Scope: **Full Account**
5. Expiration: **No expiration** (or custom)
6. Click **Create Token**
7. **Copy the token** (shown once)

---

### Step 3: Add GitHub Secrets

Go to your GitHub repo:

**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these **3 secrets**:

| Name                | Value                                   |
| ------------------- | --------------------------------------- |
| `VERCEL_TOKEN`      | Token from Step 2                       |
| `VERCEL_ORG_ID`     | `orgId` from `.vercel/project.json`     |
| `VERCEL_PROJECT_ID` | `projectId` from `.vercel/project.json` |

---

### Step 4: Add Firebase Config to Vercel

In Vercel dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add each variable for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Use the same values from your local `.env.local`

---

## Deployment Workflow

### Production Deploy

```bash
git add .
git commit -m "feat: add feature"
git push origin main
```

**What happens:**

1. GitHub Actions workflow starts
2. Installs Vercel CLI
3. Pulls Vercel environment (production)
4. Builds project with `vercel build --prod`
5. Deploys with `vercel deploy --prebuilt --prod`
6. Production URL updates

**Check status:**

- GitHub: **Actions** tab
- Vercel: **Deployments** tab

---

### Preview Deploy (Pull Request)

```bash
git checkout -b feature/new-feature
# make changes
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature
```

**Open Pull Request on GitHub**

**What happens:**

1. GitHub Actions workflow starts
2. Builds with `vercel build` (preview mode)
3. Deploys with `vercel deploy --prebuilt`
4. Comment added to PR with preview URL

---

## Workflow File

Location: `.github/workflows/vercel-deploy.yml`

**Key features:**

- Runs on `ubuntu-latest`
- Uses Node.js 20
- Separate jobs for preview vs. production
- Caches dependencies for faster builds
- Uses `vercel pull` to sync environment

---

## Troubleshooting

### "Project not found" Error

**Cause:** GitHub secrets don't match Vercel project

**Fix:**

1. Check `.vercel/project.json` locally
2. Verify GitHub secrets exactly match:
   - `VERCEL_ORG_ID` = `orgId`
   - `VERCEL_PROJECT_ID` = `projectId`
3. Re-create secrets if needed (no spaces/typos)

### Build Fails in CI

**Check TypeScript errors:**

```bash
npm run build
```

Fix all errors locally before pushing.

**Common issues:**

- Type mismatches
- Unused imports
- Missing return types

### Preview Deploy Not Triggered

- Check PR is targeting `main` branch
- Check GitHub Actions is enabled for repo
- Check workflow file syntax (YAML indentation)

### Environment Variables Not Loading

In Vercel dashboard:

1. **Settings** → **Environment Variables**
2. Ensure all Firebase vars are set for **all environments**
3. Redeploy after adding variables

---

## Manual Deploy (Alternative)

If GitHub Actions are unavailable:

```bash
# Production
vercel --prod

# Preview
vercel
```

---

## Monitoring

### View Logs

**GitHub Actions:**

- GitHub repo → **Actions** tab
- Click workflow run → Click job
- Expand steps to see logs

**Vercel:**

- Project → **Deployments** → Click deployment
- **Build Logs** tab
- **Runtime Logs** tab (for errors after deploy)

### Check Build Time

Typical build times:

- **Development:** ~3-5 seconds (Turbopack)
- **Production:** ~10-15 seconds (full optimization)

If builds take >30s, check for:

- Large dependencies
- Unnecessary imports
- Heavy computations at build time

---

## Vercel vs. Firebase Hosting

| Feature              | Vercel              | Firebase Hosting    |
| -------------------- | ------------------- | ------------------- |
| Next.js Support      | ✅ Native           | ⚠️ Requires adapter |
| Edge Functions       | ✅ Yes              | ❌ No               |
| Analytics            | ✅ Built-in         | ✅ Via Google       |
| Custom Domains       | ✅ Yes              | ✅ Yes              |
| Auto Preview Deploys | ✅ Yes (via GitHub) | ❌ Manual           |
| Cost (Free Tier)     | ✅ Generous         | ✅ Generous         |

**Recommendation:** Vercel (optimized for Next.js)

---

## Rollback Procedure

If production deploy breaks:

**Option 1: Vercel Dashboard**

1. Go to **Deployments**
2. Find last working deployment
3. Click **⋯** → **Promote to Production**

**Option 2: Git Revert**

```bash
git revert HEAD
git push origin main
```

**Option 3: Redeploy Previous Commit**

```bash
git reset --hard <previous-commit-sha>
git push --force origin main
```

⚠️ Use `--force` carefully (notify team first)

---

## Next Steps

- Set up custom domain in Vercel
- Configure analytics
- Add status badge to README
- Set up branch protection rules
