import { describe, it, expect } from "vitest";
import { mintOptInToken, verifyOptInToken } from "./optInToken";

const SECRET = "test-secret-value";
const NOW = 1_752_000_000_000;
const HOUR = 60 * 60 * 1000;

describe("opt-in tokens", () => {
  it("round-trips the address", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    expect(await verifyOptInToken(token, SECRET, NOW)).toEqual({
      ok: true,
      email: "player@example.com",
    });
  });

  it("still verifies just before the 48 hour expiry", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    const result = await verifyOptInToken(token, SECRET, NOW + 47 * HOUR);
    expect(result.ok).toBe(true);
  });

  it("rejects a token past its expiry", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    expect(await verifyOptInToken(token, SECRET, NOW + 49 * HOUR)).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    expect(await verifyOptInToken(token, "other-secret", NOW)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a tampered address", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    const signature = token.split(".")[1];
    const forged = btoa(JSON.stringify({ e: "attacker@example.com", x: NOW + 48 * HOUR }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyOptInToken(`${forged}.${signature}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects a tampered expiry", async () => {
    const token = await mintOptInToken("player@example.com", SECRET, NOW);
    const signature = token.split(".")[1];
    const forged = btoa(JSON.stringify({ e: "player@example.com", x: NOW + 400 * HOUR }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyOptInToken(`${forged}.${signature}`, SECRET, NOW)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("rejects malformed tokens", async () => {
    for (const bad of ["", ".", "nodot", "a.b.c", "...", "!!!.???"]) {
      expect(await verifyOptInToken(bad, SECRET, NOW)).toEqual({ ok: false, reason: "invalid" });
    }
  });
});
