import { db } from "@/lib/db";
import { IncidentEvent } from "@/lib/events/events";
import { NotificationSettings } from "@prisma/client";
import { slackProvider } from "./slack";
import { emailProvider } from "./email";
import { NotificationProvider } from "./provider";

const providers: NotificationProvider[] = [slackProvider, emailProvider];

export async function dispatchNotifications(
  event: IncidentEvent,
  settings: NotificationSettings
): Promise<void> {
  const incidentId = event.payload.incident.id;
  const orgId = settings.orgId;

  for (const provider of providers) {
    try {
      const result = await provider.send(event, settings);

      // Write NotificationLog entry per attempt
      await db.notificationLog.create({
        data: {
          orgId,
          provider: provider.name,
          eventType: event.type,
          recipient: result.recipient || null,
          success: result.success,
          errorMessage: result.errorMessage || null,
        },
      });

      // Write AuditLog entry so notifications appear in incident timeline
      if (result.success && incidentId) {
        await db.auditLog.create({
          data: {
            incidentId,
            type: "NOTIFICATION_SENT",
            message: `Notification sent via ${provider.name}${result.recipient ? ` to ${result.recipient}` : ""}`,
          },
        });
      }
    } catch (err: any) {
      console.error(`[Notification Dispatcher] Error delivering ${provider.name} notification:`, err);
      try {
        await db.notificationLog.create({
          data: {
            orgId,
            provider: provider.name,
            eventType: event.type,
            recipient: null,
            success: false,
            errorMessage: err?.message || "Unexpected error during notification delivery",
          },
        });
      } catch (logErr) {
        console.error("[Notification Dispatcher] Failed to write NotificationLog entry:", logErr);
      }
    }
  }
}
