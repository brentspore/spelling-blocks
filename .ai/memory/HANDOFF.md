# Handoff

**State (2026-08-04):** Fixed the production SSR/client date divergence that could render adjacent daily puzzle numbers and fail hydration around midnight UTC. `getTodayPuzzleNumber` now derives the calendar day explicitly in `America/Los_Angeles`, with boundary regression tests. Verify with `bun run test` and the production build path below.

**State (2026-07-16, evening — memory consolidation + address fix already live).** Since the entry below: (1) the daily email now prints the postal address `7511 Greenwood Ave North, Unit 4147, Seattle, WA 98103` (Anytime Mailbox; PO-box swap planned), held by **4 vitest tests (167 total)** — it had shipped with an unsubscribe link but NO postal address, which CAN-SPAM requires and which nothing could catch because the email is assembled in code. (2) **CRITICAL OPEN: the daily reminder has NEVER actually sent** — the only broadcast the route ever created (13:01 UTC 2026-07-16) sits in Resend as a `draft` named "Untitled". Hypothesis (unproven): Resend refused the bulk send without the address; **first check next session: `list-broadcasts` after the 13:00 UTC cron — status must be `sent`, not `draft`**. The owner's earlier dry-run 401 was an empty `$CRON_SECRET` in the shell, not a code bug (route auth proven locally all three ways). (3) The shared **synergy-capture Worker is deployed and its contact-creation path PROVEN** (2026-07-16 21:40 UTC) — this repo's `/api/subscribe` + `/confirm` + `optInToken.ts` + `rateLimit.ts` retire after migration (see BACKLOG; keep `/confirm` alive 48h past cutover). (4) reference.md/README/DECISIONS/BACKLOG updated to current truth (RESEND_TOPIC_ID + SUBSCRIBE_SECRET documented, GA4 item closed, Resend ids inline). Day-2 email ops: global `email-ops` skill.

**State (2026-07-16, later): daily reminder is now scoped to a Resend topic (`main bf085ff`).**
Found while working in the-trail-game: a contact's `unsubscribed` flag is **account-wide**, not
per segment (Resend documents it as "unsubscribed from all Broadcasts", and one contact record is
shared across every segment). So the reminder's unsubscribe link was silencing The Trail Game and
every future network game too, with no signal to us. Segments and `source` tags separate *sending*
only; **topics** are the per-game unsubscribe primitive, and there were none.

`/api/daily-reminder` now passes `topicId` to `broadcasts.create` and **fails closed** (500, no
send) if `RESEND_TOPIC_ID` is missing, matching the existing RESEND_API_KEY/RESEND_SEGMENT_ID
handling, so it cannot quietly regress to an account-wide unsubscribe. README documents the var.
163 tests / tsc / build green; lint warnings are pre-existing.

- **`RESEND_TOPIC_ID` is SET** in Vercel Production by the owner (confirmed present via
  `npx vercel@latest env ls production`). Fail-closed was chosen over a silent unscoped fallback
  deliberately: an unscoped send costs a real subscriber their entire network subscription and
  cannot be undone without asking them to re-opt-in, whereas a missed day costs nothing.
- **Dry run added (`ae413b2`):** `GET /api/daily-reminder?dry_run=1` (same `CRON_SECRET` bearer
  auth) resolves the segment + topic against Resend and returns their names, creating and sending
  nothing. Built because the only way to exercise this route was a real broadcast to real people,
  so a mistyped id could only surface as a silent 13:00 UTC cron failure on a list nobody watches.
  **`vercel env ls` proves an env var is PRESENT, never that its value is CORRECT — a typo looks
  identical.** The dry run is the only thing that settles it:
  `curl -H "Authorization: Bearer $CRON_SECRET" "https://spellingblocks.com/api/daily-reminder?dry_run=1"`
  — **still un-run as of this session; the owner has the secret.** Do NOT `vercel env pull` to get
  it (dumps every live secret to plaintext; the classifier blocks it, rightly).
