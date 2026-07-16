# Project Decisions

Durable decisions specific to this project that should not be relitigated every time they come up.

If a decision should apply across multiple projects, record it in `~/.ai/memory/DECISIONS.md` instead. If this project intentionally differs from a global decision, record the exception here and reference the global default.

---

### 2026-07-15 — Hand-written Vite config instead of the Lovable wrapper

**Context:** The export's whole build was `@lovable.dev/vite-tanstack-config`. "No tool names anywhere" required removing it, but it is load-bearing (bundles TanStack Start, nitro, Tailwind, aliases).

**Decision:** Replace it with a plain hand-written `vite.config.ts` using the underlying plugins directly (all already direct deps). Nitro keeps `defaultPreset: "cloudflare-module"` as a fallback; Vercel auto-detection wins on deploy.

**Rationale:** Removes the vendor dependency, keeps the exact same Vercel/nitro output, and the config is now legible and portable.

**Revisit if:** Upgrading TanStack Start / nitro majors, or moving off Vercel.

---

### 2026-07-15 — Email endpoints are TanStack Start server routes, not root `api/`

**Context:** The email work was first written as root `api/*.ts` Vercel functions. On this stack, nitro's Vercel Build Output API (`.vercel/output`) is the entire deployment, and Vercel does not compile a root `api/` dir — those functions silently 404.

**Decision:** Implement `/api/subscribe` and `/api/daily-reminder` as TanStack Start server routes in `src/routes/api/` (`server.handlers`, Web Request/Response). They bundle into the SSR function and also run under `bun run dev`.

**Rationale:** Only way to have working `/api/*` endpoints on this stack; better local DX too (no `vercel dev` needed).

**Revisit if:** The app stops using nitro's Build Output API, or moves to a platform where root `api/` functions deploy.

---

### 2026-07-15 — Pin `zod` to v4

**Context:** `@tanstack/start-plugin-core` calls `zod`'s `.prefault()` (a v4 method). The export pinned `zod@^3`. A warm local `bun install` nested a v4 copy for the plugin so it built locally, but Vercel's clean frozen install resolved the plugin to the top-level v3 and the build failed loading `vite.config.ts`.

**Decision:** Pin the app to `zod@^4.4.3`. The app uses no zod directly, so a single v4 satisfies everything with nothing to nest.

**Rationale:** Removes the version conflict entirely; the `.prefault` failure becomes structurally impossible.

**Revisit if:** The app starts using zod directly, or TanStack Start changes its zod requirement.

---

### 2026-07-15 — Puzzle validation gates the build

**Context:** Puzzles are hand-authored data; a bad one (wrong letter count, unknown word) would ship silently.

**Decision:** `src/data/puzzles.test.ts` validates every daily and practice puzzle, wired as the `prebuild` script so `bun run build` (and Vercel) fails on a bad puzzle before building.

**Rationale:** A broken puzzle can never reach production.

**Revisit if:** Puzzle generation moves server-side or to a database.
