import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { deploymentTrackingEnabled } = body;

    const updatedProject = await db.project.update({
      where: { id: params.id },
      data: {
        deploymentTrackingEnabled: Boolean(deploymentTrackingEnabled),
      },
    });

    return NextResponse.json({ success: true, project: updatedProject });
  } catch (err: any) {
    console.error("[PATCH Project Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update project settings" },
      { status: 500 }
    );
  }
}
