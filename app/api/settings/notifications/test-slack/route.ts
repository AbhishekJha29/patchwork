import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";
import { slackProvider } from "@/lib/notifications/slack";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Mock test incident
    const testIncident: any = {
      id: "inc_test_slack",
      title: "Test Slack Alert from Patchwork Settings",
      severity: "HIGH",
      status: "TRIAGED",
    };

    const testEvent: any = {
      type: "TEST_SLACK",
      payload: {
        incident: testIncident,
        org: orgMember.org,
      },
    };

    const result = await slackProvider.send(testEvent, settings);

    // Save NotificationLog
    const log = await db.notificationLog.create({
      data: {
        orgId: orgMember.org.id,
        provider: "SLACK",
        eventType: "TEST_SLACK",
        recipient: result.recipient || settings.slackWebhookUrl || null,
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
    console.error("[Test Slack Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send test Slack notification" },
      { status: 500 }
    );
  }
}
