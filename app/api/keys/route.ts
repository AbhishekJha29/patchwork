import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userOrgMember = await db.orgMember.findFirst({
      where: { user: { email: session.user.email } },
      include: {
        org: {
          include: {
            projects: true,
          },
        },
      },
    });

    if (!userOrgMember?.org) {
      return NextResponse.json({ keys: [] });
    }

    const projectIds = userOrgMember.org.projects.map((p) => p.id);

    const keys = await db.apiKey.findMany({
      where: { projectId: { in: projectIds } },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      projectId: k.projectId,
      projectName: k.project.name,
      keyMasked: `pw_live_...${k.key.slice(-4)}`,
      revoked: k.revoked,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : "Never",
    }));

    return NextResponse.json({ keys: formattedKeys });
  } catch (error: any) {
    console.error("Failed to fetch API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, projectId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Key name is required" },
        { status: 400 }
      );
    }

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project selection is required" },
        { status: 400 }
      );
    }

    // Verify project belongs to user's organization
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        org: {
          members: {
            some: {
              user: { email: session.user.email },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Invalid project or permission denied" },
        { status: 404 }
      );
    }

    // Generate secure key with pw_live_ prefix
    const randomHex = crypto.randomBytes(24).toString("hex");
    const rawKey = `pw_live_${randomHex}`;

    const createdKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        projectId: project.id,
        key: rawKey,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json(
      {
        key: {
          id: createdKey.id,
          name: createdKey.name,
          projectId: createdKey.projectId,
          projectName: createdKey.project.name,
          rawKey: rawKey, // Returned ONCE for user copy
          keyMasked: `pw_live_...${rawKey.slice(-4)}`,
          revoked: createdKey.revoked,
          createdAt: createdKey.createdAt.toISOString(),
          lastUsedAt: "Never",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to generate API key:", error);
    return NextResponse.json(
      { error: "Internal server error generating API key" },
      { status: 500 }
    );
  }
}
