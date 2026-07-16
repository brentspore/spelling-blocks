import { createFileRoute } from "@tanstack/react-router";
import { Resend } from "resend";
import { mintOptInToken } from "@/server/optInToken";
import { createRateLimiter, clientIp } from "@/server/rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = "https://spellingblocks.com";

// This endpoint mails whatever address it is handed, so it is throttled twice:
// per address, so nobody can bomb someone else's inbox by resubmitting it, and
// per IP, so one source cannot spray confirmations at many addresses. Held at
// module scope to survive between invocations on a warm instance.
const perAddress = createRateLimiter({ limit: 1, windowMs: 10 * 60 * 1000 });
const perIp = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });

function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function field(body: unknown, key: string): string {
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

// The whole email lives in this one function so it is easy to restyle later.
// Table-based markup and inline styles keep it readable across email clients.
function renderConfirmEmail(confirmUrl: string): string {
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
                One tap to confirm
              </td>
            </tr>
            <tr>
              <td style="font-size:16px;line-height:1.5;padding-bottom:24px;">
                Confirm this address and you will get the new puzzle every morning. If you did not sign up, ignore this email and nothing happens.
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:28px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:${cherry};border-radius:10px;">
                      <a href="${confirmUrl}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:700;color:${paper};text-decoration:none;">
                        Confirm my signup
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid rgba(38,34,27,0.2);padding-top:20px;font-size:13px;line-height:1.5;opacity:0.7;">
                This link works for 48 hours. You are not on the list until you use it.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function subscribe(request: Request): Promise<Response> {
  const body = await request.json().catch(() => ({}));

  // Honeypot: real people leave this hidden field empty; bots fill it. Drop the
  // submission silently and report success so the bot learns nothing.
  if (field(body, "website")) return json({ ok: true });

  const email = field(body, "email").toLowerCase();
  if (email.length < 3 || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "Enter a valid email address." }, 400);
  }

  const ip = perIp.check(clientIp(request));
  if (!ip.allowed) {
    return json({ ok: false, error: "Too many signups from here. Try again later." }, 429, {
      "retry-after": String(Math.ceil(ip.retryAfterMs / 1000)),
    });
  }

  // Same address again inside the cooldown: report success without sending. The
  // first confirmation email is already on its way, so this is honest for a
  // player who did not see it yet, and tells a bomber nothing. Only peek here;
  // the cooldown starts once an email has actually gone out, so a Resend
  // failure does not lock the address out of retrying.
  if (!perAddress.peek(email).allowed) return json({ ok: true });

  const apiKey = process.env.RESEND_API_KEY;
  const secret = process.env.SUBSCRIBE_SECRET;
  if (!apiKey || !secret) {
    console.error("subscribe: RESEND_API_KEY or SUBSCRIBE_SECRET is not set");
    return json({ ok: false, error: "Signup is not available right now." }, 500);
  }

  try {
    const token = await mintOptInToken(email, secret);
    const confirmUrl = `${SITE_URL}/confirm?t=${encodeURIComponent(token)}`;
    const resend = new Resend(apiKey);
    // Nothing is written to the contact list here. The address only joins the
    // segment once /confirm verifies the token from this email.
    const { error } = await resend.emails.send({
      from: "Spelling Blocks <puzzle@spellingblocks.com>",
      to: email,
      subject: "Confirm your Spelling Blocks signup",
      html: renderConfirmEmail(confirmUrl),
    });
    if (error) {
      console.error("subscribe: resend error", error);
      return json({ ok: false, error: "Signup is not available right now." }, 502);
    }
    perAddress.record(email);
    return json({ ok: true });
  } catch (err) {
    console.error("subscribe: unexpected error", err);
    return json({ ok: false, error: "Signup is not available right now." }, 500);
  }
}

export const Route = createFileRoute("/api/subscribe")({
  server: {
    handlers: {
      POST: ({ request }) => subscribe(request),
    },
  },
});
