# Handoff

**State (2026-07-16): double opt-in + throttling on the subscribe form.**

Signup used to add the address to the Resend segment on submit, so anyone could sign up someone else's address. Now:

- `/api/subscribe` validates + honeypots as before, then mints an HMAC token and sends a confirmation email. It no longer touches the contact list.
- `/confirm` (`src/routes/confirm.ts`, a server route rendering its own HTML) verifies the token and creates the contact in the segment. Handles invalid, expired, already-on-list, and Resend failure.
- `src/server/optInToken.ts` — pure mint/verify, 48h expiry, constant-time compare. `optInToken.test.ts` covers round-trip, expiry, wrong secret, forged payload, malformed input.
- `src/server/rateLimit.ts` — in-memory fixed-window limiter. Subscribe throttles 1 per address / 10 min (silent `ok:true`, no send, no signal to a bomber) and 5 per IP / hour (429 + `retry-after`). The address cooldown is `peek`ed and only `record`ed after a successful send, so a Resend failure never locks a player out of retrying — that split is the reason the limiter has `peek`/`record` and not just `check`.
- `SUBSCRIBE_SECRET` is set in Vercel (owner did it 2026-07-16). Both endpoints fail closed with a 500 without it.
- Results modal copy now says to check the inbox rather than claiming they are subscribed.

**Throttling is best effort by design:** the counters are per SSR instance, so Vercel running several instances means an attacker gets one allowance per instance. It stops casual floods without putting a database behind a form that otherwise needs no storage. Durable upgrade if abuse ever shows up: Upstash/Vercel KV via the marketplace, or Turnstile on the form.

**Verified:** 163 tests, typecheck, lint, `bun run build` all pass. Drove the dev server for real: confirm's no-token / garbage / expired branches render the right page + 400; subscribe's invalid-email (400) and honeypot (silent 200); per-IP throttle allows exactly 5 then 429s with `retry-after: 3583`; a different IP is unaffected; and a failed send leaves the address free to retry. **The Resend calls themselves are NOT locally verifiable — `.env.local` holds placeholder Resend values** (20-char key vs the real ~36), so both endpoints reach the API and get "API key is invalid". That proves the requests are well formed, not that the write lands. `spellingblocks.com` is verified for sending.

**Still owed:** one real end-to-end signup on production (submit a real address, click the link, confirm the contact lands in the segment). Needs a real inbox, so it was left for the owner. `delivered@resend.dev` exercises the send path without a real inbox but gives you no link to click.

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
