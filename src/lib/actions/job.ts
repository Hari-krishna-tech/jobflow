"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  createJobSchema,
  updateJobSchema,
  type CreateJobInput,
} from "@/lib/schemas/job";
import * as jobRepo from "@/lib/repositories/jobRepo";
import { ZodError } from "zod";
import { fail, ok, type ActionResult } from "./types";

/*
 * Job Server Actions (Task 1.8).
 *
 * Pattern (every action): auth check → Zod parse → repo call → revalidatePath →
 * return ActionResult. Auth-less callers are redirected to sign-in (defense in
 * depth on top of the middleware guard). On success the client shows a toast
 * and navigates; actions never redirect themselves so the form stays composable.
 *
 * Decision (CURRENT_CONTEXT §4): Server Actions + RSC, not REST handlers.
 */

async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/signin");
  return id;
}

function zodErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") continue;
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Create a job. Returns the new job id on success. */
export async function createJobAction(
  input: CreateJobInput,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  const parsed = createJobSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Some fields need attention.", zodErrors(parsed.error));
  }

  const job = await jobRepo.create(userId, parsed.data);
  revalidatePath("/");
  revalidatePath("/jobs");
  return ok({ id: job.id }, "Application added.");
}

/** Update a job. Returns false (with message) if the job isn't owned by the user. */
export async function updateJobAction(
  id: string,
  input: Record<string, unknown>,
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  const parsed = updateJobSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Some fields need attention.", zodErrors(parsed.error));
  }

  const job = await jobRepo.update(userId, id, parsed.data);
  if (!job) return fail("Couldn't find that application.");
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  return ok({ id: job.id }, "Changes saved.");
}

/** Delete a job. */
export async function deleteJobAction(id: string): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  const deleted = await jobRepo.remove(userId, id);
  if (!deleted) return fail("Couldn't find that application.");
  revalidatePath("/");
  revalidatePath("/jobs");
  return ok({ id }, "Job deleted.");
}
