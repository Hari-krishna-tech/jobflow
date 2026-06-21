import { prisma } from "@/lib/db";
import { fetchRecentMessages } from "./gmail";
import { classifyEmail } from "./ai";
import { JobStatus, Job, TaskSource } from "@prisma/client";

interface SyncResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * Parses the email address from a "From" header (e.g. "Name <email@domain.com>" -> "email@domain.com").
 */
export function parseFromEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase().trim() : fromHeader.toLowerCase().trim();
}

/**
 * Normalizes a company name for case-insensitive and suffix-insensitive fuzzy comparison.
 */
function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|co|ltd|gmbh|corp|corporation|inc\.|l\.l\.c\.|limited|llp)\b/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

/**
 * Fuzzy-matches a company name against the user's active jobs.
 * Supports exact matched base name and substring containment.
 */
export async function fuzzyMatchJob(userId: string, companyName: string): Promise<Job | null> {
  const target = normalizeCompanyName(companyName);
  if (!target) return null;

  // Fetch user's jobs
  const jobs = await prisma.job.findMany({
    where: { userId },
  });

  // 1. Exact match on normalized names
  for (const job of jobs) {
    const jobCompany = normalizeCompanyName(job.company);
    if (jobCompany === target) {
      return job;
    }
  }

  // 2. Substring match on normalized names
  for (const job of jobs) {
    const jobCompany = normalizeCompanyName(job.company);
    if (jobCompany.includes(target) || target.includes(jobCompany)) {
      return job;
    }
  }

  return null;
}

/**
 * Handles post-classification updates for a Job, including status updates
 * and auto-generating tasks without creating duplicates.
 */
export async function handleJobUpdateFromEmail({
  userId,
  jobId,
  detectedStatus,
  actionRequired,
  actionDueDate,
  emailSubject,
}: {
  userId: string;
  jobId: string;
  detectedStatus: JobStatus | null;
  actionRequired: string | null;
  actionDueDate?: Date | string | null;
  emailSubject: string;
}) {
  // 1. Auto status update
  if (detectedStatus) {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: detectedStatus },
    });
  }

  // 2. Auto task generation
  if (actionRequired && actionRequired.trim()) {
    const title = actionRequired.trim();

    // Check if an incomplete task with the same title for this job already exists to avoid duplicates
    const existingTask = await prisma.task.findFirst({
      where: {
        userId,
        jobId,
        title,
        completed: false,
        source: TaskSource.EMAIL,
      },
    });

    if (!existingTask) {
      let dueDate: Date | null = null;
      if (actionDueDate) {
        const parsedDate = new Date(actionDueDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          dueDate = parsedDate;
        }
      }

      // Set fallback due date: 3 days from now
      if (!dueDate) {
        dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 3);
      }

      await prisma.task.create({
        data: {
          userId,
          jobId,
          title,
          description: `Auto-created from email: "${emailSubject}"`,
          source: TaskSource.EMAIL,
          completed: false,
          dueDate,
        },
      });
    }
  }
}

/**
 * Synchronizes recent emails from Gmail.
 * Fetches emails since user's last_sync_at, classifies them via AI,
 * runs fuzzy matching to jobs, applies auto status/tasks, and updates last_sync_at.
 */
export async function syncGmail(userId: string): Promise<SyncResult> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { last_sync_at: true, refresh_token: true },
    });

    if (!user) {
      return { success: false, count: 0, error: "User not found" };
    }

    if (!user.refresh_token) {
      return { success: false, count: 0, error: "Gmail account not connected" };
    }

    // 1. Fetch recent messages from Gmail API
    const messages = await fetchRecentMessages(userId, user.last_sync_at);

    let savedCount = 0;

    // 2. Iterate and persist messages (idempotent checks)
    for (const msg of messages) {
      // Check if message already exists
      const existingEmail = await prisma.email.findUnique({
        where: { gmailMessageId: msg.id },
        select: { id: true },
      });

      if (!existingEmail) {
        const fromEmailParsed = parseFromEmail(msg.from);

        // Classify the email using OpenRouter AI (fail-safe)
        let classification = null;
        try {
          classification = await classifyEmail(msg.subject, msg.body, fromEmailParsed);
        } catch (aiError) {
          console.error(`AI classification failed for message ${msg.id}:`, aiError);
        }

        // Fuzzy match job if classification succeeded and is job-related
        let matchedJobId: string | null = null;
        if (classification?.job_related && classification.company) {
          const matchedJob = await fuzzyMatchJob(userId, classification.company);
          if (matchedJob) {
            matchedJobId = matchedJob.id;
          }
        }

        // Create the Email record
        await prisma.email.create({
          data: {
            userId,
            gmailMessageId: msg.id,
            subject: msg.subject,
            fromEmail: fromEmailParsed,
            receivedAt: msg.date,
            summary: classification?.summary || null,
            actionRequired: classification?.action_required || null,
            actionDueDate: classification?.due_date ? new Date(classification.due_date) : null,
            detectedStatus: classification?.status || null,
            jobId: matchedJobId,
          },
        });

        // Trigger job status update and task generation if matched
        if (matchedJobId && classification) {
          await handleJobUpdateFromEmail({
            userId,
            jobId: matchedJobId,
            detectedStatus: classification.status,
            actionRequired: classification.action_required,
            actionDueDate: classification.due_date,
            emailSubject: msg.subject,
          });
        }

        savedCount++;
      }
    }

    // 3. Update the last_sync_at timestamp to now
    await prisma.user.update({
      where: { id: userId },
      data: { last_sync_at: new Date() },
    });

    return { success: true, count: savedCount };
  } catch (error: unknown) {
    console.error("Gmail sync failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during sync";
    return { success: false, count: 0, error: errorMessage };
  }
}
