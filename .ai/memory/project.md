---
name: Project overview
description: Durable project-specific context for AI tools
type: project
---

**What it is:** Spelling Blocks, a free daily word-packing puzzle at spellingblocks.com. Each puzzle gives twelve letter blocks; you use every block by spelling words that exactly partition all twelve letters. A Synergy game.

**Audience/user:** Casual daily-puzzle players (Wordle-adjacent). Mobile-first, no account needed. Daily puzzle plus an endless practice mode.

**Core product direction:** Fast, tactile, one-screen daily puzzle. Tap blocks to build a word, place it on the wall, use all twelve. Daily state and stats persist in localStorage. It is intentionally not an account-based app or a heavy game.

**Tech stack:** TanStack Start (React 19, SSR) on Vite 8, with nitro producing the server output (auto-detects the Vercel preset on deploy). Tailwind v4 + shadcn/ui, TypeScript. Email via Resend. Deployed on Vercel (auto-deploy on push to main). The word list is `an-array-of-english-words`, filtered to 3-9 letters and bundled.

**Important source areas:**
- `src/routes/` — TanStack file routes. `index.tsx` renders the game, `__root.tsx` holds head/meta/JSON-LD plus the app shell, `api/subscribe.ts` and `api/daily-reminder.ts` are server routes (the email endpoints).
- `src/components/Game.tsx` — the entire game (tray, builder, word wall, timer, modals).
- `src/game/` — `dictionary.ts`, `daily.ts` (LAUNCH_DATE and today's puzzle number), `storage.ts` (localStorage state and stats), `share.ts` (share text and canvas card), `colors.ts`, `audio.ts`, `dailyState.ts` (pure, tested restore/keyboard helpers).
- `src/data/puzzles.ts` — daily and practice solution sets; blocks are derived by a seeded shuffle of the solution letters.
- `scripts/` — committed asset generator (og.png, favicon set) rendered via headless Chrome.

**Working rules:**
- No Lovable/AI/tool references anywhere in code, copy, meta, or assets. Human-voice copy: sentence case, plain verbs, no em dashes, no emoji. "Synergy" in anything public, never Brent's name.
- Puzzles are validated by a vitest `prebuild` gate (`src/data/puzzles.test.ts`): 12 blocks, solution words partition them, par equals word count, each word 3-9 letters and in the dictionary. A bad puzzle can never ship.
- Email endpoints are TanStack Start server routes, NOT root `api/` Vercel functions. With nitro's Vercel Build Output API, a root `api/` dir is dropped; server routes bundle into the SSR function and work.
- `zod` is pinned to v4 (TanStack Start's plugin calls `.prefault`, a v4 method). The app uses no zod directly.
- Always test the frozen-lockfile install path for build issues (see reference.md) — warm local installs hide resolution bugs that only bite Vercel's clean install.

**Builder/import notes:** Started as a Lovable TanStack Start export and was de-Lovabled: the vendored `@lovable.dev/vite-tanstack-config` was replaced with a hand-written `vite.config.ts`, and `AGENTS.md`, `.lovable/`, the dead error-reporting shim, and the default vendor favicon were removed; the lockfile was regenerated off the public npm registry. No longer synced to Lovable — treat this as a plain GitHub + Vercel repo.

**Current-state checkpoint:** Live on spellingblocks.com. See HANDOFF.md for current state and how to run/verify.
