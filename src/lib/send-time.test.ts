import { describe, expect, it } from "vitest";
import { planSend } from "./send-time";

const plan = (iso: string) => {
  const { date, at } = planSend(new Date(iso));
  return { date, at: at ? at.toISOString() : null };
};

describe("the send-time plan", () => {
  it("has the 13:00 UTC cron book 8 AM Pacific the same day", () => {
    expect(plan("2026-10-09T13:00:00Z")).toEqual({ date: "2026-10-09", at: "2026-10-09T15:00:00.000Z" });
  });

  it("still books ahead in winter, when 13:00 UTC is 5 AM Pacific", () => {
    expect(plan("2026-12-09T13:00:00Z")).toEqual({ date: "2026-12-09", at: "2026-12-09T16:00:00.000Z" });
  });

  it("sends now when triggered by hand after 8 AM", () => {
    expect(plan("2026-10-08T19:08:00Z")).toEqual({ date: "2026-10-08", at: null });
  });

  it("books tomorrow from the 4 PM cutoff on", () => {
    expect(plan("2026-10-08T22:59:00Z").date).toBe("2026-10-08");
    expect(plan("2026-10-08T23:00:00Z").date).toBe("2026-10-09");
  });

  it("stays at 8 AM local across both DST changes", () => {
    expect(plan("2026-11-01T13:00:00Z").at).toBe("2026-11-01T16:00:00.000Z");
    expect(plan("2027-03-14T13:00:00Z").at).toBe("2027-03-14T15:00:00.000Z");
  });
});
