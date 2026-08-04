import { db } from "@/lib/db";
import { IncidentDetailClient } from "./IncidentDetailClient";
import { Incident, Severity, Status } from "@/lib/types";

export const dynamic = "force-dynamic";

interface IncidentPageProps {
  params: {
    id: string;
  };
}

export default async function IncidentDetailPage({ params }: IncidentPageProps) {
  const incidentId = params.id;

  let incident: Incident | null = null;

  try {
    const dbIncident = await db.incident.findUnique({
      where: { id: incidentId },
      include: {
        project: true,
        assignee: true,
        fixes: true,
        commits: true,
        stackFrames: true,
        auditLogs: true,
        rootCauseCommit: true,
      },
    });

    if (dbIncident) {
      const mainFix = dbIncident.fixes[0];
      const culprit = dbIncident.rootCauseCommit;
      // Fallback candidate with reasoning if present
      const candidateWithReasoning = dbIncident.commits.find((c) => c.reasoning || c.confidenceScore);
      const latestRootCauseLog = dbIncident.auditLogs
        .slice()
        .reverse()
        .find((l) => l.type.startsWith("ROOT_CAUSE_"));

      const rootCauseReasoning =
        culprit?.reasoning ||
        candidateWithReasoning?.reasoning ||
        (latestRootCauseLog ? latestRootCauseLog.message : null);

      incident = {
        id: dbIncident.id,
        title: dbIncident.title,
        severity: dbIncident.severity.toLowerCase() as Severity,
        status: dbIncident.status.toLowerCase() as Status,
        createdAt: dbIncident.createdAt.toISOString(),
        repo: dbIncident.project?.repoUrl || dbIncident.project?.name || "unknown/repo",
        errorMessage: dbIncident.errorMessage,
        stackTrace: dbIncident.stackFrames
          .sort((a, b) => a.order - b.order)
          .map((sf) => `at ${sf.functionName} (${sf.filePath}:${sf.lineNumber})`),
        aiSummary: dbIncident.aiSummary || "",
        aiTags: dbIncident.aiTags || [],
        triagedAt: dbIncident.triagedAt ? dbIncident.triagedAt.toISOString() : null,
        assignee: {
          id: dbIncident.assignee?.id || "unassigned",
          name: dbIncident.assignee?.name || "Unassigned",
          email: dbIncident.assignee?.email || "",
          avatar: "",
        },
        rootCause: {
          commitHash: culprit?.hash || "N/A",
          confidenceScore: Math.round(culprit?.confidenceScore ?? candidateWithReasoning?.confidenceScore ?? 0),
          reasoning: rootCauseReasoning || "",
          culpritCommit: culprit
            ? {
                hash: culprit.hash,
                author: culprit.author,
                message: culprit.message,
                timestamp: culprit.timestamp.toISOString(),
              }
            : undefined,
        },
        fix: {
          id: mainFix?.id,
          diff: mainFix?.diff || "",
          prUrl: mainFix?.prUrl || undefined,
          prTitle: mainFix?.prTitle || undefined,
          prDescription: mainFix?.prDescription || "",
          branchName: mainFix?.branchName || undefined,
          status: mainFix?.status?.toLowerCase() || "draft",
        },
        timeline: dbIncident.auditLogs.map((log) => ({
          id: log.id,
          incidentId: dbIncident.id,
          type: log.type,
          message: log.message,
          timestamp: log.createdAt.toLocaleTimeString(),
        })),
      };
    }
  } catch (err) {
    console.error("Failed to fetch incident from database:", err);
  }

  return <IncidentDetailClient initialIncident={incident} />;
}
