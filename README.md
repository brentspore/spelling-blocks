# Spelling Blocks

Twelve letter blocks. Use every one. A free daily word-packing puzzle.

## Development

```bash
bun install      # install dependencies
bun run dev      # start the dev server (http://localhost:8080)
bun run test     # validate every puzzle
bun run build    # production build (runs the puzzle tests first)
bun run preview  # preview the production build
```

### API routes

Email signup (`/api/subscribe`) and the daily reminder (`/api/daily-reminder`)
are TanStack Start server routes in `src/routes/api/`. They run under `bun run
dev` and deploy inside the SSR function, so no separate `vercel dev` is needed.
They read these environment variables (set them in `.env.local` for local dev and
in the Vercel project for deploys):

- `RESEND_API_KEY` — Resend API key
- `RESEND_SEGMENT_ID` — Resend segment the signups join and the reminder sends to
- `RESEND_TOPIC_ID` — Resend topic the reminder is scoped to. Without it the
  unsubscribe link would unsubscribe the reader from every game on the Resend
  account, since `unsubscribed` is a contact-level flag rather than a per-segment one
- `CRON_SECRET` — shared secret Vercel Cron sends as `Authorization: Bearer` to `/api/daily-reminder`

The reminder cron (`vercel.json`) runs daily at 13:00 UTC (6am Pacific during
daylight saving; Vercel Cron is UTC only and does not shift with DST).
