import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { syncGmailStreaming } from "@/services/sync";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST /api/gmail/sync/stream
 * SSE endpoint that streams per-email sync progress events.
 * Used by the frontend for real-time UI updates during manual sync.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit: 5 syncs per minute per user
  const userId = session.user.id;
  if (isRateLimited(`sync-stream:${userId}`, 5, 60 * 1000)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of syncGmailStreaming(userId)) {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        // Bust the Next.js data cache so server components pick up new data
        revalidatePath("/gmail");
        revalidatePath("/");
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown sync error";
        const errorEvent = `data: ${JSON.stringify({
          type: "error",
          current: 0,
          total: 0,
          gmailMessageId: "",
          error: errorMessage,
        })}\n\n`;
        controller.enqueue(encoder.encode(errorEvent));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
