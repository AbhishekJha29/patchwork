import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { transitionIncident } from "@/lib/workflow/status";
import { Status } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getAuthSession();
    const actorId = session?.user?.id || session?.user?.email || "user";
    const body = await req.json();

    const { status, reason } = body;
    if (!status) {
      return NextResponse.json(
        { error: "Status field is required." },
        { status: 400 }
      );
    }

    const updated = await transitionIncident(
      params.id,
      status as Status,
      actorId,
      reason
    );

    return NextResponse.json({ success: true, incident: updated });
  } catch (err: any) {
    console.error(`[API Status Transition Error]`, err);
    return NextResponse.json(
      { error: err?.message || "Failed to transition incident status." },
      { status: 400 }
    );
  }
}
