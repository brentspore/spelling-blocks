import { createFileRoute } from "@tanstack/react-router";
import { Resend } from "resend";
import { verifyOptInToken } from "@/server/optInToken";

const SITE_URL = "https://spellingblocks.com";

function isAlreadyOnList(error: { statusCode: number | null; message: string }): boolean {
  return error.statusCode === 409 || /already|exists/i.test(error.message ?? "");
}

// A standalone page: it is opened straight from an email client, so it carries
// its own styles rather than booting the app shell.
function renderPage(title: string, body: string, status: number): Response {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · Spelling Blocks</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700..800&family=Schibsted+Grotesk:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #f1e7d0;
        color: #26221b;
        font-family: "Schibsted Grotesk", system-ui, sans-serif;
        text-align: center;
      }
      main { max-width: 420px; }
      h1 {
        font-family: "Bricolage Grotesque", system-ui, sans-serif;
        font-size: 32px;
        font-weight: 800;
        line-height: 1.15;
        margin: 0 0 12px;
      }
      p { font-size: 16px; line-height: 1.5; margin: 0 0 24px; opacity: 0.8; }
      a.play {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 10px;
        background: #c7402d;
        color: #f1e7d0;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function playLink(label: string): string {
  return `<a class="play" href="${SITE_URL}?utm_source=email&utm_medium=confirm&utm_campaign=optin">${label}</a>`;
}

async function confirm(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get("t") ?? "";

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  const secret = process.env.SUBSCRIBE_SECRET;
  if (!apiKey || !segmentId || !secret) {
    console.error("confirm: RESEND_API_KEY, RESEND_SEGMENT_ID or SUBSCRIBE_SECRET is not set");
    return renderPage(
      "Something went wrong",
      `<h1>Something went wrong</h1>
       <p>We could not confirm your signup right now. Try the link again in a few minutes.</p>
       ${playLink("Play today's puzzle")}`,
      500,
    );
  }

  const result = await verifyOptInToken(token, secret);
  if (!result.ok) {
    const expired = result.reason === "expired";
    return renderPage(
      expired ? "That link expired" : "That link did not work",
      `<h1>${expired ? "That link expired" : "That link did not work"}</h1>
       <p>${
         expired
           ? "Confirmation links last 48 hours. Sign up again from the results screen and we will send a fresh one."
           : "Check that you copied the whole link, or sign up again from the results screen."
       }</p>
       ${playLink("Play today's puzzle")}`,
      400,
    );
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      email: result.email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });
    // No error, or the address is already on the list: both count as confirmed.
    if (error && !isAlreadyOnList(error)) {
      console.error("confirm: resend error", error);
      return renderPage(
        "Something went wrong",
        `<h1>Something went wrong</h1>
         <p>We could not confirm your signup right now. Try the link again in a few minutes.</p>
         ${playLink("Play today's puzzle")}`,
        502,
      );
    }
    return renderPage(
      "You're in",
      `<h1>You're in</h1>
       <p>The new puzzle lands in your inbox every morning. Every email has an unsubscribe link.</p>
       ${playLink("Play today's puzzle")}`,
      200,
    );
  } catch (err) {
    console.error("confirm: unexpected error", err);
    return renderPage(
      "Something went wrong",
      `<h1>Something went wrong</h1>
       <p>We could not confirm your signup right now. Try the link again in a few minutes.</p>
       ${playLink("Play today's puzzle")}`,
      500,
    );
  }
}

export const Route = createFileRoute("/confirm")({
  server: {
    handlers: {
      GET: ({ request }) => confirm(request),
    },
  },
});
