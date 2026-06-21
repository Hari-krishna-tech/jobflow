"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { z, ZodError } from "zod";
import * as taskRepo from "@/lib/repositories/taskRepo";
import { fail, ok, type ActionResult } from "./types";
import { TaskSource } from "@prisma/client";

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

const createTaskSchema = z.object({
  jobId: z.string().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(1, { message: "Task title is required." })
    .max(120, { message: "Task title is too long." }),
  dueDate: z.coerce.date().optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
});

/** Create a manual task. */
export async function createTaskAction(
  input: Record<string, unknown>
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  const parsed = createTaskSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Some fields need attention.", zodErrors(parsed.error));
  }

  const task = await taskRepo.create(userId, {
    jobId: parsed.data.jobId,
    title: parsed.data.title,
    description: parsed.data.description,
    dueDate: parsed.data.dueDate,
    source: TaskSource.MANUAL,
  });

  revalidatePath("/");
  revalidatePath("/tasks");
  if (parsed.data.jobId) {
    revalidatePath(`/jobs/${parsed.data.jobId}`);
  }

  return ok({ id: task.id }, "Task created.");
}

/** Toggle task completion. */
export async function toggleTaskAction(
  id: string,
  completed: boolean
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  try {
    const task = await taskRepo.toggle(userId, id, completed);
    revalidatePath("/");
    revalidatePath("/tasks");
    if (task.jobId) {
      revalidatePath(`/jobs/${task.jobId}`);
    }
    return ok({ id }, completed ? "Task completed." : "Task marked incomplete.");
  } catch (error: unknown) {
    console.error("Failed to toggle task:", error);
    return fail("Failed to update task.");
  }
}

/** Delete a task. */
export async function deleteTaskAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  const userId = await requireUserId();

  try {
    const task = await taskRepo.remove(userId, id);
    revalidatePath("/");
    revalidatePath("/tasks");
    if (task.jobId) {
      revalidatePath(`/jobs/${task.jobId}`);
    }
    return ok({ id }, "Task deleted.");
  } catch (error: unknown) {
    console.error("Failed to delete task:", error);
    return fail("Failed to delete task.");
  }
}
