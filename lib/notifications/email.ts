import { IncidentEvent } from "@/lib/events/events";
import { NotificationSettings } from "@prisma/client";
import { NotificationProvider, NotificationResult } from "./provider";
import { Resend } from "resend";

export const emailProvider: NotificationProvider = {
  name: "EMAIL",

  async send(event: IncidentEvent, settings: NotificationSettings): Promise<NotificationResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        recipient: undefined,
        errorMessage: "RESEND_API_KEY is not configured.",
      };
    }

    if (event.type !== "TEST_EMAIL" && !settings.emailEnabled) {
      return {
        success: false,
        recipient: undefined,
        errorMessage: "Email notifications are disabled in settings.",
      };
    }

    const incident = event.payload.incident;

    // Check per-event settings
    if (event.type === "INCIDENT_CREATED" || event.type === "INCIDENT_STATUS_CHANGED") {
      if (incident.severity === "CRITICAL" && !settings.notifyCriticalIncident) {
        return {
          success: false,
          errorMessage: "Email notifications for CRITICAL incidents are disabled.",
        };
      }
    }

    if (event.type === "HOTFIX_PR_OPENED" && !settings.notifyReviewOpened) {
      return {
        success: false,
        errorMessage: "Email notifications for PR review opened are disabled.",
      };
    }

    if ((event.type === "INCIDENT_RESOLVED" || (event.type === "INCIDENT_STATUS_CHANGED" && event.payload.toStatus === "RESOLVED")) && !settings.notifyResolved) {
      return {
        success: false,
        errorMessage: "Email notifications for resolved incidents are disabled.",
      };
    }

    // Determine target recipient email address
    let recipientEmail: string | undefined;

    if (event.type === "TEST_EMAIL") {
      recipientEmail = event.payload.recipientEmail;
    } else if (event.type === "INCIDENT_ASSIGNED") {
      recipientEmail = event.payload.assignee.email;
    }

    if (!recipientEmail) {
      // Default notification email fallback or skip if no email address
      recipientEmail = process.env.NOTIFICATION_EMAIL || "admin@example.com";
    }

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const incidentUrl = `${appUrl}/incidents/${incident.id}`;

    const subject = event.type === "TEST_EMAIL"
      ? `[Patchwork] Test Notification`
      : `[Patchwork] ${event.type.replace("_", " ")}: ${incident.title}`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #090d16; color: #e2e8f0; border-radius: 12px; border: 1px solid #1e293b;">
        <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #38bdf8; margin: 0; font-size: 20px;">🚨 Patchwork Incident Alert</h2>
        </div>
        
        <h3 style="color: #f8fafc; margin-top: 0;">${incident.title}</h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #94a3b8; width: 120px;">Severity:</td>
            <td style="padding: 8px 0; color: #f43f5e; font-weight: bold;">${incident.severity}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Status:</td>
            <td style="padding: 8px 0; color: #38bdf8; font-weight: bold;">${incident.status}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #94a3b8;">Incident ID:</td>
            <td style="padding: 8px 0; color: #cbd5e1; font-mono">${incident.id}</td>
          </tr>
        </table>

        ${event.type === "HOTFIX_PR_OPENED" ? `
          <div style="background-color: #064e3b; border: 1px solid #059669; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #a7f3d0; font-size: 14px;">
              <strong>Hotfix PR Opened:</strong> <a href="${event.payload.prUrl}" style="color: #6ee7b7; text-decoration: underline;">View Pull Request</a>
            </p>
          </div>
        ` : ''}

        <div style="margin-top: 24px;">
          <a href="${incidentUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Open Incident in Patchwork
          </a>
        </div>
      </div>
    `;

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from: "Patchwork AI <onboarding@resend.dev>",
        to: [recipientEmail],
        subject,
        html: htmlContent,
      });

      if (error) {
        return {
          success: false,
          recipient: recipientEmail,
          errorMessage: error.message || "Failed to send email via Resend.",
        };
      }

      return {
        success: true,
        recipient: recipientEmail,
      };
    } catch (err: any) {
      return {
        success: false,
        recipient: recipientEmail,
        errorMessage: err?.message || "Failed to call Resend API.",
      };
    }
  },
};
