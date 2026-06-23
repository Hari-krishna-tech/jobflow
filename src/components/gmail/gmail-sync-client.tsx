"use client";

import * as React from "react";
import { useTransition, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, RefreshCw, Unlink, Link2, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime, formatRelative } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import {
  disconnectGmailAction,
  linkEmailToJobAction,
} from "@/lib/actions/gmail";
import { JobStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";

interface EmailData {
  id: string;
  subject: string;
  fromEmail: string;
  receivedAt: Date | string;
  jobId: string | null;
  summary: string | null;
  detectedStatus: JobStatus | null;
}

interface SyncProgress {
  current: number;
  total: number;
  latestEmail: string | null;
  savedCount: number;
}

interface JobData {
  id: string;
  company: string;
  position: string;
}

interface GmailSyncClientProps {
  isConnected: boolean;
  userEmail: string;
  lastSyncAt: Date | string | null;
  totalEmailsCount: number;
  unmatchedEmailsCount: number;
  recentEmails: EmailData[];
  unmatchedEmails: EmailData[];
  jobs: JobData[];
  connectAction: () => Promise<void>;
  page: number;
  unmatchedPage: number;
  pageSize: number;
}

export function GmailSyncClient({
  isConnected,
  userEmail,
  lastSyncAt,
  totalEmailsCount,
  unmatchedEmailsCount,
  recentEmails,
  unmatchedEmails,
  jobs,
  connectAction,
  page,
  unmatchedPage,
  pageSize,
}: GmailSyncClientProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, startDisconnect] = useTransition();
  const [isLinking, startLinking] = useTransition();

  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [linkEmailId, setLinkEmailId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (key: "page" | "unmatchedPage", newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, String(newPage));
    router.push(`/gmail?${params.toString()}`);
  };

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress({ current: 0, total: 0, latestEmail: null, savedCount: 0 });

    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const response = await fetch("/api/gmail/sync/stream", {
        method: "POST",
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Sync failed" }));
        toast.error(err.error || "Sync failed");
        setIsSyncing(false);
        setSyncProgress(null);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        toast.error("Failed to read sync stream");
        setIsSyncing(false);
        setSyncProgress(null);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr.trim()) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "progress") {
              setSyncProgress((prev) => ({
                ...prev!,
                total: event.total,
                current: 0,
                savedCount: 0,
                latestEmail: null,
              }));
            } else if (event.type === "email") {
              setSyncProgress((prev) => ({
                current: event.current,
                total: event.total,
                latestEmail: event.email.fromEmail,
                savedCount: (prev?.savedCount ?? 0) + 1,
              }));
            } else if (event.type === "skip") {
              setSyncProgress((prev) => ({
                ...prev!,
                current: event.current,
                total: event.total,
              }));
            } else if (event.type === "error" && event.total === 0) {
              // Fatal error before processing started
              toast.error(event.error || "Sync error");
            } else if (event.type === "complete") {
              const matched = event.savedCount - event.errorCount;
              toast.success(
                `Sync complete — ${event.savedCount} email(s) imported${event.skippedCount > 0 ? `, ${event.skippedCount} skipped` : ""}`
              );
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      // Revalidate server data now that sync is complete
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Sync connection failed. Please try again.");
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
      abortRef.current = null;
    }
  }, [isSyncing, router]);

  const handleDisconnect = () => {
    if (confirm("Are you sure you want to disconnect Gmail? Your credentials will be removed from our servers.")) {
      startDisconnect(async () => {
        const res = await disconnectGmailAction();
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  const handleOpenLinkDialog = (emailId: string) => {
    setLinkEmailId(emailId);
    setSelectedJobId(jobs[0]?.id || "");
  };

  const handleLinkEmail = () => {
    if (!linkEmailId || !selectedJobId) return;

    startLinking(async () => {
      const res = await linkEmailToJobAction(linkEmailId, selectedJobId);
      if (res.success) {
        toast.success(res.message);
        setLinkEmailId(null);
      } else {
        toast.error(res.message);
      }
    });
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-6">
        <EmptyState
          icon={Mail}
          title="Gmail not connected"
          description="Connect your account to automatically sync and detect job application emails."
          action={
            <form action={connectAction}>
              <Button type="submit" size="lg">
                Connect Gmail
              </Button>
            </form>
          }
        />
      </div>
    );
  }

  const unmatchedTotalPages = Math.ceil(unmatchedEmailsCount / pageSize);
  const recentTotalPages = Math.ceil(totalEmailsCount / pageSize);

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Connection Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Gmail Sync Connected</CardTitle>
              <p className="text-xs text-text-dim mt-0.5">
                Monitoring mailbox: <span className="text-text font-medium">{userEmail}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="gap-2 bg-red-950/20 text-red-400 border border-red-500/20 hover:bg-red-950/40 hover:text-red-300"
            >
              <Unlink className="size-4" />
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border/40 mt-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-faint">Status</span>
            <div className="mt-1 font-mono text-sm text-green-400 font-semibold flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              Active Polling
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-faint">Last Synced</span>
            <div className="mt-1 font-mono text-sm text-text">
              {lastSyncAt ? formatDateTime(lastSyncAt) : "Never"}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-faint">Emails Synced</span>
            <div className="mt-1 font-mono text-sm text-text font-semibold">
              {totalEmailsCount} email(s)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Progress Panel — only visible during active sync */}
      {syncProgress && (
        <Card className="border-accent/30 bg-accent/5 overflow-hidden">
          <CardContent className="py-5 px-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Loader2 className="size-4 text-accent animate-spin" />
                <span className="text-sm font-semibold text-text">
                  {syncProgress.total === 0
                    ? "Fetching emails from Gmail..."
                    : `Processing ${syncProgress.current} of ${syncProgress.total} email(s)…`}
                </span>
              </div>
              {syncProgress.savedCount > 0 && (
                <span className="font-mono text-xs text-accent">
                  {syncProgress.savedCount} imported
                </span>
              )}
            </div>

            {/* Progress bar */}
            {syncProgress.total > 0 && (
              <div className="relative h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-accent transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.round((syncProgress.current / syncProgress.total) * 100)}%`,
                  }}
                />
              </div>
            )}

            {/* Current email being processed */}
            {syncProgress.latestEmail && (
              <p className="text-xs text-text-dim truncate">
                Latest: <span className="font-mono text-text-faint">{syncProgress.latestEmail}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Unmatched Queue Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-text">Unmatched Email Queue</h2>
          <span className="inline-flex h-5 items-center rounded-full bg-amber-500/10 px-2.5 text-xs font-mono font-medium text-amber-400 border border-amber-500/20">
            {unmatchedEmailsCount} pending
          </span>
        </div>
        
        {unmatchedEmailsCount === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center bg-bg-soft/20">
            <Mail className="size-8 text-text-faint mb-2" />
            <p className="text-sm font-semibold text-text">All emails matched</p>
            <p className="text-xs text-text-dim mt-1 max-w-[320px]">
              Every synced email has been successfully linked to an active job tracker.
            </p>
          </Card>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {unmatchedEmails.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-dim">
                  No unmatched emails found on this page.
                </div>
              ) : (
                unmatchedEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-border-soft last:border-b-0 hover:bg-card-hover/40 transition-colors"
                  >
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-text">{email.fromEmail}</span>
                        <span className="font-mono text-xs text-text-faint">
                          {formatRelative(email.receivedAt)}
                        </span>
                      </div>
                      <span className="text-sm text-text-dim line-clamp-1">{email.subject}</span>
                      {email.summary && (
                        <p className="text-xs text-text-faint mt-1 bg-bg-soft/40 p-2 rounded">
                          {email.summary}
                        </p>
                      )}
                      {email.detectedStatus && (
                        <div className="mt-1">
                          <StatusBadge status={email.detectedStatus} />
                        </div>
                      )}
                    </div>
                    <div className="mt-3 sm:mt-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenLinkDialog(email.id)}
                        className="gap-1.5"
                      >
                        <Link2 className="size-3.5" />
                        Link to Job
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Unmatched Pagination Controls */}
            {unmatchedTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-xs text-text-dim">
                  Page <span className="font-mono">{unmatchedPage}</span> of{" "}
                  <span className="font-mono">{unmatchedTotalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={unmatchedPage <= 1}
                    onClick={() => handlePageChange("unmatchedPage", unmatchedPage - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={unmatchedPage >= unmatchedTotalPages}
                    onClick={() => handlePageChange("unmatchedPage", unmatchedPage + 1)}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. Recent Synced Emails Section */}
      <div>
        <h2 className="text-lg font-bold text-text mb-4">Recent Synced Emails</h2>
        
        {totalEmailsCount === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center bg-bg-soft/20">
            <Mail className="size-8 text-text-faint mb-2" />
            <p className="text-sm font-semibold text-text">No emails synced</p>
            <p className="text-xs text-text-dim mt-1">
              Trigger a manual sync or wait for background cron sync to pull emails.
            </p>
          </Card>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {recentEmails.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-dim">
                  No emails found on this page.
                </div>
              ) : (
                recentEmails.map((email) => (
                  <div
                    key={email.id}
                    className="flex flex-col p-4 border-b border-border-soft last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-semibold text-text">{email.fromEmail}</span>
                      <span className="font-mono text-xs text-text-faint">
                        {formatRelative(email.receivedAt)}
                      </span>
                    </div>
                    <span className="text-sm text-text-dim mt-1">{email.subject}</span>
                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {email.detectedStatus && (
                          <StatusBadge status={email.detectedStatus} />
                        )}
                        {email.jobId ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                            <CheckCircle2 className="size-3" />
                            Linked to Job
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <AlertTriangle className="size-3" />
                            Unmatched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Recent Pagination Controls */}
            {recentTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <span className="text-xs text-text-dim">
                  Page <span className="font-mono">{page}</span> of{" "}
                  <span className="font-mono">{recentTotalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange("page", page - 1)}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= recentTotalPages}
                    onClick={() => handlePageChange("page", page + 1)}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Manual Link to Job Dialog */}
      <Dialog open={linkEmailId !== null} onOpenChange={(open) => !open && setLinkEmailId(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Link Email to Job Application</DialogTitle>
            <DialogDescription>
              Select the active job application you want to associate this email thread with.
            </DialogDescription>
          </DialogHeader>

          {jobs.length === 0 ? (
            <div className="py-6 text-center text-sm text-text-dim">
              No jobs found. Please add a job application tracker first.
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                  Select Job Application
                </label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a job..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.company} — {job.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => setLinkEmailId(null)} disabled={isLinking}>
              Cancel
            </Button>
            <Button onClick={handleLinkEmail} disabled={isLinking || jobs.length === 0} className="gap-1.5">
              {isLinking && <RefreshCw className="size-3.5 animate-spin" />}
              {isLinking ? "Linking..." : "Link Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
