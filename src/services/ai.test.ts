import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { classifyEmail, parseJobDescription } from "./ai";
import { JobStatus } from "@prisma/client";

describe("ai service", () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = "test-openrouter-key";
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalApiKey;
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("should throw an error if OPENROUTER_API_KEY is missing", async () => {
    delete process.env.OPENROUTER_API_KEY;
    await expect(classifyEmail("Subj", "Body", "recruiter@co.com")).rejects.toThrow(
      "OPENROUTER_API_KEY environment variable is not configured."
    );
  });

  it("should successfully classify job-related email with standard response", async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              job_related: true,
              company: "Stripe",
              status: JobStatus.INTERVIEW,
              action_required: "Schedule interview",
              due_date: "2026-06-25",
              summary: "Invitation to interview.",
            }),
          },
        },
      ],
    };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    const result = await classifyEmail("Interview Invitation", "Please choose a time slot", "recruiter@stripe.com");

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-openrouter-key",
        }),
      })
    );

    expect(result).toEqual({
      job_related: true,
      company: "Stripe",
      status: JobStatus.INTERVIEW,
      action_required: "Schedule interview",
      due_date: "2026-06-25",
      summary: "Invitation to interview.",
    });
  });

  it("should successfully classify and strip markdown backticks if returned by LLM", async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: "```json\n" + JSON.stringify({
              job_related: false,
              company: "",
              status: null,
              action_required: null,
              due_date: null,
              summary: null,
            }) + "\n```",
          },
        },
      ],
    };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    const result = await classifyEmail("Newsletter", "weekly digest of news", "digest@news.com");
    expect(result.job_related).toBe(false);
    expect(result.company).toBe("");
  });

  it("should throw error if fetch response is not ok", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    } as any);

    await expect(
      classifyEmail("Interview Invitation", "Please choose a time slot", "recruiter@stripe.com")
    ).rejects.toThrow("OpenRouter API error (status 400): Bad Request");
  });

  it("should throw error if LLM returns invalid JSON schema", async () => {
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              job_related: "maybe", // should be boolean
              company: 123, // should be string
            }),
          },
        },
      ],
    };

    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    await expect(
      classifyEmail("Interview Invitation", "Please choose a time slot", "recruiter@stripe.com")
    ).rejects.toThrow("Invalid JSON or schema from AI");
  });

  describe("parseJobDescription", () => {
    it("should successfully parse job description with standard response", async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                company: "Stripe",
                position: "Senior Frontend Engineer",
                location: "Remote",
                salary: "$150k - $180k",
                recruiter: "Jane Doe",
                notes: "Top 3 requirements: React, TypeScript, Next.js",
              }),
            },
          },
        ],
      };

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      const result = await parseJobDescription("We are looking for a Senior Frontend Engineer at Stripe...");

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        company: "Stripe",
        position: "Senior Frontend Engineer",
        location: "Remote",
        salary: "$150k - $180k",
        recruiter: "Jane Doe",
        notes: "Top 3 requirements: React, TypeScript, Next.js",
      });
    });

    it("should successfully parse and strip markdown backticks if returned by LLM", async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              content: "```json\n" + JSON.stringify({
                company: "Vercel",
                position: "Product Engineer",
                location: null,
                salary: null,
                recruiter: null,
                notes: null,
              }) + "\n```",
            },
          },
        ],
      };

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      const result = await parseJobDescription("Product Engineer at Vercel...");
      expect(result.company).toBe("Vercel");
      expect(result.position).toBe("Product Engineer");
    });

    it("should successfully parse double-serialized JSON strings", async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(JSON.stringify({
                company: "Google",
                position: "Software Engineer",
                location: "Mountain View, CA",
                salary: null,
                recruiter: null,
                notes: null,
              })),
            },
          },
        ],
      };

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      const result = await parseJobDescription("Software Engineer at Google...");
      expect(result.company).toBe("Google");
      expect(result.position).toBe("Software Engineer");
    });

    it("should throw validation error if LLM returns a plain string wrapped in JSON instead of an object", async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify("display_name"),
            },
          },
        ],
      };

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      await expect(
        parseJobDescription("Software Engineer at Google...")
      ).rejects.toThrow("Invalid JSON or schema from AI: [");
    });

    it("should throw error if fetch response is not ok", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      } as any);

      await expect(
        parseJobDescription("Some JD text")
      ).rejects.toThrow("OpenRouter API error (status 400): Bad Request");
    });

    it("should throw error if LLM returns invalid JSON schema", async () => {
      const mockApiResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                company: 123, // should be string
              }),
            },
          },
        ],
      };

      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      await expect(
        parseJobDescription("Some JD text")
      ).rejects.toThrow("Invalid JSON or schema from AI");
    });
  });
});
