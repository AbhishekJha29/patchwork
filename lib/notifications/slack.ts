import { IncidentEvent } from "@/lib/events/events";
import { NotificationSettings } from "@prisma/client";
import { NotificationProvider, NotificationResult } from "./provider";

export const slackProvider: NotificationProvider = {
  name: "SLACK",

  async send(event: IncidentEvent, settings: NotificationSettings): Promise<NotificationResult> {
    const webhookUrl = settings.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return {
        success: false,
        recipient: undefined,
        errorMessage: "Slack Incoming Webhook URL is not configured.",
      };
    }

    if (event.type !== "TEST_SLACK" && !settings.slackEnabled) {
      return {
        success: false,
        recipient: webhookUrl,
        errorMessage: "Slack notifications are disabled in settings.",
      };
    }

    // Check per-event toggle rules
    const incident = event.payload.incident;
    if (event.type === "INCIDENT_CREATED" || event.type === "INCIDENT_STATUS_CHANGED") {
      if (incident.severity === "CRITICAL" && !settings.notifyCriticalIncident) {
        return {
          success: false,
          recipient: webhookUrl,
          errorMessage: "Notifications for CRITICAL incidents are disabled.",
        };
      }
    }

    if (event.type === "HOTFIX_PR_OPENED") {
      if (!settings.notifyReviewOpened) {
        return {
          success: false,
          recipient: webhookUrl,
          errorMessage: "Notifications for PR review opened are disabled.",
        };
      }
    }

    if (event.type === "INCIDENT_RESOLVED" || (event.type === "INCIDENT_STATUS_CHANGED" && event.payload.toStatus === "RESOLVED")) {
      if (!settings.notifyResolved) {
        return {
          success: false,
          recipient: webhookUrl,
          errorMessage: "Notifications for resolved incidents are disabled.",
        };
      }
    }

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const incidentUrl = `${appUrl}/incidents/${incident.id}`;

    // Build Block Kit payload
    let titleText = `*${incident.title}*`;
    let subtitleText = `Severity: *${incident.severity}* | Status: *${incident.status}*`;

    if (event.type === "HOTFIX_PR_OPENED") {
      titleText = `🚀 *Hotfix PR Opened for Incident ${incident.id}*`;
      subtitleText = `PR URL: ${event.payload.prUrl} | Branch: \`${event.payload.branchName}\``;
    } else if (event.type === "INCIDENT_RESOLVED") {
      titleText = `✅ *Incident Resolved: ${incident.title}*`;
    } else if (event.type === "INCIDENT_ASSIGNED") {
      titleText = `👤 *Incident Assigned to ${event.payload.assignee.name || event.payload.assignee.email}*`;
    } else if (event.type === "TEST_SLACK") {
      titleText = `🧪 *Test Notification from Patchwork AI*`;
      subtitleText = `Slack integration is successfully connected and working properly!`;
    }

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 Patchwork Incident Alert`,
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${titleText}\n${subtitleText}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Incident Detail",
              emoji: true,
            },
            url: incidentUrl,
            style: "primary",
          },
        ],
      },
    ];

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });

      if (!response.ok) {
        const text = await response.text();
        return {
          success: false,
          recipient: webhookUrl,
          errorMessage: `Slack webhook responded with status ${response.status}: ${text}`,
        };
      }

      return {
        success: true,
        recipient: webhookUrl,
      };
    } catch (err: any) {
      return {
        success: false,
        recipient: webhookUrl,
        errorMessage: err?.message || "Failed to reach Slack webhook URL",
      };
    }
  },
};
