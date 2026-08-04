import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { SettingsClient } from "./SettingsClient";
import { ConnectedRepo, OrgMember } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getAuthSession();

  let projects: ConnectedRepo[] = [];
  let teamMembers: OrgMember[] = [];
  let apiKeys: any[] = [];

  if (session?.user?.email) {
    try {
      // Find the user's active organization
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
        // Map database projects to ConnectedRepo format
        projects = userOrgMember.org.projects.map((p) => ({
          id: p.id,
          name: p.name,
          owner: p.name.split("/")[0] || "org",
          branch: "main",
          status: "connected",
          lastSynced: p.createdAt.toLocaleDateString(),
          incidentsCount: p.incidents.length,
        }));

        // Map database org members to OrgMember format
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

        // Query database API keys for org projects
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
    } catch (err) {
      console.error("Failed to query settings data from DB:", err);
    }
  }

  return (
    <SettingsClient
      initialProjects={projects}
      initialTeamMembers={teamMembers}
      initialApiKeys={apiKeys}
    />
  );
}
