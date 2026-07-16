import { describe, it, expect } from "vitest";
import { createRateLimiter, clientIp } from "./rateLimit";

const NOW = 1_752_000_000_000;
const MINUTE = 60 * 1000;

describe("createRateLimiter", () => {
  it("allows up to the limit inside the window", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 10 * MINUTE });
    expect(limiter.check("a", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW).allowed).toBe(false);
  });

  it("reports how long the caller has to wait", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10 * MINUTE });
    limiter.check("a", NOW);
    const blocked = limiter.check("a", NOW + 4 * MINUTE);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(6 * MINUTE);
  });

  it("lets the caller back in once the window rolls over", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10 * MINUTE });
    expect(limiter.check("a", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW + 9 * MINUTE).allowed).toBe(false);
    expect(limiter.check("a", NOW + 10 * MINUTE).allowed).toBe(true);
  });

  it("keeps separate keys independent", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10 * MINUTE });
    expect(limiter.check("a", NOW).allowed).toBe(true);
    expect(limiter.check("a", NOW).allowed).toBe(false);
    expect(limiter.check("b", NOW).allowed).toBe(true);
  });

  it("peeks without counting the attempt", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10 * MINUTE });
    expect(limiter.peek("a", NOW).allowed).toBe(true);
    expect(limiter.peek("a", NOW).allowed).toBe(true);
    limiter.record("a", NOW);
    expect(limiter.peek("a", NOW).allowed).toBe(false);
  });

  it("does not grow without bound when keys are cycled", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10 * MINUTE, maxKeys: 10 });
    for (let i = 0; i < 500; i++) limiter.check(`key-${i}`, NOW);
    // Every key is still inside its window, so only the cap can bound this.
    expect(limiter.check("fresh", NOW).allowed).toBe(true);
    // A limiter that leaked would be holding all 500 windows.
    expect(limiter.check("key-0", NOW + 11 * MINUTE).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  const req = (headers: Record<string, string>) =>
    new Request("https://spellingblocks.com/api/subscribe", { headers });

  it("takes the client from the front of x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.7, 70.41.3.18" }))).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("buckets unattributable callers together", () => {
    expect(clientIp(req({}))).toBe("unknown");
    expect(clientIp(req({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});
