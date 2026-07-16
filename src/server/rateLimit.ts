// Fixed-window rate limiting held in memory. This is per-instance and therefore
// best effort: Vercel may run several SSR instances, so a determined attacker
// gets one allowance per warm instance. It stops the obvious floods without
// putting a database behind a form that otherwise needs no storage.

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

export type RateLimiter = {
  // Test and count in one step. For limiting attempts.
  check: (key: string, now?: number) => RateLimitResult;
  // Test without counting, so a caller can count only once the work succeeded.
  peek: (key: string, now?: number) => RateLimitResult;
  record: (key: string, now?: number) => void;
};

type Options = {
  limit: number;
  windowMs: number;
  // Bounds memory if an attacker cycles through keys.
  maxKeys?: number;
};

export function createRateLimiter({ limit, windowMs, maxKeys = 5000 }: Options): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const prune = (now: number) => {
    for (const [key, hit] of hits) {
      if (hit.resetAt <= now) hits.delete(key);
    }
    if (hits.size > maxKeys) {
      // Still oversized after dropping expired windows: evict whatever resets
      // soonest, since those keys are closest to being forgotten anyway.
      const byResetAt = [...hits.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
      for (const [key] of byResetAt.slice(0, hits.size - maxKeys)) hits.delete(key);
    }
  };

  const peek = (key: string, now = Date.now()): RateLimitResult => {
    prune(now);
    const hit = hits.get(key);
    if (!hit || hit.resetAt <= now) return { allowed: true, retryAfterMs: 0 };
    if (hit.count >= limit) return { allowed: false, retryAfterMs: hit.resetAt - now };
    return { allowed: true, retryAfterMs: hit.resetAt - now };
  };

  const record = (key: string, now = Date.now()): void => {
    prune(now);
    const hit = hits.get(key);
    if (!hit || hit.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }
    hit.count += 1;
  };

  return {
    peek,
    record,
    check(key, now = Date.now()) {
      const result = peek(key, now);
      if (result.allowed) record(key, now);
      return result;
    },
  };
}

// Vercel always sets x-forwarded-for. The first entry is the client; the rest
// are proxies. Everything unattributable shares one bucket.
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
