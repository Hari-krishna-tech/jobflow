import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { GmailSyncClient } from "@/components/gmail/gmail-sync-client";
import { connectGmailAction } from "@/lib/actions/gmail";

export const dynamic = "force-dynamic";

export default async function GmailPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unmatchedPage?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");

  const userId = session.user.id;
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const unmatchedPage = Math.max(1, Number(params.unmatchedPage) || 1);
  const pageSize = 30;

  // 1. Fetch user data from DB to check connection status
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, last_sync_at: true, refresh_token: true },
  });

  if (!user) redirect("/signin");

  const isConnected = user.refresh_token !== null;

  // 2. Fetch email counts
  const totalEmailsCount = await prisma.email.count({
    where: { userId },
  });

  const unmatchedEmailsCount = await prisma.email.count({
    where: { userId, jobId: null },
  });

  // 3. Fetch paginated recent emails
  const recentEmails = await prisma.email.findMany({
    where: { userId },
    orderBy: { receivedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  // 4. Fetch paginated unmatched emails
  const unmatchedEmails = await prisma.email.findMany({
    where: { userId, jobId: null },
    orderBy: { receivedAt: "desc" },
    skip: (unmatchedPage - 1) * pageSize,
    take: pageSize,
  });

  // 5. Fetch jobs for linking selection dialog
  const jobs = await prisma.job.findMany({
    where: { userId },
    select: { id: true, company: true, position: true },
    orderBy: { company: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Page header (CONTEXT/03 §2) */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-text">
          Gmail Integration
        </h2>
        <p className="max-w-[640px] text-sm text-text-dim">
          Monitor your inbox for job application emails, automatic status updates, and next actions.
        </p>
      </div>

      <GmailSyncClient
        isConnected={isConnected}
        userEmail={user.email}
        lastSyncAt={user.last_sync_at}
        totalEmailsCount={totalEmailsCount}
        unmatchedEmailsCount={unmatchedEmailsCount}
        recentEmails={recentEmails}
        unmatchedEmails={unmatchedEmails}
        jobs={jobs}
        connectAction={connectGmailAction}
        page={page}
        unmatchedPage={unmatchedPage}
        pageSize={pageSize}
      />
    </div>
  );
}
