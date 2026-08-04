import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";
import { Incident, Severity, Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  let incidents: Incident[] = [];

  if (session?.user?.email) {
    try {
      // Query real incidents for user's org projects from Prisma
      const dbIncidents = await db.incident.findMany({
        where: {
          project: {
            org: {
              members: {
                some: {
                  user: {
                    email: session.user.email,
                  },
                },
              },
            },
          },
        },
        include: {
          project: true,
          assignee: true,
          fixes: true,
          commits: true,
          stackFrames: true,
          auditLogs: true,
        },
        orderBy: { createdAt: "desc" },
      });

      // Map DB result to UI Incident interface
      incidents = dbIncidents.map((inc) => {
        const mainFix = inc.fixes[0];
        const mainCommit = inc.commits[0];

        return {
          id: inc.id,
          title: inc.title,
          severity: inc.severity.toLowerCase() as Severity,
          status: inc.status.toLowerCase() as Status,
          createdAt: inc.createdAt.toISOString(),
          lastSeenAt: inc.lastSeenAt ? inc.lastSeenAt.toISOString() : inc.createdAt.toISOString(),
          occurrenceCount: inc.occurrenceCount || 1,
          repo: inc.project?.name || "unknown/repo",
          errorMessage: inc.errorMessage,
          stackTrace: inc.stackFrames
            .sort((a, b) => a.order - b.order)
            .map((sf) => `at ${sf.functionName} (${sf.filePath}:${sf.lineNumber})`),
          aiSummary: inc.aiSummary || "",
          aiTags: inc.aiTags || [],
          triagedAt: inc.triagedAt ? inc.triagedAt.toISOString() : null,
          assignee: {
            id: inc.assignee?.id || "unassigned",
            name: inc.assignee?.name || "Unassigned",
            email: inc.assignee?.email || "",
            avatar: "",
          },
          rootCause: {
            commitHash: mainCommit?.hash || "N/A",
            confidenceScore: mainCommit?.confidenceScore || 0,
            reasoning: mainCommit?.reasoning || "",
            culpritCommit: mainCommit
              ? {
                  hash: mainCommit.hash,
                  author: mainCommit.author,
                  message: mainCommit.message,
                  timestamp: mainCommit.timestamp.toISOString(),
                }
              : undefined,
          },
          fix: {
            id: mainFix?.id,
            diff: mainFix?.diff || "",
            prUrl: mainFix?.prUrl || undefined,
            prDescription: mainFix?.prDescription || "",
            status: mainFix?.status?.toLowerCase() || "draft",
          },
          timeline: inc.auditLogs.map((log) => ({
            id: log.id,
            incidentId: inc.id,
            type: log.type,
            message: log.message,
            timestamp: log.createdAt.toLocaleTimeString(),
          })),
        };
      });
    } catch (err) {
      console.error("Database query error on dashboard:", err);
    }
  }

  return <DashboardClient initialIncidents={incidents} />;
}
