import { db } from "@/lib/db";
import { ParsedStackFrame } from "./normalize";
import { triageIncident } from "@/lib/ai/triage";
import { analyzeRootCause } from "@/lib/analysis/root-cause";
import { generateAndOpenFix } from "@/lib/analysis/apply-fix";
import { parseOwnerRepo, getCommitDiff } from "@/lib/github/client";

// Easily adjustable confidence threshold to gate automatic hotfix generation
export const HOTFIX_CONFIDENCE_THRESHOLD = 50;

export interface IngestionResult {
  incidentId: string;
  isNew: boolean;
  isRecurrence: boolean;
  occurrenceCount: number;
}

export interface ProcessIngestionInput {
  projectId: string;
  message: string;
  environment?: string;
  repo?: string;
  metadata?: Record<string, any>;
  frames: ParsedStackFrame[];
  fingerprint: string;
}

export async function processIngestion({
  projectId,
  message,
  environment,
  repo,
  metadata,
  frames,
  fingerprint,
}: ProcessIngestionInput): Promise<IngestionResult> {
  // Check if an open (non-RESOLVED) Incident with that fingerprint already exists in the project
  const existingIncident = await db.incident.findFirst({
    where: {
      projectId,
      fingerprint,
      status: {
        not: "RESOLVED",
      },
    },
  });

  if (existingIncident) {
    // Increment occurrenceCount, update lastSeenAt, append AuditLog entry
    const updatedIncident = await db.incident.update({
      where: { id: existingIncident.id },
      data: {
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
        auditLogs: {
          create: {
            type: "RECURRENCE",
            message: `Incident recurred (occurrence #${existingIncident.occurrenceCount + 1})`,
          },
        },
      },
    });

    return {
      incidentId: updatedIncident.id,
      isNew: false,
      isRecurrence: true,
      occurrenceCount: updatedIncident.occurrenceCount,
    };
  }

  // Fetch project details to get connected repoUrl
  const project = await db.project.findUnique({
    where: { id: projectId },
  });

  // Create new Incident (status DETECTED, severity default MEDIUM) + StackFrames + AuditLog
  const title = message.length > 100 ? `${message.substring(0, 97)}...` : message;

  const newIncident = await db.incident.create({
    data: {
      projectId,
      title,
      errorMessage: message,
      severity: "MEDIUM",
      status: "DETECTED",
      fingerprint,
      occurrenceCount: 1,
      lastSeenAt: new Date(),
      stackFrames: {
        create: frames.map((frame) => ({
          filePath: frame.filePath,
          lineNumber: frame.lineNumber,
          functionName: frame.functionName,
          order: frame.order,
        })),
      },
      auditLogs: {
        create: {
          type: "DETECTION",
          message: "Incident detected via API ingestion pipeline",
        },
      },
    },
  });

  const projectRepoUrl = project?.repoUrl || repo || "";

  // Step 1: Perform AI Triage synchronously for new incidents
  try {
    const triage = await triageIncident({
      errorMessage: message,
      environment,
      repo: projectRepoUrl,
      stackFrames: frames,
      occurrenceCount: 1,
    });

    await db.incident.update({
      where: { id: newIncident.id },
      data: {
        severity: triage.severity,
        aiSummary: triage.summary,
        aiTags: triage.tags,
        triagedAt: new Date(),
        status: "TRIAGED",
        auditLogs: {
          create: {
            type: "AI_TRIAGE",
            message: `AI triage completed: severity set to ${triage.severity}`,
          },
        },
      },
    });
  } catch (triageErr) {
    console.error(`AI Triage error during ingestion for incident ${newIncident.id}:`, triageErr);
  }

  // Step 2: Perform Root Cause Analysis immediately after AI Triage
  let rootCauseResult: any = null;
  try {
    rootCauseResult = await analyzeRootCause({
      incidentId: newIncident.id,
      errorMessage: message,
      stackFrames: frames,
      projectRepoUrl,
    });
  } catch (analysisErr) {
    console.error(`Root Cause Analysis error during ingestion for incident ${newIncident.id}:`, analysisErr);
  }

  // Step 3: Trigger Automated Hotfix Generation if root cause confidence meets threshold
  try {
    if (
      rootCauseResult?.success &&
      rootCauseResult.culpritCommitHash &&
      rootCauseResult.confidenceScore >= HOTFIX_CONFIDENCE_THRESHOLD
    ) {
      const culpritCommitRecord = rootCauseResult.commitId
        ? await db.commit.findUnique({ where: { id: rootCauseResult.commitId } })
        : null;

      let culpritDiff = "";
      const parsedRepo = parseOwnerRepo(projectRepoUrl);
      if (parsedRepo && rootCauseResult.culpritCommitHash) {
        const diffData = await getCommitDiff(parsedRepo.owner, parsedRepo.repo, rootCauseResult.culpritCommitHash);
        culpritDiff = diffData?.diff || "";
      }

      await generateAndOpenFix({
        incident: {
          id: newIncident.id,
          title,
          errorMessage: message,
        },
        stackFrames: frames,
        culpritCommit: {
          hash: rootCauseResult.culpritCommitHash,
          author: culpritCommitRecord?.author || "Unknown",
          message: culpritCommitRecord?.message || "Identified culprit commit",
        },
        culpritDiff,
        projectRepoUrl,
      });
    } else if (rootCauseResult) {
      const skipReason = !rootCauseResult.culpritCommitHash
        ? "no clear culprit commit identified"
        : `root cause confidence (${rootCauseResult.confidenceScore}%) below threshold (${HOTFIX_CONFIDENCE_THRESHOLD}%)`;

      await db.auditLog.create({
        data: {
          incidentId: newIncident.id,
          type: "HOTFIX_SKIPPED",
          message: `Hotfix generation skipped: ${skipReason}`,
        },
      });
    }
  } catch (fixErr) {
    console.error(`Hotfix generation error during ingestion for incident ${newIncident.id}:`, fixErr);
  }

  return {
    incidentId: newIncident.id,
    isNew: true,
    isRecurrence: false,
    occurrenceCount: 1,
  };
}


