import { describe, it, expect, beforeEach, vi } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("rate-limit utility", () => {
  beforeEach(() => {
    // Clear global trackers between tests by mock resetting if necessary, but since they are encapsulated,
    // we can just use unique keys per test run.
    vi.useFakeTimers();
  });

  it("should allow requests under the limit and then rate limit", () => {
    const key = "user-123";
    const limit = 3;
    const interval = 1000; // 1s

    // First 3 requests should be allowed
    expect(isRateLimited(key, limit, interval)).toBe(false);
    expect(isRateLimited(key, limit, interval)).toBe(false);
    expect(isRateLimited(key, limit, interval)).toBe(false);

    // 4th request should be rate limited
    expect(isRateLimited(key, limit, interval)).toBe(true);
  });

  it("should reset after the interval passes", () => {
    const key = "user-456";
    const limit = 2;
    const interval = 1000; // 1s

    expect(isRateLimited(key, limit, interval)).toBe(false);
    expect(isRateLimited(key, limit, interval)).toBe(false);
    expect(isRateLimited(key, limit, interval)).toBe(true); // limited

    // Advance time by 1001ms
    vi.advanceTimersByTime(1001);

    // Now it should be allowed again
    expect(isRateLimited(key, limit, interval)).toBe(false);
  });
});
