import { db } from "@/lib/db";
import { Status } from "@prisma/client";
import { emitEvent } from "@/lib/events/dispatcher";

export const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  DETECTED: ["TRIAGED"],
  TRIAGED: ["ANALYZING", "DETECTED"],
  ANALYZING: ["FIX_GENERATED", "IN_REVIEW", "TRIAGED"],
  FIX_GENERATED: ["IN_REVIEW"],
  IN_REVIEW: ["DEPLOYED", "RESOLVED"],
  DEPLOYED: ["RESOLVED"],
  RESOLVED: [],
};

export function canTransition(from: Status, to: Status): boolean {
  if (from === to) return true;
  const validNextStates = ALLOWED_TRANSITIONS[from] || [];
  return validNextStates.includes(to);
}

export async function transitionIncident(
  incidentId: string,
  newStatus: Status,
  actorId: string,
  reason?: string
) {
  const incident = await db.incident.findUnique({
    where: { id: incidentId },
    include: {
      project: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error(`Incident with ID ${incidentId} not found.`);
  }

  const fromStatus = incident.status;

  if (fromStatus !== newStatus && !canTransition(fromStatus, newStatus)) {
    throw new Error(`Invalid status transition from ${fromStatus} to ${newStatus}.`);
  }

  if (fromStatus === newStatus) {
    return incident;
  }

  // Determine actor display name
  let actorLabel = "System";
  if (actorId && actorId !== "system") {
    const actorUser = await db.user.findUnique({
      where: { id: actorId },
    });
    if (actorUser) {
      actorLabel = actorUser.name || actorUser.email;
    } else {
      actorLabel = actorId;
    }
  }

  // 1. Update Incident status in DB
  const updatedIncident = await db.incident.update({
    where: { id: incidentId },
    data: {
      status: newStatus,
    },
    include: {
      project: {
        include: {
          org: true,
        },
      },
    },
  });

  // 2. Create AuditLog entry
  const logMessage = reason
    ? `Status changed from ${fromStatus} to ${newStatus} by ${actorLabel}: ${reason}`
    : `Status changed from ${fromStatus} to ${newStatus} by ${actorLabel}`;

  await db.auditLog.create({
    data: {
      incidentId,
      type: "STATUS_CHANGE",
      message: logMessage,
    },
  });

  // 3. Emit non-blocking event
  const org = updatedIncident.project.org;

  emitEvent({
    type: "INCIDENT_STATUS_CHANGED",
    payload: {
      incident: updatedIncident,
      org,
      fromStatus,
      toStatus: newStatus,
      actorId,
    },
  });

  if (newStatus === "RESOLVED") {
    emitEvent({
      type: "INCIDENT_RESOLVED",
      payload: {
        incident: updatedIncident,
        org,
        actorId,
      },
    });
  }

  return updatedIncident;
}
