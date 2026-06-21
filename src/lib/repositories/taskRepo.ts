import { type Task, TaskSource } from "@prisma/client";
import { prisma } from "@/lib/db";

export type OpenTask = Task;

export type TaskWithJob = Task & {
  job: {
    company: string;
    position: string;
  } | null;
};

/** Count of incomplete tasks (the "Action Items" dashboard metric). */
export async function openCount(userId: string): Promise<number> {
  return prisma.task.count({ where: { userId, completed: false } });
}

/** Newest-first list of incomplete tasks (the "Open Action Items" panel). */
export async function listOpen(
  userId: string,
  limit = 5,
): Promise<Task[]> {
  return prisma.task.findMany({
    where: { userId, completed: false },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: limit,
  });
}

/** List all tasks for a user, including associated job details. Ordered by incomplete first, then due date, then created time. */
export async function listAll(userId: string): Promise<TaskWithJob[]> {
  return prisma.task.findMany({
    where: { userId },
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
}

/** Create a new task. */
export async function create(
  userId: string,
  data: {
    jobId?: string | null;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    source?: TaskSource;
  }
): Promise<Task> {
  return prisma.task.create({
    data: {
      userId,
      jobId: data.jobId || null,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate || null,
      source: data.source || TaskSource.MANUAL,
    },
  });
}

/** Toggle task completion status. */
export async function toggle(
  userId: string,
  id: string,
  completed: boolean
): Promise<Task> {
  return prisma.task.update({
    where: { id, userId },
    data: { completed },
  });
}

/** Delete a task. */
export async function remove(
  userId: string,
  id: string
): Promise<Task> {
  return prisma.task.delete({
    where: { id, userId },
  });
}
