import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgMember = await db.orgMember.findFirst({
      where: { user: { email: session.user.email } },
      include: {
        org: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!orgMember?.org) {
      return NextResponse.json({ members: [] });
    }

    const users = orgMember.org.members.map((m) => ({
      id: m.user.id,
      name: m.user.name || m.user.email,
      email: m.user.email,
    }));

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error("[GET Org Members Error]", err);
    return NextResponse.json({ error: err?.message || "Failed to fetch members" }, { status: 500 });
  }
}
