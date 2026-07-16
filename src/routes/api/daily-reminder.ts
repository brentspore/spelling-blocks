import { createFileRoute } from "@tanstack/react-router";
import { Resend } from "resend";
import { getTodayPuzzleNumber } from "@/game/daily";

const SITE_URL = "https://spellingblocks.com";
const PLAY_URL = `${SITE_URL}?utm_source=email&utm_medium=daily&utm_campaign=reminder`;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// The whole email lives in this one function so it is easy to restyle later.
// Table-based markup and inline styles keep it readable across email clients.
function renderEmail(puzzleNumber: number): string {
  const paper = "#f1e7d0";
  const ink = "#26221b";
  const cherry = "#c7402d";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:${paper};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;font-family:'Schibsted Grotesk',Helvetica,Arial,sans-serif;color:${ink};">
            <tr>
              <td style="font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;opacity:0.7;padding-bottom:8px;">
                Spelling Blocks
              </td>
            </tr>
            <tr>
              <td style="font-size:28px;font-weight:800;line-height:1.2;padding-bottom:12px;">
                Puzzle #${puzzleNumber} is up
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.5;padding-bottom:24px;">
                Today's puzzle is ready. Twelve letter blocks, use every one.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${cherry};border-radius:10px;">
                      <a href="${PLAY_URL}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:${paper};text-decoration:none;">
                        Play today's puzzle
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(38,34,27,0.2);padding-top:20px;font-size:13px;line-height:1.5;opacity:0.7;">
                You are getting this because you signed up at spellingblocks.com.
                <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${ink};">Unsubscribe</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendReminder(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  // A contact's unsubscribed flag is account-wide in Resend, not per segment, so
  // an unscoped broadcast hands the reader an unsubscribe link that silences
  // every other game on the account too. Scoping to a topic gives them a
  // preference page where they can drop this one and keep the rest.
  const topicId = process.env.RESEND_TOPIC_ID;
  if (!apiKey || !segmentId || !topicId) {
    console.error(
      "daily-reminder: RESEND_API_KEY, RESEND_SEGMENT_ID or RESEND_TOPIC_ID is not set",
    );
    return json({ ok: false, error: "Not configured." }, 500);
  }

  const puzzleNumber = getTodayPuzzleNumber();
  const resend = new Resend(apiKey);

  /* `?dry_run=1` checks the wiring without mailing anyone: it proves the key
     works and that the segment and topic ids actually resolve. Env vars can be
     set to a typo and still look present, and the only other way to exercise
     this route is to send a real broadcast to real people. */
  if (new URL(request.url).searchParams.get("dry_run") === "1") {
    const [segment, topic] = await Promise.all([
      resend.segments.get(segmentId),
      resend.topics.get(topicId),
    ]);
    if (segment.error || topic.error) {
      console.error("daily-reminder: dry run failed", segment.error ?? topic.error);
      return json(
        {
          ok: false,
          error: segment.error ? "Segment id did not resolve." : "Topic id did not resolve.",
        },
        500,
      );
    }
    return json({
      ok: true,
      dryRun: true,
      puzzleNumber,
      segment: segment.data?.name ?? null,
      topic: topic.data?.name ?? null,
    });
  }

  try {
    const { data, error } = await resend.broadcasts.create({
      segmentId,
      topicId,
      from: "Spelling Blocks <puzzle@spellingblocks.com>",
      subject: `Spelling Blocks #${puzzleNumber} is up`,
      html: renderEmail(puzzleNumber),
      send: true,
    });
    if (error) {
      console.error("daily-reminder: resend error", error);
      return json({ ok: false, error: "Send failed." }, 502);
    }
    return json({ ok: true, puzzleNumber, broadcastId: data?.id ?? null });
  } catch (err) {
    console.error("daily-reminder: unexpected error", err);
    return json({ ok: false, error: "Send failed." }, 500);
  }
}

// Vercel Cron invokes this with a GET; POST is accepted for manual triggering.
export const Route = createFileRoute("/api/daily-reminder")({
  server: {
    handlers: {
      GET: ({ request }) => sendReminder(request),
      POST: ({ request }) => sendReminder(request),
    },
  },
});
