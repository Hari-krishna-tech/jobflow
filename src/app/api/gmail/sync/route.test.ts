import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { syncGmail } from "@/services/sync";
import { isRateLimited } from "@/lib/rate-limit";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/services/sync", () => ({
  syncGmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn(),
}));

describe("GET /api/gmail/sync route handler", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "cron-secret-123";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 401 if CRON_SECRET is set but header is missing/incorrect", async () => {
    const req = new NextRequest("http://localhost/api/gmail/sync", {
      headers: { Authorization: "Bearer wrong-token" },
    });

    const response = await GET(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should bypass rate limit and execute sync if valid CRON_SECRET is provided", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "user1", email: "user1@gmail.com" },
    ] as any);
    vi.mocked(syncGmail).mockResolvedValue({ success: true, count: 2 });

    const req = new NextRequest("http://localhost/api/gmail/sync", {
      headers: { Authorization: "Bearer cron-secret-123" },
    });

    const response = await GET(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.totalImported).toBe(2);
    expect(isRateLimited).not.toHaveBeenCalled(); // bypassed
    expect(syncGmail).toHaveBeenCalledWith("user1");
  });

  it("should return 429 if rate limited by client IP (without cron secret)", async () => {
    delete process.env.CRON_SECRET; // disable cron secret authentication
    vi.mocked(isRateLimited).mockReturnValue(true); // limit exceeded

    const req = new NextRequest("http://localhost/api/gmail/sync", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = await GET(req);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe("Too many requests");
    expect(isRateLimited).toHaveBeenCalledWith("sync:1.2.3.4", 5, 60000);
  });
});
