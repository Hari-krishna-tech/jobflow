import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { classifyEmail } from "@/services/ai";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * POST /api/ai/classify-email
 * Authenticated endpoint to classify an email.
 * Body parameters: subject, body, fromEmail
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // Limit to 20 requests per minute
  if (isRateLimited(`classify:${userId}`, 20, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const json = await request.json();
    const { subject, body, fromEmail } = json;

    if (!subject || !body || !fromEmail) {
      return NextResponse.json(
        { error: "Missing required fields: subject, body, and fromEmail" },
        { status: 400 }
      );
    }

    const result = await classifyEmail(subject, body, fromEmail);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("AI classification API handler error:", error);
    const message = error instanceof Error ? error.message : "Failed to classify email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
