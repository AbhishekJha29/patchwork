import { NextResponse } from "next/server";
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
            projects: {
              include: {
                incidents: true,
              },
            },
          },
        },
      },
    });

    if (!userOrgMember?.org) {
      return NextResponse.json({ projects: [] });
    }

    return NextResponse.json({ projects: userOrgMember.org.projects });
  } catch (error: any) {
    console.error("Failed to fetch projects:", error);
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

    const userOrgMember = await db.orgMember.findFirst({
      where: { user: { email: session.user.email } },
    });

    const orgId = userOrgMember?.orgId;
    console.log("Resolved orgId for repo creation:", orgId);

    if (!orgId) {
      console.error("Failed to resolve orgId for user:", session.user.email);
      return NextResponse.json(
        { error: "Organization not found for current user session" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, repoUrl } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Repository name is required" },
        { status: 400 }
      );
    }

    const sanitizedName = name.trim();
    const sanitizedRepoUrl =
      repoUrl && typeof repoUrl === "string" && repoUrl.trim()
        ? repoUrl.trim()
        : `https://github.com/${sanitizedName}`;

    try {
      const project = await db.project.create({
        data: {
          name: sanitizedName,
          repoUrl: sanitizedRepoUrl,
          orgId: orgId,
        },
      });

      console.log("Successfully created project in DB:", project);

      return NextResponse.json({ project }, { status: 201 });
    } catch (createError: any) {
      console.error("Prisma project.create error:", createError);
      return NextResponse.json(
        { error: createError?.message || "Failed to insert repository into database" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Failed to connect repository:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error connecting repository" },
      { status: 500 }
    );
  }
}