- **`.env*` now gitignored.** The repo did NOT ignore `.env` files at all despite the README telling
  you to put the Resend key in `.env.local`; verified nothing was ever committed. Note `vercel link`
  wrote a (now-ignored) plaintext `.env.local` here — delete it if you don't want it locally.
- Topics are account-level: Spelling Blocks `bbd74af9-58e1-4758-8b26-8aba3220a142`, The Trail Game
  `344026ed-06e6-433b-b1e4-21b604fc0570`. Both `defaultSubscription: opt_in`, which **does** cover
  contacts created before the topic existed (verified). `defaultSubscription` **cannot be changed
  after creation** — wrong value means delete and recreate. See global DECISIONS, "Every game
  broadcast is scoped to its own Resend topic".
- SDK note (resend 6.17.2): `broadcasts.create({ topicId })` maps to REST `topic_id`.

**State (2026-07-16): double opt-in + throttling on the subscribe form.**

Signup used to add the address to the Resend segment on submit, so anyone could sign up someone else's address. Now:

- `/api/subscribe` validates + honeypots as before, then mints an HMAC token and sends a confirmation email. It no longer touches the contact list.
- `/confirm` (`src/routes/confirm.ts`, a server route rendering its own HTML) verifies the token and creates the contact in the segment. Handles invalid, expired, already-on-list, and Resend failure.
- `src/server/optInToken.ts` — pure mint/verify, 48h expiry, constant-time compare. `optInToken.test.ts` covers round-trip, expiry, wrong secret, forged payload, malformed input.
- `src/server/rateLimit.ts` — in-memory fixed-window limiter. Subscribe throttles 1 per address / 10 min (silent `ok:true`, no send, no signal to a bomber) and 5 per IP / hour (429 + `retry-after`). The address cooldown is `peek`ed and only `record`ed after a successful send, so a Resend failure never locks a player out of retrying — that split is the reason the limiter has `peek`/`record` and not just `check`.
- `SUBSCRIBE_SECRET` is set in Vercel (owner did it 2026-07-16). Both endpoints fail closed with a 500 without it.
- Results modal copy now says to check the inbox rather than claiming they are subscribed.

**Throttling is best effort by design:** the counters are per SSR instance, so Vercel running several instances means an attacker gets one allowance per instance. It stops casual floods without putting a database behind a form that otherwise needs no storage. Durable upgrade if abuse ever shows up: Upstash/Vercel KV via the marketplace, or Turnstile on the form.

**Verified local (`main fc93eaa`):** 163 tests, typecheck, lint, `bun run build` all pass. Drove the dev server: confirm's no-token / garbage / expired branches render the right page + 400; subscribe's invalid-email (400) and honeypot (silent 200); per-IP throttle allows exactly 5 then 429s with `retry-after: 3583`; a different IP is unaffected; a failed send leaves the address free to retry. Note `.env.local` holds placeholder Resend values (20-char key vs the real ~36), so locally both endpoints reach the API and get "API key is invalid" — well-formed requests, but no local proof the write lands.

**Verified live on spellingblocks.com:** confirm's no-token and garbage-token branches render + 400; subscribe invalid-email 400; honeypot silent 200; homepage 200. Real send path exercised with `delivered@resend.dev` (Resend's sink address, no real inbox): returned 200, and the Resend log shows exactly **one** "Confirm your Spelling Blocks signup" delivered. That 200 also proves `SUBSCRIBE_SECRET` is set in Vercel (else 500) and the transactional send works with the live key (else 502). Submitting the same address twice produced only that one email, so **the per-address cooldown suppresses a duplicate send in production**, not just in tests.

**End-to-end verified on production with a real address** (`hello+delete@brentspore.com`, 2026-07-16): submit → 200, confirmation email delivered and rendered correctly with a real production-signed token (48h expiry, decoded and checked) → **contact absent from Resend at that point (404), proving submit writes nothing** → clicked the real link from the email body → "You're in" 200 → contact present, `unsubscribed:false`, **in the "Spelling Blocks" segment** (`9905acb9-a25e-4b33-94e2-89e1bb91516e`), so the daily broadcast will reach it. Corroborating: `delivered@resend.dev` was submitted and delivered but never confirmed, and is not a contact.

