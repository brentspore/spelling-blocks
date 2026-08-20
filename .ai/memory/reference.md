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
  - Resend — email. `/api/subscribe` sends a double opt-in confirmation email; `/confirm` verifies the signed link and adds the contact to the segment; `/api/daily-reminder` creates a topic-scoped daily broadcast for that segment. **OPEN: no daily has ever actually SENT** — the only broadcast it ever created (13:01 UTC 2026-07-16) sits in Resend as a `draft` named "Untitled"; hypothesis (unproven) is the then-missing postal address, now fixed — check `list-broadcasts` after the next 13:00 UTC cron (status must be `sent`). Dry run (proves key + segment + topic resolve, sends nothing): `curl -H "Authorization: Bearer $CRON_SECRET" "https://spellingblocks.com/api/daily-reminder?dry_run=1"`. Sending domain `spellingblocks.com` is verified.
  - Google Fonts — Bricolage Grotesque, Archivo Black, Schibsted Grotesk.
  - Dictionary — `an-array-of-english-words` (bundled).
- **Secrets/env:** `RESEND_API_KEY` (**FULL access** — Sending-only silently breaks contact management), `RESEND_SEGMENT_ID` (= `9905acb9-a25e-4b33-94e2-89e1bb91516e`), `RESEND_TOPIC_ID` (= `bbd74af9-58e1-4758-8b26-8aba3220a142` — the daily-reminder route **fails closed (500, no send) without it**; topics carry per-game unsubscribe because Resend's `unsubscribed` flag is account-wide), `CRON_SECRET`, `SUBSCRIBE_SECRET` (HMAC key for double opt-in tokens; any long random string, e.g. `openssl rand -hex 32`). Rules: never `vercel env pull` (plaintext secret dump); `vercel env ls` proves a var exists, never that its value is right — prove values with the dry run below. Set in the Vercel project env; `.env.local` for local dev (git-ignored via `*.local`, auto-loaded in `bun run dev`). Never commit values. Note the `.env.local` Resend values are placeholders, so the Resend calls only really run against Vercel.
- **Deployment notes:** Push to `main` → Vercel auto-deploys. A root `api/` dir would NOT deploy (the nitro Build Output API is authoritative), so endpoints live as TanStack Start server routes in `src/routes/api/`. Cron `/api/daily-reminder` runs at 13:00 UTC (6am Pacific during PDT; Vercel Cron is UTC only, no DST) and authenticates with `Authorization: Bearer $CRON_SECRET`.
- **Build gotcha:** Build failures can appear only on Vercel because it does a clean frozen install. Reproduce with `rm -rf node_modules && bun install --frozen-lockfile && VERCEL=1 bun run build` — a plain warm `bun install` can nest dependency versions that hide the real resolution.
- **Builder/sync notes:** No longer synced to Lovable. This is a plain GitHub + Vercel repo now.

- **DNS / email auth (Cloudflare zone `b055571f8cbec71922d6bf765c76093a`):** DKIM at `resend._domainkey`, bounce domain `send.spellingblocks.com` carrying MX + SPF, and **DMARC at `_dmarc` — `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`**, added 2026-08-19. ⚠ **It had NO DMARC record at all before that**, on a domain with a live list; the record is now byte-identical to onepagetoys, thetrailgame, bricksmasher and wordkraven. Enforcing immediately was safe because Resend is the only sender, DKIM and SPF both align, and the apex has no MX — there were no unknown senders to discover. ⚠ The `rua` only works because GoDaddy publishes a wildcard `*._report._dmarc.onsecureserver.net` authorization; DMARC otherwise refuses cross-domain reporting. ⚠ Verify with DoH, never `dig` — this dev machine's port-53 is intercepted.
- **Verify email flows (no human inbox):** `delivered@resend.dev` is Resend's sandbox (plus-addressing works); Resend MCP `get-email` reads a sent email's body to recover a real confirm token — drives the whole double opt-in loop, including proving a contact was CREATED (use an address with no prior record; `created_at` = account-book entry, not segment-join). Full recipes + the Resend model: `email-ops` skill.
- **Shared capture Worker:** `synergy-capture` is DEPLOYED (https://synergy-capture.brent-816.workers.dev, repo `synergy-sm-viral-game-infra`) and its contact-creation path is PROVEN (2026-07-16). This repo's in-repo capture (`optInToken.ts`, `rateLimit.ts`, `/api/subscribe`, `/confirm`) is the reference implementation it was lifted from and RETIRES after migration — see BACKLOG; keep `/confirm` alive 48h past cutover (outstanding emailed tokens point at it).
