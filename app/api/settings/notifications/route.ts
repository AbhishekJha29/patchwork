import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth";

async function getOrgForUser(userEmail: string) {
  const orgMember = await db.orgMember.findFirst({
    where: { user: { email: userEmail } },
    include: { org: true },
  });
  return orgMember?.org || null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getOrgForUser(session.user.email);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    let settings = await db.notificationSettings.findUnique({
      where: { orgId: org.id },
    });

    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { orgId: org.id },
      });
    }

    const lastSuccessLog = await db.notificationLog.findFirst({
      where: { orgId: org.id, success: true },
      orderBy: { timestamp: "desc" },
    });

    const lastFailureLog = await db.notificationLog.findFirst({
      where: { orgId: org.id, success: false },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({
      settings,
      lastSuccessLog,
      lastFailureLog,
    });
  } catch (err: any) {
    console.error("[GET Notification Settings Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const org = await getOrgForUser(session.user.email);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      slackWebhookUrl,
      emailEnabled,
      slackEnabled,
      notifyCriticalIncident,
      notifyReviewOpened,
      notifyResolved,
    } = body;

    const updatedSettings = await db.notificationSettings.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        slackWebhookUrl: slackWebhookUrl || null,
        emailEnabled: Boolean(emailEnabled),
        slackEnabled: Boolean(slackEnabled),
        notifyCriticalIncident: notifyCriticalIncident ?? true,
        notifyReviewOpened: notifyReviewOpened ?? true,
        notifyResolved: notifyResolved ?? true,
      },
      update: {
        slackWebhookUrl: slackWebhookUrl ?? null,
        emailEnabled: Boolean(emailEnabled),
        slackEnabled: Boolean(slackEnabled),
        notifyCriticalIncident: notifyCriticalIncident ?? true,
        notifyReviewOpened: notifyReviewOpened ?? true,
        notifyResolved: notifyResolved ?? true,
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (err: any) {
    console.error("[POST Notification Settings Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
