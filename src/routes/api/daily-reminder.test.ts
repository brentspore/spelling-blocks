import { describe, expect, it } from "vitest";
import { MAILING_ADDRESS, renderEmail } from "./daily-reminder";

/* This email is assembled in code, so unlike a template file there is nothing to
   eyeball before it goes to a list. It shipped without a postal address until
   2026-07-16, which CAN-SPAM requires on bulk mail, so the footer is held to it
   here instead. The trail game guards the same rule with a send interlock. */
describe("daily reminder email", () => {
  const html = renderEmail(197);

  it("carries a physical mailing address", () => {
    expect(html).toContain(MAILING_ADDRESS);
  });

  it("has a US state and ZIP in it, not just an address-shaped string", () => {
    expect(html).toMatch(/\b[A-Z]{2}\s+\d{5}(-\d{4})?\b/);
  });

  it("carries the unsubscribe merge tag so Resend can do one-click unsubscribe", () => {
    expect(html).toContain("{{{RESEND_UNSUBSCRIBE_URL}}}");
  });

  it("names the puzzle it is about", () => {
    expect(html).toContain("#197");
  });
});
