# Handoff

**State (2026-07-15):** First real pass on a fresh Lovable TanStack Start export, shipped and live on spellingblocks.com (Vercel, `main a7dfd59`). Done this session:
- De-Lovabled: hand-written `vite.config.ts` replacing `@lovable.dev/vite-tanstack-config`, removed `AGENTS.md`/`.lovable/`/dead error shim/vendor favicon, regenerated the lockfile off public npm. Zero tool references in the repo.
- Puzzle validation: `src/data/puzzles.test.ts` checks all 130 puzzles (12 blocks, exact partition, par, 3-9 letters, in-dictionary), wired as a `prebuild` gate.
- Fixed two restore bugs (timer double-count on mid-solve refresh; placed blocks scrambling with duplicate letters) via tested helpers in `src/game/dailyState.ts`.
- Email via Resend as TanStack Start server routes: `/api/subscribe` (honeypot, validation, segment signup) and `/api/daily-reminder` (Bearer-cron broadcast); results-modal signup from the 2nd win.
- Ship-assets: branded og.png + favicon set (the export shipped the Lovable default favicon), JSON-LD, sitemap, robots, via a committed generator in `scripts/`.
- Fixed a Vercel-only build failure by pinning `zod` to v4 (TanStack Start's plugin needs `.prefault`).

**Run/verify:** `bun install`; `bun run dev` (:8080); `bun run test`; `bun run build`. For any build/deploy issue, ALWAYS test the frozen path: `rm -rf node_modules && bun install --frozen-lockfile && VERCEL=1 bun run build`.

**Next:** Confirm the first daily cron fires (13:00 UTC) and that a real signup lands in the Resend segment. Optional site-kit still open: GA4 analytics, Synergy footer + GDPR footer (footer is currently just "A Synergy game."). Portfolio registration in `~/.ai/memory/portfolio.md` still pending owner OK.
