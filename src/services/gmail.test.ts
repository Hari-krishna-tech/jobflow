import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchRecentMessages } from "./gmail";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

// Mock prisma db client
vi.mock("@/lib/db", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

// Mock crypto module
vi.mock("@/lib/crypto", () => {
  return {
    decrypt: vi.fn((str: string) => `decrypted-${str}`),
    encrypt: vi.fn((str: string) => `encrypted-${str}`),
  };
});

describe("gmail service", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    globalThis.fetch = vi.fn();
    process.env.AUTH_GOOGLE_ID = "google-id";
    process.env.AUTH_GOOGLE_SECRET = "google-secret";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it("should return empty list if no messages found in Gmail", async () => {
    // 1. Mock DB query for access token
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      access_token: "existing-access-token",
    } as any);

    // 2. Mock fetch for messages list API to return empty list
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ messages: [] }),
    } as any);

    const result = await fetchRecentMessages("user123", null);
    expect(result).toEqual([]);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user123" },
      select: { access_token: true },
    });
  });

  it("should fetch details for messages and parse parts recursively", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      access_token: "existing-access-token",
    } as any);

    // Mock fetch. First call is for listing messages, second call is for message details
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          messages: [{ id: "msg1" }],
        }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "msg1",
          payload: {
            headers: [
              { name: "Subject", value: "Interview Invitation" },
              { name: "From", value: "Recruiter <recruiter@stripe.com>" },
              { name: "Date", value: "Sat, 20 Jun 2026 12:00:00 GMT" },
            ],
            mimeType: "text/plain",
            body: {
              data: Buffer.from("Interview details inside").toString("base64url"),
            },
          },
        }),
      } as any);

    const result = await fetchRecentMessages("user123", new Date("2026-06-19T00:00:00Z"));
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "msg1",
      subject: "Interview Invitation",
      from: "Recruiter <recruiter@stripe.com>",
      date: new Date("Sat, 20 Jun 2026 12:00:00 GMT"),
      body: "Interview details inside",
    });
  });

  it("should refresh access token on 401 Unauthorized list error", async () => {
    // 1. Mock DB query for access token (has expired token)
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ access_token: "expired-token" } as any) // first call in list
      .mockResolvedValueOnce({ refresh_token: "encrypted-refresh-token" } as any); // call inside refreshAccessToken

    // 2. Mock fetches
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        // First list call returns 401
        ok: false,
        status: 401,
      } as any)
      .mockResolvedValueOnce({
        // Call to refresh oauth token
        ok: true,
        status: 200,
        json: async () => ({ access_token: "new-access-token" }),
      } as any)
      .mockResolvedValueOnce({
        // Second list call succeeds
        ok: true,
        status: 200,
        json: async () => ({ messages: [] }),
      } as any);

    const result = await fetchRecentMessages("user123", null);

    expect(decrypt).toHaveBeenCalledWith("encrypted-refresh-token");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user123" },
      data: { access_token: "new-access-token" },
    });
    expect(result).toEqual([]);
  });
});
