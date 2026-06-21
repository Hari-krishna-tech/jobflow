import { z } from "zod";
import { JobStatus } from "@prisma/client";

/*
 * Job validation schemas — single source of truth for every API boundary and
 * Server Action (decisions: "Zod validation on every API boundary and Server
 * Action"). Keep field names aligned with prisma/schema.prisma.
 *
 * NOTE: This is Zod 4. The API differs from Zod 3:
 *   - .string() params take `error` / `message`, not `required_error`
 *   - .min() / .max() second arg is `{ message?: string }`
 *   - z.coerce is in the main package
 */

export const JOB_STATUSES = Object.values(JobStatus) as [JobStatus, ...JobStatus[]];

// Display labels for UI + the canonical status→color map live in StatusBadge.
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  APPLIED: "Applied",
  ASSESSMENT: "Assessment",
  INTERVIEW: "Interview",
  HR_ROUND: "HR Round",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

// Create — company + position required; rest optional. Trim + cap lengths to
// keep the DB tidy and give friendly messages per CONTEXT/04 voice rules.
export const createJobSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, { message: "Company is required." })
    .max(120, { message: "Company is too long." }),
  position: z
    .string()
    .trim()
    .min(1, { message: "Position is required." })
    .max(160, { message: "Position is too long." }),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  jobUrl: z
    .string()
    .trim()
    .url({ message: "Invalid URL." })
    .max(2000)
    .optional()
    .or(z.literal("")),
  salary: z.string().trim().max(60).optional().or(z.literal("")),
  appliedDate: z.coerce.date().optional().or(z.literal("")).nullable(),
  status: z.enum(JOB_STATUSES).default(JobStatus.APPLIED),
  notes: z.string().trim().max(8000).optional().or(z.literal("")),
  recruiter: z.string().trim().max(160).optional().or(z.literal("")),
});

// Update — every field optional; absent fields are left untouched.
export const updateJobSchema = z.object({
  company: z.string().trim().min(1).max(120).optional(),
  position: z.string().trim().min(1).max(160).optional(),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  jobUrl: z
    .string()
    .trim()
    .url({ message: "Invalid URL." })
    .max(2000)
    .optional()
    .or(z.literal("")),
  salary: z.string().trim().max(60).optional().or(z.literal("")),
  appliedDate: z.coerce.date().optional().or(z.literal("")).nullable(),
  status: z.enum(JOB_STATUSES).optional(),
  notes: z.string().trim().max(8000).optional().or(z.literal("")),
  recruiter: z.string().trim().max(160).optional().or(z.literal("")),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

// Plain empty strings → null for optional nullable DB columns (cleaner than
// storing ""). Applied to optional fields before passing to the repository.
export function normalizeJobFields(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const nullable = ["location", "jobUrl", "salary", "appliedDate", "notes", "recruiter"];
  const out = { ...input };
  for (const key of nullable) {
    if (key in out && (out[key] === "" || out[key] === undefined)) {
      out[key] = null;
    }
  }
  return out;
}
