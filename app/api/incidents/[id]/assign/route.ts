import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { assignIncident } from "@/lib/workflow/assignment";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    const assignedById = session?.user?.id || session?.user?.email || "user";
    const body = await req.json();

    const { assigneeId } = body; // can be string or null

    const updated = await assignIncident(
      params.id,
      assigneeId || null,
      assignedById
    );

    return NextResponse.json({ success: true, incident: updated });
  } catch (err: any) {
    console.error(`[API Incident Assignment Error]`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to assign incident." },
      { status: 400 }
    );
  }
}
