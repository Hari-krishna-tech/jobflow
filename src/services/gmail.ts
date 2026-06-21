import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/db";

interface GmailMessageDetail {
  id: string;
  subject: string;
  from: string;
  date: Date;
  body: string;
}

/**
 * Refreshes the Google OAuth access token for a user using their stored refresh token.
 * Updates the user's access_token in the database.
 */
async function refreshAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { refresh_token: true },
  });

  if (!user || !user.refresh_token) {
    throw new Error("Gmail not connected (missing refresh token)");
  }

  const refreshToken = decrypt(user.refresh_token);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to refresh Google OAuth token: ${errText}`);
  }

  const data = await response.json();
  const newAccessToken = data.access_token;

  await prisma.user.update({
    where: { id: userId },
    data: { access_token: newAccessToken },
  });

  return newAccessToken;
}

/**
 * Decodes Gmail base64url encoded strings.
 */
function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}
interface GmailPayloadPart {
  mimeType?: string;
  body?: {
    data?: string;
    size?: number;
  };
  parts?: GmailPayloadPart[];
  snippet?: string;
  headers?: Array<{ name: string; value: string }>;
}

/**
 * Helper to recursively extract plain text or HTML body from Gmail payload parts.
 */
function getMessageBody(payload: GmailPayloadPart | undefined): string {
  if (!payload) return "";

  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const body = getMessageBody(part);
      if (body) return body;
    }
  }

  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return payload.snippet || "";
}

/**
 * Performs a Gmail API request, automatically retrying once with refreshed tokens on a 401.
 */
async function gmailFetch(userId: string, url: string, options: RequestInit = {}): Promise<Response> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { access_token: true },
  });

  let token = user?.access_token;

  const makeRequest = async (accessToken: string) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  };

  if (!token) {
    token = await refreshAccessToken(userId);
  }

  let response = await makeRequest(token);

  if (response.status === 401) {
    // Access token likely expired. Refresh and try one more time.
    token = await refreshAccessToken(userId);
    response = await makeRequest(token);
  }

  return response;
}

/**
 * Fetches recent message details for the user since `lastSyncAt`.
 * If `lastSyncAt` is null, defaults to fetching emails from the last 7 days.
 */
export async function fetchRecentMessages(
  userId: string,
  lastSyncAt: Date | null
): Promise<GmailMessageDetail[]> {
  const sinceTime = lastSyncAt
    ? Math.floor(lastSyncAt.getTime() / 1000)
    : Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000); // last 7 days

  // Query: after specified timestamp, not sent by user, and excluding promotions, social, and forums categories
  const query = `after:${sinceTime} -from:me -category:promotions -category:social -category:forums`;
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
    query
  )}&maxResults=100`;

  const listResponse = await gmailFetch(userId, listUrl);
  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    throw new Error(`Gmail API list error: ${errorText}`);
  }

  const listData = await listResponse.json();
  const messagesList = listData.messages || [];

  if (messagesList.length === 0) {
    return [];
  }

  // Fetch details of each message in parallel
  const detailsPromises = messagesList.map(async (msg: { id: string }) => {
    const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
    const detailResponse = await gmailFetch(userId, detailUrl);

    if (!detailResponse.ok) {
      console.error(`Failed to fetch message details for ID ${msg.id}`);
      return null;
    }

    const detail = await detailResponse.json();
    const headers: Array<{ name: string; value: string }> = detail.payload?.headers || [];

    const subject =
      headers.find((h) => h.name.toLowerCase() === "subject")?.value || "(No Subject)";
    const from = headers.find((h) => h.name.toLowerCase() === "from")?.value || "";
    const dateStr = headers.find((h) => h.name.toLowerCase() === "date")?.value || "";
    const date = dateStr ? new Date(dateStr) : new Date();
    const body = getMessageBody(detail.payload);

    return {
      id: detail.id,
      subject,
      from,
      date,
      body,
    };
  });

  const results = await Promise.all(detailsPromises);
  // Filter out any failed requests
  return results.filter((item): item is GmailMessageDetail => item !== null);
}
