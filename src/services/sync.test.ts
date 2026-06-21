import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseFromEmail, fuzzyMatchJob, syncGmail } from "./sync";
import { prisma } from "@/lib/db";
import { fetchRecentMessages } from "./gmail";
import { classifyEmail } from "./ai";
import { JobStatus, TaskSource } from "@prisma/client";

// Mock the dependencies
vi.mock("@/lib/db", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      job: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      email: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      task: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

vi.mock("./gmail", () => ({
  fetchRecentMessages: vi.fn(),
}));

vi.mock("./ai", () => ({
  classifyEmail: vi.fn(),
}));

describe("sync service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("parseFromEmail", () => {
    it("should extract email address from headers", () => {
      expect(parseFromEmail("Stripe <recruiter@stripe.com>")).toBe("recruiter@stripe.com");
      expect(parseFromEmail("  Recruiter <RECRUITER@stripe.com>  ")).toBe("recruiter@stripe.com");
      expect(parseFromEmail("recruiter@stripe.com")).toBe("recruiter@stripe.com");
    });
  });

  describe("fuzzyMatchJob", () => {
    it("should match jobs based on normalized company names", async () => {
      const mockJobs = [
        { id: "job1", company: "Google Inc.", position: "SWE" },
        { id: "job2", company: "Stripe, LLC", position: "PM" },
      ];
      vi.mocked(prisma.job.findMany).mockResolvedValue(mockJobs as any);

      // Exact normalized match (excluding LLC / suffix)
      const match1 = await fuzzyMatchJob("user123", "Stripe");
      expect(match1).toEqual(mockJobs[1]);

      // Substring match
      const match2 = await fuzzyMatchJob("user123", "Google");
      expect(match2).toEqual(mockJobs[0]);

      // No match
      const match3 = await fuzzyMatchJob("user123", "Apple");
      expect(match3).toBeNull();
    });
  });

  describe("syncGmail", () => {
    it("should return error if user has no Gmail refresh token connected", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user1",
        refresh_token: null,
      } as any);

      const result = await syncGmail("user1");
      expect(result).toEqual({
        success: false,
        count: 0,
        error: "Gmail account not connected",
      });
    });

    it("should successfully sync, classify, and link new email message to job", async () => {
      // 1. Mock user info
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user1",
        refresh_token: "some-token",
        last_sync_at: new Date("2026-06-20T00:00:00Z"),
      } as any);

      // 2. Mock fetchRecentMessages to return one new message
      const mockMsg = {
        id: "msg123",
        subject: "Your Application at Google",
        from: "Google Careers <jobs@google.com>",
        date: new Date("2026-06-21T10:00:00Z"),
        body: "We received your application...",
      };
      vi.mocked(fetchRecentMessages).mockResolvedValue([mockMsg]);

      // 3. Mock prisma email findUnique (email doesn't exist yet)
      vi.mocked(prisma.email.findUnique).mockResolvedValue(null);

      // 4. Mock AI classification
      const mockClassification = {
        job_related: true,
        company: "Google",
        status: JobStatus.APPLIED,
        action_required: "Prepare for recruiter call",
        due_date: "2026-06-24",
        summary: "Application receipt confirmed.",
      };
      vi.mocked(classifyEmail).mockResolvedValue(mockClassification);

      // 5. Mock fuzzyMatchJob database search
      const mockJob = { id: "google-job", company: "Google Inc." };
      vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);

      // 6. Mock task duplicate check (no duplicate exists)
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      // 7. Perform sync
      const result = await syncGmail("user1");

      // Verify outcomes
      expect(result).toEqual({ success: true, count: 1 });
      
      // Verified classification parameters
      expect(classifyEmail).toHaveBeenCalledWith(
        mockMsg.subject,
        mockMsg.body,
        "jobs@google.com" // parsed
      );

      // Email created in DB
      expect(prisma.email.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user1",
          gmailMessageId: "msg123",
          jobId: "google-job", // linked
          detectedStatus: JobStatus.APPLIED,
        }),
      });

      // Job status updated in DB
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "google-job" },
        data: { status: JobStatus.APPLIED },
      });

      // Auto task generated in DB
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          userId: "user1",
          jobId: "google-job",
          title: "Prepare for recruiter call",
          description: 'Auto-created from email: "Your Application at Google"',
          source: TaskSource.EMAIL,
          completed: false,
          dueDate: new Date("2026-06-24"),
        },
      });

      // User last_sync_at updated to now
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user1" },
        data: { last_sync_at: expect.any(Date) },
      });
    });
  });
});
