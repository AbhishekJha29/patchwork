import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { emailProvider } from "@/lib/notifications/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const recipientEmail = body.recipientEmail || session.user.email;

    const orgMember = await db.orgMember.findFirst({
      where: { user: { email: session.user.email } },
      include: { org: true },
    });

    if (!orgMember?.org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const settings = await db.notificationSettings.findUnique({
      where: { orgId: orgMember.org.id },
    });

    if (!settings) {
      return NextResponse.json({ error: "Notification settings not found." }, { status: 404 });
    }

    const testIncident: any = {
      id: "inc_test_email",
      title: "Test Email Alert from Patchwork Settings",
      severity: "CRITICAL",
      status: "DETECTED",
    };

    const testEvent: any = {
      type: "TEST_EMAIL",
      payload: {
        incident: testIncident,
        org: orgMember.org,
        recipientEmail,
      },
    };

    const result = await emailProvider.send(testEvent, settings);

    // Save NotificationLog
    const log = await db.notificationLog.create({
      data: {
        orgId: orgMember.org.id,
        provider: "EMAIL",
        eventType: "TEST_EMAIL",
        recipient: result.recipient || recipientEmail,
        success: result.success,
        errorMessage: result.errorMessage || null,
      },
    });

    return NextResponse.json({
      success: result.success,
      errorMessage: result.errorMessage,
      log,
    });
  } catch (err: any) {
    console.error("[Test Email Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send test email notification" },
      { status: 500 }
    );
  }
}
