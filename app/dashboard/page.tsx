import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { WorkspaceLayout } from "@/components/WorkspaceLayout";
import { Incident, Severity, Status, ConnectedRepo, OrgMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getAuthSession();

  let incidents: Incident[] = [];
  let projects: ConnectedRepo[] = [];
  let teamMembers: OrgMember[] = [];
  let apiKeys: any[] = [];

  if (session?.user?.email) {
    try {
      const userOrgMember = await db.orgMember.findFirst({
        where: {
          user: {
            email: session.user.email,
          },
        },
        include: {
          org: {
            include: {
              projects: {
                include: {
                  incidents: true,
                },
              },
              members: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (userOrgMember?.org) {
        projects = userOrgMember.org.projects.map((p) => ({
          id: p.id,
          name: p.name,
          owner: p.name.split("/")[0] || "org",
          branch: "main",
          repoUrl: p.repoUrl,
          deploymentTrackingEnabled: p.deploymentTrackingEnabled,
          status: "connected",
          lastSynced: p.createdAt.toLocaleDateString(),
          incidentsCount: p.incidents.length,
        }));

        teamMembers = userOrgMember.org.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          orgId: m.orgId,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user
            ? {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                createdAt: m.user.createdAt.toISOString(),
              }
            : undefined,
        }));

        const dbApiKeys = await db.apiKey.findMany({
          where: {
            project: {
              orgId: userOrgMember.org.id,
            },
          },
          include: {
            project: true,
          },
          orderBy: { createdAt: "desc" },
        });

        apiKeys = dbApiKeys.map((k) => ({
          id: k.id,
          name: k.name,
          projectId: k.projectId,
          projectName: k.project.name,
          keyPrefix: `pw_live_...${k.key.slice(-4)}`,
          createdAt: k.createdAt.toLocaleDateString(),
          lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toLocaleString() : "Never",
          revoked: k.revoked,
        }));
      }

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

  return (
    <WorkspaceLayout
      initialIncidents={incidents}
      initialProjects={projects}
      initialTeamMembers={teamMembers}
      initialApiKeys={apiKeys}
    />
  );
}
