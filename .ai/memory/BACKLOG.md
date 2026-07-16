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

### Wire GA4 analytics

**Why it matters:** No usage measurement today (plays, retention, share/signup conversion), so there is no read on whether the daily loop is working.

**When to revisit:** When it is worth learning how people actually play, or before any acquisition push.

**Notes:** Standard site-kit item. Add the tag in `src/routes/__root.tsx` head/scripts.

---

### Synergy footer and GDPR footer

**Why it matters:** Portfolio-standard footer (Synergy logo + GDPR/privacy line) for brand consistency and compliance. The footer is currently just the text "A Synergy game." in `Game.tsx`.

**When to revisit:** During a branding/compliance pass, or when other portfolio sites get the same treatment.

**Notes:** See the bootstrap-repo standard site kit.

---

### Trim the bundled dictionary

**Why it matters:** `an-array-of-english-words` (~4MB) is bundled into the SSR routes chunk (build shows the chunk-size warning). A smaller, curated word set would cut bundle size and cold-start cost.

**When to revisit:** If build size or SSR cold starts become a concern, or when reworking word validation.

**Notes:** `src/game/dictionary.ts` filters to 3-9 letter words. A prebuilt trimmed set (or a compact structure) would replace the full list. The puzzle-validation test must keep validating against whatever list the game uses.
