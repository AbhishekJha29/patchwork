import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { parseOwnerRepo } from "@/lib/github/client";
import { transitionIncident } from "@/lib/workflow/status";
import { emitEvent } from "@/lib/events/dispatcher";

export async function POST(req: NextRequest) {
  try {
    // 1. Read RAW request body before any JSON parsing
    const rawBody = await req.text();

    // 2. Read signature header
    const signatureHeader = req.headers.get("x-hub-signature-256") || req.headers.get("X-Hub-Signature-256");
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) {
      console.warn("[GitHub Webhook] Missing signature header or GITHUB_WEBHOOK_SECRET.");
      return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 401 });
    }

    // 3. HMAC SHA-256 verification over raw body using timingSafeEqual
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const expectedSignature = "sha256=" + hmac.update(rawBody).digest("hex");

    const sigBuffer = Buffer.from(signatureHeader);
    const digestBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(sigBuffer, digestBuffer)) {
      console.warn("[GitHub Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 4. Parse payload only after signature verification succeeds
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (parseErr) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const githubEvent = req.headers.get("x-github-event") || req.headers.get("X-GitHub-Event");

    // We only care about pull_request closed & merged events
    if (githubEvent !== "pull_request") {
      return NextResponse.json({ message: `Ignored event: ${githubEvent}` }, { status: 200 });
    }

    if (payload.action !== "closed" || !payload.pull_request?.merged) {
      return NextResponse.json({ message: "PR closed without merge or action not closed" }, { status: 200 });
    }

    const prNumber = payload.pull_request.number;
    const repoFullName = payload.repository?.full_name; // e.g. "owner/repo"

    if (!prNumber || !repoFullName) {
      return NextResponse.json({ message: "Missing PR number or repository identity" }, { status: 200 });
    }

    const parsedWebhookRepo = parseOwnerRepo(repoFullName);
    if (!parsedWebhookRepo) {
      return NextResponse.json({ message: "Invalid repository format" }, { status: 200 });
    }

    // 5. Match Fix safely using BOTH prNumber AND repo identity
    const candidateFixes = await db.fix.findMany({
      where: {
        OR: [
          { prNumber: prNumber },
          { prUrl: { contains: `/pull/${prNumber}` } },
        ],
      },
      include: {
        incident: {
          include: {
            project: {
              include: {
                org: true,
              },
            },
          },
        },
      },
    });

    const matchingFix = candidateFixes.find((fix) => {
      const projectRepo = fix.incident.project.repoUrl;
      const parsedProjectRepo = parseOwnerRepo(projectRepo);
      if (!parsedProjectRepo) return false;
      return (
        parsedProjectRepo.owner.toLowerCase() === parsedWebhookRepo.owner.toLowerCase() &&
        parsedProjectRepo.repo.toLowerCase() === parsedWebhookRepo.repo.toLowerCase()
      );
    });

    if (!matchingFix) {
      console.log(`[GitHub Webhook] No matching Patchwork fix found for PR #${prNumber} in ${repoFullName}`);
      return NextResponse.json({ message: "No matching Patchwork fix found" }, { status: 200 });
    }

    // 6. IDEMPOTENCY CHECK - check Fix.mergedAt before doing anything else
    if (matchingFix.mergedAt !== null) {
      console.log(`[GitHub Webhook] Duplicate delivery detected for Fix ${matchingFix.id} (mergedAt already set). Skipping.`);
      return NextResponse.json({ message: "Webhook payload already processed (idempotent)" }, { status: 200 });
    }

    // 7. Update Fix record with mergedAt timestamp
    const now = new Date();
    await db.fix.update({
      where: { id: matchingFix.id },
      data: {
        mergedAt: now,
        prNumber: prNumber,
      },
    });

    const incident = matchingFix.incident;
    const project = incident.project;
    const org = project.org;

    // Emit PR_MERGED event
    emitEvent({
      type: "PR_MERGED",
      payload: {
        incident,
        org,
        prNumber,
        prUrl: matchingFix.prUrl || payload.pull_request.html_url,
      },
    });

    // Add AuditLog entry for PR Merged
    await db.auditLog.create({
      data: {
        incidentId: incident.id,
        type: "PR_MERGED",
        message: `PR #${prNumber} merged into default branch`,
      },
    });

    // 8. Resolution logic based on deploymentTrackingEnabled
    if (!project.deploymentTrackingEnabled) {
      // Direct resolution path: move IN_REVIEW -> RESOLVED
      const updatedIncident = await transitionIncident(
        incident.id,
        "RESOLVED",
        "system",
        "Resolved: fix merged (deploy tracking not configured)"
      );

      emitEvent({
        type: "INCIDENT_AUTO_RESOLVED",
        payload: {
          incident: updatedIncident,
          org,
          reason: "Automated resolution on PR merge (deployment tracking not enabled)",
        },
      });
    } else {
      // Deployment tracking path: move IN_REVIEW -> DEPLOYED (deployedAt stays null)
      await transitionIncident(
        incident.id,
        "DEPLOYED",
        "system",
        "Hotfix PR merged. Waiting for deployment confirmation."
      );
    }

    return NextResponse.json({ success: true, message: "PR merge processed successfully" });
  } catch (err: any) {
    console.error("[GitHub Webhook Receiver Error]", err);
    return NextResponse.json({ error: err?.message || "Internal webhook processing error" }, { status: 500 });
  }
}
