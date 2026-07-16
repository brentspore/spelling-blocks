import { createFileRoute } from "@tanstack/react-router";
import { Resend } from "resend";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function field(body: unknown, key: string): string {
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value.trim();
  }
  return "";
}

function isAlreadyOnList(error: { statusCode: number | null; message: string }): boolean {
  return error.statusCode === 409 || /already|exists/i.test(error.message ?? "");
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

  const apiKey = process.env.RESEND_API_KEY;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!apiKey || !segmentId) {
    console.error("subscribe: RESEND_API_KEY or RESEND_SEGMENT_ID is not set");
    return json({ ok: false, error: "Signup is not available right now." }, 500);
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    });
    // No error, or the address is already on the list: both count as success.
    if (error && !isAlreadyOnList(error)) {
      console.error("subscribe: resend error", error);
      return json({ ok: false, error: "Signup is not available right now." }, 502);
    }
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
