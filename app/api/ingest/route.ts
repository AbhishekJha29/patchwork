import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseStackTrace, generateFingerprint } from "@/lib/ingestion/normalize";
import { processIngestion } from "@/lib/ingestion/dedupe";

const ingestPayloadSchema = z.object({
  message: z
    .string({ required_error: "'message' field is required" })
    .min(1, "'message' field cannot be empty"),
  stack: z.string().optional(),
  environment: z.string().optional(),
  repo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Authenticate via Authorization: Bearer <api_key> header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or malformed Authorization header. Expected 'Bearer <api_key>'" },
        { status: 401 }
      );
    }

    const apiKeyToken = authHeader.substring(7).trim();
    if (!apiKeyToken) {
      return NextResponse.json(
        { error: "Unauthorized: Empty API key provided" },
        { status: 401 }
      );
    }

    const apiKey = await db.apiKey.findUnique({
      where: { key: apiKeyToken },
      include: { project: true },
    });

    if (!apiKey || apiKey.revoked) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid or revoked API key" },
        { status: 401 }
      );
    }

    // Update lastUsedAt timestamp on successful auth
    await db.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    // 2. Parse & validate request body with Zod
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationResult = ingestPayloadSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const formattedErrors = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("; ");
      return NextResponse.json(
        { error: `Validation error: ${formattedErrors}` },
        { status: 400 }
      );
    }

    const payload = validationResult.data;

    // 3. Normalize stack trace & generate fingerprint
    const frames = parseStackTrace(payload.stack);
    const fingerprint = generateFingerprint(payload.message, frames);

    // 4. Deduplicate or create incident
    const result = await processIngestion({
      projectId: apiKey.projectId,
      message: payload.message,
      environment: payload.environment,
      repo: payload.repo,
      metadata: payload.metadata,
      frames,
      fingerprint,
    });

    // 5. Return JSON response
    return NextResponse.json(
      {
        success: true,
        incidentId: result.incidentId,
        isNew: result.isNew,
        isRecurrence: result.isRecurrence,
        occurrenceCount: result.occurrenceCount,
        projectId: apiKey.projectId,
      },
      { status: result.isNew ? 201 : 200 }
    );
  } catch (error: any) {
    console.error("Ingestion API error:", error);
    return NextResponse.json(
      { error: "Internal server error during ingestion" },
      { status: 500 }
    );
  }
}
