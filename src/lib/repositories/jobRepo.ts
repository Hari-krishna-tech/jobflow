import { Prisma, type Job, type JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { normalizeJobFields } from "@/lib/schemas/job";

/*
 * Job repository — the only place that touches the Job table.
 *
 * Read paths are consumed by server components (RSC) and the dashboard counts;
 * mutations are called from server actions (src/lib/actions/job.ts). Every
 * query is scoped by userId — a job never leaks across users.
 *
 * Decision (CURRENT_CONTEXT §4): data layer = Server Actions + RSC, not REST.
 */

export type JobListFilters = {
  /** Free-text search over company + position (case-insensitive contains). */
  q?: string;
  /** Filter by status; omit for all. */
  status?: JobStatus;
};

const listOrderBy = { updatedAt: "desc" } as const;

/** Jobs for the /jobs table, scoped + filtered + newest-first. */
export async function listByUser(
  userId: string,
  filters: JobListFilters = {},
): Promise<Job[]> {
  const where: Prisma.JobWhereInput = { userId };
  if (filters.status) where.status = filters.status;
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    where.OR = [
      { company: { contains: term, mode: "insensitive" } },
      { position: { contains: term, mode: "insensitive" } },
    ];
  }
  return prisma.job.findMany({
    where,
    orderBy: listOrderBy,
  });
}

/** Single job for the edit page; null if missing or owned by another user. */
export async function getById(userId: string, id: string): Promise<Job | null> {
  return prisma.job.findFirst({ where: { id, userId } });
}

/**
 * Counts grouped by status — drives the dashboard stat cards.
 * Returns a complete map (every JobStatus key present, default 0) so the UI
 * never has to handle "missing" statuses.
 */
export async function countsByStatus(
  userId: string,
): Promise<Record<JobStatus, number>> {
  const rows = await prisma.job.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { userId },
  });
  const counts = {} as Record<JobStatus, number>;
  for (const r of rows) counts[r.status] = r._count._all;
  return counts;
}

/** Total application count (any status). */
export async function totalCount(userId: string): Promise<number> {
  return prisma.job.count({ where: { userId } });
}

/** Most recently touched jobs — feeds the dashboard "Recent Activity" feed. */
export async function recentActivity(
  userId: string,
  limit = 6,
): Promise<Job[]> {
  return prisma.job.findMany({
    where: { userId },
    orderBy: listOrderBy,
    take: limit,
  });
}

/**
 * Jobs not updated in `days` — the "Needs Attention" dashboard row. Excludes
 * terminal states (Offer/Rejected/Ghosted) since those need no nudge.
 */
export async function staleJobs(
  userId: string,
  days = 7,
  limit = 5,
): Promise<Job[]> {
  const cutoff = new Date(Date.now() - days * 86_400_000);
  return prisma.job.findMany({
    where: {
      userId,
      updatedAt: { lt: cutoff },
      status: { notIn: ["OFFER", "REJECTED", "GHOSTED"] },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
  });
}

export async function create(userId: string, data: Record<string, unknown>): Promise<Job> {
  return prisma.job.create({
    data: { ...normalizeJobFields(data), userId } as unknown as Prisma.JobCreateInput,
  });
}

export async function update(
  userId: string,
  id: string,
  data: Record<string, unknown>,
): Promise<Job | null> {
  // Guard: only update if the job belongs to this user.
  const owned = await prisma.job.findUnique({ where: { id }, select: { userId: true } });
  if (!owned || owned.userId !== userId) return null;
  return prisma.job.update({
    where: { id },
    data: normalizeJobFields(data) as unknown as Prisma.JobUpdateInput,
  });
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const owned = await prisma.job.findUnique({ where: { id }, select: { userId: true } });
  if (!owned || owned.userId !== userId) return false;
  await prisma.job.delete({ where: { id } });
  return true;
}
