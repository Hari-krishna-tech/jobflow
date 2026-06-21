import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  openCount,
  listOpen,
  listAll,
  create,
  toggle,
  remove,
} from "./taskRepo";
import { prisma } from "@/lib/db";
import { TaskSource } from "@prisma/client";

// Mock the prisma client singleton
vi.mock("@/lib/db", () => {
  return {
    prisma: {
      task: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
  };
});

describe("taskRepo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openCount", () => {
    it("should query count of incomplete tasks for user", async () => {
      vi.mocked(prisma.task.count).mockResolvedValue(3);
      const count = await openCount("user1");
      expect(prisma.task.count).toHaveBeenCalledWith({
        where: { userId: "user1", completed: false },
      });
      expect(count).toBe(3);
    });
  });

  describe("listOpen", () => {
    it("should fetch incomplete tasks ordered by due date and creation date", async () => {
      const mockTasks = [{ id: "task1", title: "Submit Application" }];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as any);

      const result = await listOpen("user1", 3);
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: "user1", completed: false },
        orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        take: 3,
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe("listAll", () => {
    it("should fetch all tasks with job details in correct ordering", async () => {
      const mockTasks = [
        {
          id: "task1",
          title: "Task 1",
          job: { company: "Google", position: "SWE" },
        },
      ];
      vi.mocked(prisma.task.findMany).mockResolvedValue(mockTasks as any);

      const result = await listAll("user1");
      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        include: {
          job: {
            select: {
              company: true,
              position: true,
            },
          },
        },
        orderBy: [
          { completed: "asc" },
          { dueDate: { sort: "asc", nulls: "last" } },
          { createdAt: "desc" },
        ],
      });
      expect(result).toEqual(mockTasks);
    });
  });

  describe("create", () => {
    it("should call create with provided properties and defaults", async () => {
      const mockCreated = { id: "newtask", title: "Review Offer", completed: false };
      vi.mocked(prisma.task.create).mockResolvedValue(mockCreated as any);

      const taskData = {
        title: "Review Offer",
        jobId: "job123",
      };

      const result = await create("user1", taskData);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          userId: "user1",
          jobId: "job123",
          title: "Review Offer",
          description: null,
          dueDate: null,
          source: TaskSource.MANUAL,
        },
      });
      expect(result).toEqual(mockCreated);
    });
  });

  describe("toggle", () => {
    it("should call prisma update to toggle completion status", async () => {
      const mockUpdated = { id: "task1", completed: true };
      vi.mocked(prisma.task.update).mockResolvedValue(mockUpdated as any);

      const result = await toggle("user1", "task1", true);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task1", userId: "user1" },
        data: { completed: true },
      });
      expect(result).toEqual(mockUpdated);
    });
  });

  describe("remove", () => {
    it("should call prisma delete for the task", async () => {
      const mockDeleted = { id: "task1" };
      vi.mocked(prisma.task.delete).mockResolvedValue(mockDeleted as any);

      const result = await remove("user1", "task1");
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: "task1", userId: "user1" },
      });
      expect(result).toEqual(mockDeleted);
    });
  });
});
