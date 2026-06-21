import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  listByUser,
  getById,
  countsByStatus,
  totalCount,
  recentActivity,
  staleJobs,
  create,
  update,
  remove,
} from "./jobRepo";
import { prisma } from "@/lib/db";
import { JobStatus } from "@prisma/client";

// Mock the prisma client singleton
vi.mock("@/lib/db", () => {
  return {
    prisma: {
      job: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

describe("jobRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listByUser", () => {
    it("should query jobs for user with correct userId and ordering", async () => {
      const mockJobs = [{ id: "1", company: "Company A", position: "Role A", userId: "user1" }];
      vi.mocked(prisma.job.findMany).mockResolvedValue(mockJobs as any);

      const result = await listByUser("user1");
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { updatedAt: "desc" },
      });
      expect(result).toEqual(mockJobs);
    });

    it("should apply status filter if provided", async () => {
      await listByUser("user1", { status: JobStatus.INTERVIEW });
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { userId: "user1", status: JobStatus.INTERVIEW },
        orderBy: { updatedAt: "desc" },
      });
    });

    it("should apply search query filter if provided", async () => {
      await listByUser("user1", { q: "Google" });
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user1",
          OR: [
            { company: { contains: "Google", mode: "insensitive" } },
            { position: { contains: "Google", mode: "insensitive" } },
          ],
        },
        orderBy: { updatedAt: "desc" },
      });
    });
  });

  describe("getById", () => {
    it("should fetch a single job owned by user", async () => {
      const mockJob = { id: "job123", company: "Company B", userId: "user1" };
      vi.mocked(prisma.job.findFirst).mockResolvedValue(mockJob as any);

      const result = await getById("user1", "job123");
      expect(prisma.job.findFirst).toHaveBeenCalledWith({
        where: { id: "job123", userId: "user1" },
      });
      expect(result).toEqual(mockJob);
    });
  });

  describe("countsByStatus", () => {
    it("should return correct status count mapping", async () => {
      const mockGroupResults = [
        { status: JobStatus.APPLIED, _count: { _all: 3 } },
        { status: JobStatus.INTERVIEW, _count: { _all: 1 } },
      ];
      vi.mocked(prisma.job.groupBy).mockResolvedValue(mockGroupResults as any);

      const counts = await countsByStatus("user1");
      expect(prisma.job.groupBy).toHaveBeenCalledWith({
        by: ["status"],
        _count: { _all: true },
        where: { userId: "user1" },
      });
      
      expect(counts[JobStatus.APPLIED]).toBe(3);
      expect(counts[JobStatus.INTERVIEW]).toBe(1);
    });
  });

  describe("totalCount", () => {
    it("should query job count for user", async () => {
      vi.mocked(prisma.job.count).mockResolvedValue(5);
      const count = await totalCount("user1");
      expect(prisma.job.count).toHaveBeenCalledWith({
        where: { userId: "user1" },
      });
      expect(count).toBe(5);
    });
  });

  describe("recentActivity", () => {
    it("should query recent jobs with limit", async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([] as any);
      await recentActivity("user1", 3);
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });
    });
  });

  describe("staleJobs", () => {
    it("should query stale jobs excluding terminal states", async () => {
      vi.mocked(prisma.job.findMany).mockResolvedValue([] as any);
      
      // Freeze time for cutOff check
      const baseTime = new Date("2026-06-20T12:00:00Z");
      vi.useFakeTimers();
      vi.setSystemTime(baseTime);

      const cutoff = new Date(baseTime.getTime() - 7 * 86_400_000);

      await staleJobs("user1", 7, 5);

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          userId: "user1",
          updatedAt: { lt: cutoff },
          status: { notIn: ["OFFER", "REJECTED", "GHOSTED"] },
        },
        orderBy: { updatedAt: "asc" },
        take: 5,
      });

      vi.useRealTimers();
    });
  });

  describe("create", () => {
    it("should call create with normalized data", async () => {
      const mockCreated = { id: "newjob", company: "Stripe", position: "Engineer" };
      vi.mocked(prisma.job.create).mockResolvedValue(mockCreated as any);

      const jobData = { company: " Stripe ", position: "Engineer", status: "APPLIED" };
      const result = await create("user1", jobData);

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user1",
          company: " Stripe ", // repo doesn't Zod parse, only replaces empty optional fields with null
          position: "Engineer",
        }),
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe("update", () => {
    it("should guard update and return null if not owned by user", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null); // not found

      const result = await update("user1", "job123", { company: "New Co" });
      expect(result).toBeNull();
      expect(prisma.job.update).not.toHaveBeenCalled();
    });

    it("should call prisma update if owned by user", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({ userId: "user1" } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({ id: "job123", company: "New Co" } as any);

      const result = await update("user1", "job123", { company: "New Co" });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job123" },
        data: expect.objectContaining({
          company: "New Co",
        }),
      });
      expect(result).toEqual({ id: "job123", company: "New Co" });
    });
  });

  describe("remove", () => {
    it("should guard deletion and return false if not owned by user", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      const result = await remove("user1", "job123");
      expect(result).toBe(false);
      expect(prisma.job.delete).not.toHaveBeenCalled();
    });

    it("should delete job and return true if owned by user", async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({ userId: "user1" } as any);
      vi.mocked(prisma.job.delete).mockResolvedValue({ id: "job123" } as any);

      const result = await remove("user1", "job123");
      expect(prisma.job.delete).toHaveBeenCalledWith({
        where: { id: "job123" },
      });
      expect(result).toBe(true);
    });
  });
});
