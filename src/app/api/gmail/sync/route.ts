import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncGmail } from "@/services/sync";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * GET /api/gmail/sync
 * POST /api/gmail/sync
 * Syncs Gmail for all users who have connected their accounts.
 * Used primarily by Vercel Cron or manual triggers.
 */
async function handleSync(request: NextRequest) {
  // Optional security check for Cron triggers
  const authHeader = request.headers.get("Authorization");
  const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && !isCron) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 5 syncs per minute per IP (bypass for cron)
  if (!isCron) {
    const ip = request.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(`sync:${ip}`, 5, 60 * 1000)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
  }

  try {
    // Find all users who have connected Gmail (i.e. have a refresh token)
    const connectedUsers = await prisma.user.findMany({
      where: {
        refresh_token: { not: null },
      },
      select: { id: true, email: true },
    });

    const results = [];
    let totalImported = 0;

    for (const user of connectedUsers) {
      const syncResult = await syncGmail(user.id);
      results.push({
        email: user.email,
        success: syncResult.success,
        count: syncResult.count,
        error: syncResult.error,
      });

      if (syncResult.success) {
        totalImported += syncResult.count;
      }
    }

    return NextResponse.json({
      success: true,
      usersSyncedCount: connectedUsers.length,
      totalImported,
      results,
    });
  } catch (error: unknown) {
    console.error("Cron sync endpoint failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to run sync";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
