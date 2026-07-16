# Handoff

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
