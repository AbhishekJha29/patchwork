import { db } from "@/lib/db";
import { IncidentEvent } from "./events";
import { dispatchNotifications } from "@/lib/notifications/dispatcher";

/**
 * Emits an event in a non-blocking, fire-and-forget manner.
 * Lookups Org NotificationSettings and invokes notification providers.
 * Catches all errors internally to guarantee non-blocking workflow.
 */
export function emitEvent(event: IncidentEvent): void {
  // Execute async IIFE without awaiting
  (async () => {
    try {
      const orgId = event.payload.org?.id;
      if (!orgId) {
        console.warn(`[Event Dispatcher] Event ${event.type} missing org ID, skipping notifications.`);
        return;
      }

      let settings = await db.notificationSettings.findUnique({
        where: { orgId },
      });

      if (!settings) {
        settings = await db.notificationSettings.create({
          data: { orgId },
        });
      }

      await dispatchNotifications(event, settings);
    } catch (err: any) {
      console.error(`[Event Dispatcher] Non-blocking error handling event ${event.type}:`, err);
      // Attempt logging to NotificationLog if orgId exists
      try {
        const orgId = event.payload.org?.id;
        if (orgId) {
          await db.notificationLog.create({
            data: {
              orgId,
              provider: "SLACK",
              eventType: event.type,
              success: false,
              errorMessage: err?.message || "Unhandled error in event dispatcher",
            },
          });
        }
      } catch (logErr) {
        // Silently swallow
      }
    }
  })();
}
