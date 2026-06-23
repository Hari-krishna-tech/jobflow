import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseFromEmail, fuzzyMatchJob, syncGmail, syncGmailStreaming } from "./sync";
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

  describe("syncGmailStreaming", () => {
    /** Helper to collect all events from the async generator. */
    async function collectEvents(userId: string) {
      const events = [];
      for await (const event of syncGmailStreaming(userId)) {
        events.push(event);
      }
      return events;
    }

    it("should yield an error event when user has no refresh token", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user1",
        refresh_token: null,
      } as any);

      const events = await collectEvents("user1");
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "error",
        error: "Gmail account not connected",
      });
    });

    it("should yield progress → email → complete events for a new email", async () => {
      // Mock user info
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user1",
        refresh_token: "some-token",
        last_sync_at: new Date("2026-06-20T00:00:00Z"),
      } as any);

      // Mock one message from Gmail
      const mockMsg = {
        id: "msg-stream-1",
        subject: "Interview at Stripe",
        from: "Stripe <hiring@stripe.com>",
        date: new Date("2026-06-21T10:00:00Z"),
        body: "We'd like to schedule an interview...",
      };
      vi.mocked(fetchRecentMessages).mockResolvedValue([mockMsg]);

      // Email does not exist yet
      vi.mocked(prisma.email.findUnique).mockResolvedValue(null);

      // Mock classification
      vi.mocked(classifyEmail).mockResolvedValue({
        job_related: true,
        company: "Stripe",
        status: JobStatus.INTERVIEW,
        action_required: "Schedule interview",
        due_date: "2026-06-25",
        summary: "Interview invitation from Stripe.",
      });

      // Mock fuzzy match
      const mockJob = { id: "stripe-job", company: "Stripe, LLC" };
      vi.mocked(prisma.job.findMany).mockResolvedValue([mockJob] as any);

      // Mock email creation
      vi.mocked(prisma.email.create).mockResolvedValue({
        id: "email-db-1",
        subject: "Interview at Stripe",
        fromEmail: "hiring@stripe.com",
        receivedAt: new Date("2026-06-21T10:00:00Z"),
        jobId: "stripe-job",
      } as any);

      // Mock task duplicate check
      vi.mocked(prisma.task.findFirst).mockResolvedValue(null);

      const events = await collectEvents("user1");

      // Expect: progress(0/1) → email(1/1) → complete
      expect(events).toHaveLength(3);

      expect(events[0]).toMatchObject({ type: "progress", current: 0, total: 1 });
      expect(events[1]).toMatchObject({
        type: "email",
        current: 1,
        total: 1,
        email: expect.objectContaining({
          id: "email-db-1",
          fromEmail: "hiring@stripe.com",
          subject: "Interview at Stripe",
          detectedStatus: JobStatus.INTERVIEW,
        }),
      });
      expect(events[2]).toMatchObject({
        type: "complete",
        savedCount: 1,
        skippedCount: 0,
        totalFetched: 1,
      });
    });

    it("should yield skip events for duplicate emails", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "user1",
        refresh_token: "token",
        last_sync_at: new Date(),
      } as any);

      vi.mocked(fetchRecentMessages).mockResolvedValue([
        { id: "dup-1", subject: "Test", from: "a@b.com", date: new Date(), body: "" },
      ]);

      // Email already exists
      vi.mocked(prisma.email.findUnique).mockResolvedValue({ id: "existing" } as any);

      const events = await collectEvents("user1");

      expect(events).toHaveLength(3);
      expect(events[0]).toMatchObject({ type: "progress", current: 0, total: 1 });
      expect(events[1]).toMatchObject({ type: "skip", current: 1, total: 1, gmailMessageId: "dup-1" });
      expect(events[2]).toMatchObject({ type: "complete", savedCount: 0, skippedCount: 1 });
    });
  });
});
