import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { classifyEmail } from "@/services/ai";
import { isRateLimited } from "@/lib/rate-limit";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/ai", () => ({
  classifyEmail: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  isRateLimited: vi.fn(),
}));

describe("POST /api/ai/classify-email route handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if unauthorized", async () => {
    vi.mocked(auth).mockResolvedValue(null); // No session

    const req = new NextRequest("http://localhost/api/ai/classify-email", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("should return 429 if rate limited", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-123" } } as any);
    vi.mocked(isRateLimited).mockReturnValue(true); // Rate limited!

    const req = new NextRequest("http://localhost/api/ai/classify-email", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe("Too many requests");
    expect(isRateLimited).toHaveBeenCalledWith("classify:user-123", 20, 60000);
  });

  it("should return 400 if fields are missing", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-123" } } as any);
    vi.mocked(isRateLimited).mockReturnValue(false);

    const req = new NextRequest("http://localhost/api/ai/classify-email", {
      method: "POST",
      body: JSON.stringify({ subject: "Subject" }), // missing body & fromEmail
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("Missing required fields");
  });

  it("should classify email and return results on success", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-123" } } as any);
    vi.mocked(isRateLimited).mockReturnValue(false);
    
    const mockResult = { job_related: false };
    vi.mocked(classifyEmail).mockResolvedValue(mockResult as any);

    const req = new NextRequest("http://localhost/api/ai/classify-email", {
      method: "POST",
      body: JSON.stringify({
        subject: "Applied!",
        body: "Thanks for applying",
        fromEmail: "jobs@stripe.com",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual(mockResult);
    expect(classifyEmail).toHaveBeenCalledWith("Applied!", "Thanks for applying", "jobs@stripe.com");
  });
});
