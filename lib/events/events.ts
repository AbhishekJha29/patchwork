import { Incident, Org, User } from "@prisma/client";

export type IncidentEventType =
  | "INCIDENT_CREATED"
  | "INCIDENT_STATUS_CHANGED"
  | "HOTFIX_PR_OPENED"
  | "PR_MERGED"
  | "INCIDENT_AUTO_RESOLVED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_ASSIGNED"
  | "TEST_SLACK"
  | "TEST_EMAIL";

export interface IncidentCreatedEvent {
  type: "INCIDENT_CREATED";
  payload: {
    incident: Incident;
    org: Org;
  };
}

export interface IncidentStatusChangedEvent {
  type: "INCIDENT_STATUS_CHANGED";
  payload: {
    incident: Incident;
    org: Org;
    fromStatus: string;
    toStatus: string;
    actorId: string;
  };
}

export interface HotfixPrOpenedEvent {
  type: "HOTFIX_PR_OPENED";
  payload: {
    incident: Incident;
    org: Org;
    prUrl: string;
    branchName: string;
  };
}

export interface PrMergedEvent {
  type: "PR_MERGED";
  payload: {
    incident: Incident;
    org: Org;
    prNumber?: number;
    prUrl?: string;
  };
}

export interface IncidentAutoResolvedEvent {
  type: "INCIDENT_AUTO_RESOLVED";
  payload: {
    incident: Incident;
    org: Org;
    reason: string;
  };
}

export interface IncidentResolvedEvent {
  type: "INCIDENT_RESOLVED";
  payload: {
    incident: Incident;
    org: Org;
    actorId: string;
  };
}

export interface IncidentAssignedEvent {
  type: "INCIDENT_ASSIGNED";
  payload: {
    incident: Incident;
    org: Org;
    assignee: User;
    assignedBy: string;
  };
}

export interface TestSlackEvent {
  type: "TEST_SLACK";
  payload: {
    incident: Incident;
    org: Org;
  };
}

export interface TestEmailEvent {
  type: "TEST_EMAIL";
  payload: {
    incident: Incident;
    org: Org;
    recipientEmail: string;
  };
}

export type IncidentEvent =
  | IncidentCreatedEvent
  | IncidentStatusChangedEvent
  | HotfixPrOpenedEvent
  | PrMergedEvent
  | IncidentAutoResolvedEvent
  | IncidentResolvedEvent
  | IncidentAssignedEvent
  | TestSlackEvent
  | TestEmailEvent;
