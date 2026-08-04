import { generateText } from "./gemini-client";
import { Severity } from "@prisma/client";

export interface TriageInput {
  errorMessage: string;
  environment?: string | null;
  repo?: string | null;
  stackFrames?: Array<{
    filePath: string;
    lineNumber: number;
    functionName: string;
  }>;
  occurrenceCount?: number;
}

export interface TriageResult {
  severity: Severity;
  summary: string;
  tags: string[];
}

export async function triageIncident(input: TriageInput): Promise<TriageResult> {
  const { errorMessage, environment, repo, stackFrames = [], occurrenceCount = 1 } = input;

  const formattedStack = stackFrames.length > 0
    ? stackFrames.map((sf) => `  at ${sf.functionName} (${sf.filePath}:${sf.lineNumber})`).join("\n")
    : "  (No stack trace available)";

  const prompt = `You are an expert site reliability engineer and automated incident triage agent.
Analyze the following incident report and assess its severity, write a concise summary, and assign short categorical tags.

INCIDENT DETAILS:
- Error Message: ${errorMessage}
- Environment: ${environment || "unknown"}
- Repository: ${repo || "unknown"}
- Occurrence Count: ${occurrenceCount}
- Stack Trace:
${formattedStack}

SEVERITY CLASSIFICATION GUIDELINES:
- CRITICAL: System crashes, database data loss, security vulnerabilities, payment/billing failures, authentication outages, or wide-scale downtime.
- HIGH: Core functional feature broken affecting many users, primary workflow blocking error, or unhandled major service exception.
- MEDIUM: Degraded experience, edge case error, non-critical integration failure, performance degradation, or retryable failure.
- LOW: Cosmetic glitch, minor logging error, rare non-blocking edge case, or deprecation warning.

RESPONSE FORMAT INSTRUCTIONS:
Respond ONLY with a valid JSON object. Do NOT include markdown formatting (do NOT wrap in \`\`\`json or \`\`\`), no preamble, no commentary, and no trailing text.
The JSON object MUST match this exact schema:
{
  "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "summary": "One or two sentence plain-English explanation of what likely went wrong and why.",
  "tags": ["short-tag-1", "short-tag-2"]
}
`;

  try {
    const rawOutput = await generateText(prompt);
    
    // Strip markdown code block wrappers if present (e.g. ```json ... ```)
    let cleanedJson = rawOutput.trim();
    if (cleanedJson.startsWith("```")) {
      cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    }

    const parsed = JSON.parse(cleanedJson);

    // Validate severity enum
    const validSeverities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const rawSeverity = typeof parsed.severity === "string" ? parsed.severity.toUpperCase() : "";
    const severity: Severity = validSeverities.includes(rawSeverity as Severity)
      ? (rawSeverity as Severity)
      : "MEDIUM";

    const summary = typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Automated analysis detected: ${errorMessage.slice(0, 150)}`;

    const tags = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: any) => typeof t === "string" && t.trim()).map((t: string) => t.trim().toLowerCase())
      : ["uncategorized"];

    return {
      severity,
      summary,
      tags,
    };
  } catch (error: any) {
    console.error("AI Triage failed or flaked, using fallback:", error?.message || error);
    
    // Fallback classification if AI fails or returns invalid JSON
    let fallbackSeverity: Severity = "MEDIUM";
    const lowerMessage = errorMessage.toLowerCase();
    if (lowerMessage.includes("payment") || lowerMessage.includes("auth") || lowerMessage.includes("crash") || lowerMessage.includes("fatal")) {
      fallbackSeverity = "CRITICAL";
    } else if (lowerMessage.includes("timeout") || lowerMessage.includes("failed") || lowerMessage.includes("error")) {
      fallbackSeverity = "HIGH";
    }

    return {
      severity: fallbackSeverity,
      summary: `Automated triage fallback: ${errorMessage.slice(0, 150)}`,
      tags: ["triage-fallback"],
    };
  }
}
