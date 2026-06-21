import { describe, it, expect, vi } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatCount,
  formatCompact,
  initials,
} from "./format";

describe("format utility", () => {
  describe("formatDate", () => {
    it("should return empty string for null/undefined", () => {
      expect(formatDate(null)).toBe("");
      expect(formatDate(undefined)).toBe("");
    });

    it("should return empty string for invalid date inputs", () => {
      expect(formatDate("invalid-date")).toBe("");
    });

    it("should format valid Date object, string, or number", () => {
      // Jun 20, 2026
      const date = new Date(2026, 5, 20); // Month is 0-indexed, so 5 is June
      expect(formatDate(date)).toBe("Jun 20, 2026");
      expect(formatDate(date.toISOString())).toBe("Jun 20, 2026");
      expect(formatDate(date.getTime())).toBe("Jun 20, 2026");
    });
  });

  describe("formatDateTime", () => {
    it("should return empty string for null/undefined/invalid", () => {
      expect(formatDateTime(null)).toBe("");
      expect(formatDateTime(undefined)).toBe("");
      expect(formatDateTime("invalid")).toBe("");
    });

    it("should format valid date with time", () => {
      // Jun 20, 2026 at 3:45 PM
      const date = new Date(2026, 5, 20, 15, 45, 0);
      expect(formatDateTime(date)).toBe("Jun 20, 2026, 3:45 PM");
    });
  });

  describe("formatRelative", () => {
    it("should return empty string for null/undefined/invalid", () => {
      expect(formatRelative(null)).toBe("");
      expect(formatRelative(undefined)).toBe("");
      expect(formatRelative("invalid")).toBe("");
    });

    it("should format relative times under 24h", () => {
      const now = Date.now();
      
      // Just now (< 1 min)
      expect(formatRelative(new Date(now - 30 * 1000))).toBe("just now");
      
      // Minutes ago (< 1 hour)
      expect(formatRelative(new Date(now - 15 * 60 * 1000))).toBe("15m ago");
      
      // Hours ago (< 24 hours)
      expect(formatRelative(new Date(now - 4 * 60 * 60 * 1000))).toBe("4h ago");
    });

    it("should format yesterday if within previous calendar day", () => {
      const now = new Date(2026, 5, 20, 12, 0, 0); // Jun 20, 2026 12:00:00
      vi.useFakeTimers();
      vi.setSystemTime(now);

      // Yesterday calendar day
      const yesterday = new Date(2026, 5, 19, 10, 0, 0);
      expect(formatRelative(yesterday)).toBe("yesterday");

      vi.useRealTimers();
    });

    it("should fallback to absolute date if older than yesterday", () => {
      const now = new Date(2026, 5, 20, 12, 0, 0);
      vi.useFakeTimers();
      vi.setSystemTime(now);

      const olderDate = new Date(2026, 5, 17, 10, 0, 0); // Jun 17
      expect(formatRelative(olderDate)).toBe("Jun 17, 2026");

      vi.useRealTimers();
    });
  });

  describe("formatCount", () => {
    it("should format plain integer count", () => {
      expect(formatCount(42)).toBe("42");
      expect(formatCount(0)).toBe("0");
      expect(formatCount(-5)).toBe("0"); // max(0, n)
      expect(formatCount(12.7)).toBe("12"); // trunc
    });
  });

  describe("formatCompact", () => {
    it("should format normally for numbers < 10,000", () => {
      expect(formatCompact(5)).toBe("5");
      expect(formatCompact(9999)).toBe("9999");
    });

    it("should format compactly for numbers >= 10,000", () => {
      expect(formatCompact(10000)).toBe("10K");
      expect(formatCompact(12400)).toBe("12.4K");
      expect(formatCompact(1500000)).toBe("1.5M");
    });
  });

  describe("initials", () => {
    it("should return ? for null/empty inputs", () => {
      expect(initials(null, null)).toBe("?");
      expect(initials("", "")).toBe("?");
    });

    it("should generate initials from name or email", () => {
      expect(initials("Hari Krishna", "")).toBe("HK");
      expect(initials("John", "")).toBe("JO");
      expect(initials(null, "harikrishna@example.com")).toBe("HC");
      expect(initials("John Doe Smith", null)).toBe("JD");
      expect(initials("Jane-Doe", null)).toBe("JD");
    });
  });
});
