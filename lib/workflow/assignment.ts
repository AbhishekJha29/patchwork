import { db } from "@/lib/db";
import { emitEvent } from "@/lib/events/dispatcher";

export async function assignIncident(
  incidentId: string,
  assigneeId: string | null,
  assignedById: string
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

  // Get assignedBy user label
  let assignedByLabel = "System";
  if (assignedById && assignedById !== "system") {
    const assignerUser = await db.user.findUnique({
      where: { id: assignedById },
    });
    if (assignerUser) {
      assignedByLabel = assignerUser.name || assignerUser.email;
    } else {
      assignedByLabel = assignedById;
    }
  }

  let assignee = null;
  if (assigneeId) {
    assignee = await db.user.findUnique({
      where: { id: assigneeId },
    });
  }

  // Update Incident assignee in DB
  const updatedIncident = await db.incident.update({
    where: { id: incidentId },
    data: {
      assigneeId,
    },
    include: {
      assignee: true,
      project: {
        include: {
          org: true,
        },
      },
    },
  });

  const assigneeLabel = assignee ? (assignee.name || assignee.email) : "Unassigned";
  const logMessage = assigneeId
    ? `Incident assigned to ${assigneeLabel} by ${assignedByLabel}`
    : `Incident unassigned by ${assignedByLabel}`;

  await db.auditLog.create({
    data: {
      incidentId,
      type: "ASSIGNMENT",
      message: logMessage,
    },
  });

  if (assignee && updatedIncident.project?.org) {
    emitEvent({
      type: "INCIDENT_ASSIGNED",
      payload: {
        incident: updatedIncident,
        org: updatedIncident.project.org,
        assignee,
        assignedBy: assignedById,
      },
    });
  }

  return updatedIncident;
}