**Resend gotcha for future verification:** a contact's `created_at` is when the address first entered the account's contact book, NOT when it joined a segment. `hello@brentspore.com` shows `created_at` 07-14 while sitting in a segment created 07-16. Do not read `created_at` as evidence of when a signup happened.

**Segment state:** the `hello+delete@` test contact was removed after verifying (owner confirmed), leaving "Spelling Blocks" with 1 contact: `hello@brentspore.com`, added 07-14 by the old pre-double-opt-in subscribe. So the segment currently has no double-opted-in members — the first real one will arrive through the new flow.

---

**State (2026-07-15):** First real pass on a fresh Lovable TanStack Start export, shipped and live on spellingblocks.com (Vercel, `main a7dfd59`). Done this session:

- De-Lovabled: hand-written `vite.config.ts` replacing `@lovable.dev/vite-tanstack-config`, removed `AGENTS.md`/`.lovable/`/dead error shim/vendor favicon, regenerated the lockfile off public npm. Zero tool references in the repo.
- Puzzle validation: `src/data/puzzles.test.ts` checks all 130 puzzles (12 blocks, exact partition, par, 3-9 letters, in-dictionary), wired as a `prebuild` gate.
- Fixed two restore bugs (timer double-count on mid-solve refresh; placed blocks scrambling with duplicate letters) via tested helpers in `src/game/dailyState.ts`.
- Email via Resend as TanStack Start server routes: `/api/subscribe` (honeypot, validation, segment signup) and `/api/daily-reminder` (Bearer-cron broadcast); results-modal signup from the 2nd win.
- Ship-assets: branded og.png + favicon set (the export shipped the Lovable default favicon), JSON-LD, sitemap, robots, via a committed generator in `scripts/`.
- Fixed a Vercel-only build failure by pinning `zod` to v4 (TanStack Start's plugin needs `.prefault`).
- Shipped GA4 (`G-LMPMC200KR`) + the Synergy footer, and registered in `~/.ai/memory/portfolio.md`.

**Then a creative + feature pass (latest `9ef20c4`, all shipped + live-verified):**

- Blocks are physical now: bevel/thickness/contact shadow, press-down on tap, builder pop-in, weighty settle. Colour + rotation are CSS vars (`--c`/`--rot`) set inline by `Block.tsx`; the treatment lives in `styles.css`. Letters are light on dark blocks, ink on butter.
- The wall (`Game.tsx`) builds upward (`column-reverse`) as hand-stacked courses; solving adds `sb-wall--won` for a light sweep + a `--wi`-staggered wave. Warm lit tabletop (grain + spotlight) on `html,body` — cream, no brown. Block colours are a composed even spread (`assignColors` in `colors.ts`).
- Four-colour block logo: `public/favicon.svg` (+ regenerated ico/apple-touch) and in the header. OG image (`scripts/og.html`) and the canvas share card (`share.ts`) regenerated dimensional with more row spacing. Regenerate assets: `bash scripts/build-assets.sh` (needs Chrome).
- Solved-daily UX: the top slot counts down to tomorrow's puzzle; a "See results" button reopens share + signup (they were unreachable after solving).
- Achievements: `src/game/achievements.ts` (10, driven by stats incl. new `bestTimeMs`), badges in the Stats modal, an unlock callout on results. "More games" cross-promo (`MoreGames.tsx`) shows a random 3 of 8 network games.

**Run/verify:** `bun install`; `bun run dev` (:8080); `bun run test`; `bun run build`. For any build/deploy issue, ALWAYS test the frozen path: `rm -rf node_modules && bun install --frozen-lockfile && VERCEL=1 bun run build`.

**Next:** Add Spelling Blocks to the-trail-game and eyeball-it cross-promo lists (done already for five-second-game `MoreGames.tsx` and one-page-toys Friends of the gallery). Confirm the first daily cron fires (13:00 UTC) and a real signup lands in the Resend segment. Repo backlog: trim the ~4MB bundled dictionary.
