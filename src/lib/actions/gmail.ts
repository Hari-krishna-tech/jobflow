"use server";

import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncGmail, handleJobUpdateFromEmail } from "@/services/sync";
import { revalidatePath } from "next/cache";

interface ActionResponse {
  success: boolean;
  message: string;
  count?: number;
}

/**
 * Server action to synchronize Gmail emails for the logged-in user.
 */
export async function syncGmailAction(): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  const userId = session.user.id;

  const result = await syncGmail(userId);

  if (result.success) {
    revalidatePath("/gmail");
    revalidatePath("/");
    return {
      success: true,
      message: `Sync successful. Imported ${result.count} new email(s).`,
      count: result.count,
    };
  } else {
    return {
      success: false,
      message: result.error || "Sync failed.",
    };
  }
}

/**
 * Server action to disconnect Gmail (removes stored OAuth tokens).
 */
export async function disconnectGmailAction(): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        refresh_token: null,
        access_token: null,
        last_sync_at: null,
      },
    });

    revalidatePath("/gmail");
    revalidatePath("/");
    return {
      success: true,
      message: "Gmail disconnected successfully.",
    };
  } catch (error: unknown) {
    console.error("Failed to disconnect Gmail:", error);
    const message = error instanceof Error ? error.message : "Failed to disconnect Gmail.";
    return {
      success: false,
      message,
    };
  }
}

/**
 * Server action to manually link an email to a specific job.
 */
export async function linkEmailToJobAction(emailId: string, jobId: string): Promise<ActionResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized. Please sign in." };
  }

  try {
    // Verify the job belongs to the user
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: session.user.id },
      select: { id: true },
    });

    if (!job) {
      return { success: false, message: "Job not found or unauthorized." };
    }

    // Verify the email belongs to the user
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId: session.user.id },
      select: { id: true },
    });

    if (!email) {
      return { success: false, message: "Email not found or unauthorized." };
    }

    const updatedEmail = await prisma.email.update({
      where: { id: emailId },
      data: { jobId },
    });

    // Automatically trigger status update and task creation from the manually linked email
    await handleJobUpdateFromEmail({
      userId: session.user.id,
      jobId,
      detectedStatus: updatedEmail.detectedStatus,
      actionRequired: updatedEmail.actionRequired,
      actionDueDate: updatedEmail.actionDueDate,
      emailSubject: updatedEmail.subject,
    });

    revalidatePath("/gmail");
    revalidatePath("/");
    return { success: true, message: "Email successfully linked to job." };
  } catch (error: unknown) {
    console.error("Failed to link email to job:", error);
    const message = error instanceof Error ? error.message : "Failed to link email.";
    return { success: false, message };
  }
}

/**
 * Server action to initiate the Google OAuth Gmail connection flow.
 */
export async function connectGmailAction(): Promise<void> {
  await signIn("google", { redirectTo: "/gmail" });
}
