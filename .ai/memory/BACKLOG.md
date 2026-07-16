# Context

Spelling Blocks is a free daily word-packing puzzle (a Synergy game) at spellingblocks.com: use all twelve letter blocks by spelling words that partition them.

Not loaded into context every session — pull from here when picking up new work or reviewing project scope. If an item belongs across multiple projects, move it to `~/.ai/memory/BACKLOG.md` instead. Work items only: decisions belong in `.ai/memory/DECISIONS.md`; active missions and directives belong in project memory that loads every session.

## Entry format

Items in this file follow the structure below so that any AI tool or human editing the file directly produces entries Backlog Viewer can parse, display, and manage. Keep this section intact — it is the in-file format reference that prevents format drift. Backlog Viewer hides it from the app display and treats the example item as a template, not a real entry.

### Item title

**Why it matters:** What value this delivers or what risk it avoids.

**When to revisit:** The specific trigger or condition that makes this worth acting on.

**Notes:** Context, constraints, related files, or prior decisions.

---


### Synergy footer and GDPR footer

**Why it matters:** Portfolio-standard footer (Synergy logo + GDPR/privacy line) for brand consistency and compliance. SHIPPED 2026-07-15: Game.tsx renders the Synergy-logo footer + "© 2026 Synergy. We use cookies for analytics." Remaining scope is only whatever fuller GDPR/privacy-page treatment the house standard requires beyond that line.

**When to revisit:** During a branding/compliance pass, or when other portfolio sites get the same treatment.

**Notes:** See the bootstrap-repo standard site kit.

---

### Trim the bundled dictionary

**Why it matters:** `an-array-of-english-words` (~4MB) is bundled into the SSR routes chunk (build shows the chunk-size warning). A smaller, curated word set would cut bundle size and cold-start cost.

**When to revisit:** If build size or SSR cold starts become a concern, or when reworking word validation.

**Notes:** `src/game/dictionary.ts` filters to 3-9 letter words. A prebuilt trimmed set (or a compact structure) would replace the full list. The puzzle-validation test must keep validating against whatever list the game uses.

### Migrate capture to the synergy-capture Worker

**Why it matters:** The shared Worker is deployed and its contact-creation path is PROVEN (2026-07-16 21:40 UTC). This repo's in-repo capture (`/api/subscribe`, `/confirm`, `src/server/optInToken.ts`, `src/server/rateLimit.ts`, `SUBSCRIBE_SECRET` in Vercel) is the reference implementation the Worker was lifted from — it retires after migration, ending the two-copies drift that produced 2026-07-16's paired bugs.

**When to revisit:** Unblocked now. Coordinate with the-trail-game's migration so the network converges in one pass.

**Notes:** Point the form at `POST https://synergy-capture.brent-816.workers.dev/subscribe` with `{email, source: "spellingblocks", website}` (honeypot ships empty — a browser autofilling it silently no-ops a real signup) and map `ok`/`invalid`/`rate_limited`/`failed`. **Landmine: keep `/confirm` alive 48h past cutover** — in-repo tokens live 48h and outstanding emailed links point at it. Decide the confirm-link host first (Worker currently mints workers.dev links). Recipes + ids: `email-ops` skill.

---
