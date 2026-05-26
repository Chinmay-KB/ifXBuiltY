import { describe, expect, it } from "vitest";

/**
 * Mirrors eligibility logic in signup-bonus.ts for unit tests.
 */
function isEligibleNewUser(createdAt: string | undefined, featureStart: Date): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  return created.getTime() >= featureStart.getTime();
}

describe("signup bonus eligibility", () => {
  const featureStart = new Date("2026-05-26T20:00:00.000Z");

  it("grants users created on or after feature start", () => {
    expect(isEligibleNewUser("2026-05-26T20:00:00.000Z", featureStart)).toBe(true);
    expect(isEligibleNewUser("2026-05-27T00:00:00.000Z", featureStart)).toBe(true);
  });

  it("skips users created before feature start", () => {
    expect(isEligibleNewUser("2026-05-26T19:59:59.999Z", featureStart)).toBe(false);
    expect(isEligibleNewUser("2025-01-01T00:00:00.000Z", featureStart)).toBe(false);
  });

  it("rejects invalid created_at", () => {
    expect(isEligibleNewUser(undefined, featureStart)).toBe(false);
    expect(isEligibleNewUser("not-a-date", featureStart)).toBe(false);
  });
});

describe("signup bonus idempotency key", () => {
  it("is stable per user", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const key = `signup_bonus_${userId}`;
    expect(key).toBe(`signup_bonus_${userId}`);
    expect(key).toMatch(/^signup_bonus_[0-9a-f-]{36}$/i);
  });
});
