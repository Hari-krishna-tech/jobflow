import { z } from "zod";
import { JobStatus } from "@prisma/client";

// Zod schema matching the required structured JSON output from the classifier
const classificationSchema = z.object({
  job_related: z.boolean(),
  company: z.string().default(""),
  status: z.nativeEnum(JobStatus).nullable().default(null),
  action_required: z.string().nullable().default(null),
  due_date: z.string().nullable().default(null),
  summary: z.string().nullable().default(null),
});

export type EmailClassification = z.infer<typeof classificationSchema>;

/**
 * Cleans and parses JSON responses from the LLM, handling double-serialization.
 */
function parseLLMResponse(rawContent: string): any {
  let cleaned = rawContent.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
  }

  let parsed = JSON.parse(cleaned);
  if (typeof parsed === "string") {
    const trimmed = parsed.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      parsed = JSON.parse(trimmed);
    }
  }
  return parsed;
}

/**
 * Classifies email content using OpenRouter and the configured model.
 * Returns a validated and structured classification.
 */
export async function classifyEmail(
  subject: string,
  body: string,
  fromEmail: string
): Promise<EmailClassification> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-8b";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not configured.");
  }

  // Truncate inputs to maintain a safe token limit
  const truncatedSubject = subject.slice(0, 200);
  const truncatedBody = body.slice(0, 4000);

  const prompt = `Subject: ${truncatedSubject}\nFrom: ${fromEmail}\nBody:\n${truncatedBody}`;
  const currentDateStr = new Date().toDateString();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "JobFlow",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You analyze emails for a personal job-application tracker.
Analyze the email and return JSON only. Do NOT wrap the response in markdown code blocks (e.g. do not use \`\`\`json).

Note: Today's date is ${currentDateStr}. Resolve relative date mentions (like "tomorrow", "this Friday", "next Tuesday", or raw days like "June 25th") to absolute YYYY-MM-DD dates using this reference.

Return exactly this JSON structure:
{
  "job_related": true | false,
  "company": "Company Name", // The name of the company the user is applying to. Empty string if not job-related.
  "status": "APPLIED" | "ASSESSMENT" | "INTERVIEW" | "HR_ROUND" | "OFFER" | "REJECTED" | "GHOSTED", // Enum matching current status of the application. Null if status is not clear or if job_related is false.
  "action_required": "Action title", // Extracted next action for the user (e.g., "Schedule interview", "Submit assessment", "Review offer"). Max 80 characters. Null if no user action is required or job_related is false.
  "due_date": "YYYY-MM-DD", // Extract the deadline/event date mentioned in the email for the action item, if any. Use YYYY-MM-DD format. Null if no date is specified, if the date is not clear, or if job_related is false.
  "summary": "Short one-sentence summary of the email" // Null if job_related is false.
}

Rules:
- status MUST be one of: APPLIED, ASSESSMENT, INTERVIEW, HR_ROUND, OFFER, REJECTED, GHOSTED. Do not output any other value.
- If the email is a rejection, status should be REJECTED.
- If the email is an invitation to interview, status should be INTERVIEW.
- If the email is an assessment invite, status should be ASSESSMENT.
- If the email is an offer letter, status should be OFFER.
- job_related is true only if the email is directly related to a job application (e.g. application receipt, assessment invite, interview scheduling, offer, rejection, follow-up). Mark false for newsletters, job alerts, marketing, spam, or unrelated emails.
- If job_related is false, set company: "", status: null, action_required: null, due_date: null, summary: null.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (status ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("Empty response from OpenRouter");
  }

  try {
    const parsed = parseLLMResponse(rawContent);
    return classificationSchema.parse(parsed);
  } catch (parseError) {
    console.error("Failed to parse AI classification content:", rawContent);
    throw new Error(`Invalid JSON or schema from AI: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}

// Zod schema matching the required structured JSON output from the job parser
export const jobParsingSchema = z.object({
  company: z.string().default(""),
  position: z.string().default(""),
  location: z.string().nullable().default(null),
  salary: z.string().nullable().default(null),
  recruiter: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});

export type ParsedJobDescription = z.infer<typeof jobParsingSchema>;

/**
 * Parses a raw job description using OpenRouter and the configured model.
 * Returns a structured and validated job information object.
 */
export async function parseJobDescription(
  description: string
): Promise<ParsedJobDescription> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "qwen/qwen3-8b";

  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not configured.");
  }

  // Truncate inputs to maintain a safe token limit
  const truncatedDescription = description.slice(0, 8000);

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "JobFlow",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `You analyze job descriptions for a personal job-application tracker.
Analyze the job description and return JSON only. Do NOT wrap the response in markdown code blocks (e.g. do not use \`\`\`json).

Return exactly this JSON structure:
{
  "company": "Company Name", // The name of the company hiring. Empty string if not found.
  "position": "Job Title", // The title of the job / role. Empty string if not found.
  "location": "Location", // Location of the job (e.g. Remote, San Francisco, CA, Hybrid). Null if not found.
  "salary": "Salary", // Salary range or compensation details if mentioned (e.g., $120k - $150k). Null if not found.
  "recruiter": "Recruiter Name", // Name of the recruiter or contact person if mentioned. Null if not found.
  "notes": "A brief summary of the key responsibilities, requirements, and tech stack." // Extracted summary, requirements or notes. Null if not found.
}

Rules:
- Keep the company and position values short and clean (e.g. "Stripe" instead of "Stripe, Inc. - Payments & Financial Infrastructure").
- For notes, summarize the top 3-5 key points or bullet points of the job. Keep it under 500 characters.`,
        },
        {
          role: "user",
          content: truncatedDescription,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (status ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("Empty response from OpenRouter");
  }

  try {
    const parsed = parseLLMResponse(rawContent);
    return jobParsingSchema.parse(parsed);
  } catch (parseError) {
    console.error("Failed to parse AI job description parsing content:", rawContent);
    throw new Error(`Invalid JSON or schema from AI: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
  }
}
