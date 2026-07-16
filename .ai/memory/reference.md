---
name: Project reference
description: Commands, repo pointers, external systems, and operational notes
type: reference
---

- **Local repo:** `~/Personal Projects/spelling-blocks`
- **Remote repo:** `github.com/brentspore/spelling-blocks` (Vercel org: `mightyarmy`). Live at spellingblocks.com.
- **Commands:**
  - `bun install` — deps
  - `bun run dev` — dev server on http://localhost:8080 (serves the `/api` server routes too)
  - `bun run test` — vitest; validates every puzzle
  - `bun run build` — runs the puzzle tests (`prebuild`) then `vite build`
  - `bun run preview` / `bun run lint` / `bun run format`
  - `bash scripts/build-assets.sh` — regenerate og.png + favicon set (needs Google Chrome)
- **External systems:**
  - Vercel — hosting; auto-deploys on push to `main`. SSR is built by nitro's Vercel preset (auto-detected via `VERCEL=1`) into `.vercel/output` (Build Output API); the whole app plus the `/api` server routes ship inside the `__server.func` SSR function. Cron via `vercel.json`.
  - Resend — email. `/api/subscribe` sends a double opt-in confirmation email; `/confirm` verifies the signed link and adds the contact to the segment; `/api/daily-reminder` sends a daily broadcast to that segment. Sending domain `spellingblocks.com` is verified.
  - Google Fonts — Bricolage Grotesque, Archivo Black, Schibsted Grotesk.
  - Dictionary — `an-array-of-english-words` (bundled).
- **Secrets/env:** `RESEND_API_KEY`, `RESEND_SEGMENT_ID`, `CRON_SECRET`, `SUBSCRIBE_SECRET` (HMAC key for double opt-in tokens; any long random string, e.g. `openssl rand -hex 32`). Set in the Vercel project env; `.env.local` for local dev (git-ignored via `*.local`, auto-loaded in `bun run dev`). Never commit values. Note the `.env.local` Resend values are placeholders, so the Resend calls only really run against Vercel.
- **Deployment notes:** Push to `main` → Vercel auto-deploys. A root `api/` dir would NOT deploy (the nitro Build Output API is authoritative), so endpoints live as TanStack Start server routes in `src/routes/api/`. Cron `/api/daily-reminder` runs at 13:00 UTC (6am Pacific during PDT; Vercel Cron is UTC only, no DST) and authenticates with `Authorization: Bearer $CRON_SECRET`.
- **Build gotcha:** Build failures can appear only on Vercel because it does a clean frozen install. Reproduce with `rm -rf node_modules && bun install --frozen-lockfile && VERCEL=1 bun run build` — a plain warm `bun install` can nest dependency versions that hide the real resolution.
- **Builder/sync notes:** No longer synced to Lovable. This is a plain GitHub + Vercel repo now.
