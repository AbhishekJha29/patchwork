import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { keyId } = body;

    if (!keyId || typeof keyId !== "string") {
      return NextResponse.json(
        { error: "API Key ID is required" },
        { status: 400 }
      );
    }

    // Verify key belongs to user's org
    const existingKey = await db.apiKey.findFirst({
      where: {
        id: keyId,
        project: {
          org: {
            members: {
              some: {
                user: { email: session.user.email },
              },
            },
          },
        },
      },
    });

    if (!existingKey) {
      return NextResponse.json(
        { error: "API Key not found or permission denied" },
        { status: 404 }
      );
    }

    const updatedKey = await db.apiKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    return NextResponse.json({
      success: true,
      keyId: updatedKey.id,
      revoked: updatedKey.revoked,
    });
  } catch (error: any) {
    console.error("Failed to revoke API key:", error);
    return NextResponse.json(
      { error: "Internal server error revoking API key" },
      { status: 500 }
    );
  }
}
