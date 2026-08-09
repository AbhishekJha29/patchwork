export type Severity = "critical" | "high" | "medium" | "low";

export type Status =
  | "detected"
  | "triaged"
  | "analyzing"
  | "fix_generated"
  | "in_review"
  | "deployed"
  | "resolved";

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role?: string;
}

export interface Commit {
  id?: string;
  hash: string;
  author: string;
  authorAvatar?: string;
  message: string;
  timestamp: string;
  filesChanged?: string[];
  confidenceScore?: number;
  reasoning?: string;
}

export interface RootCauseAnalysis {
  commitHash: string;
  confidenceScore: number; // 0 to 100
  reasoning: string;
  culpritCommit?: Commit;
}

export interface Fix {
  id?: string;
  diff: string;
  prUrl?: string;
  prNumber?: number;
  prTitle?: string;
  prDescription: string;
  branchName?: string;
  mergedAt?: string | null;
  deployedAt?: string | null;
  status: "draft" | "pr_opened" | "failed" | "created" | "merged" | "applied" | string;
}

export interface TimelineEvent {
  id: string;
  incidentId: string;
  type: "system" | "ai" | "user" | "action" | string;
  message: string;
  timestamp: string;
  statusBadge?: Status;
  actor?: {
    name: string;
    avatar?: string;
  };
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: Status;
  createdAt: string;
  lastSeenAt?: string;
  occurrenceCount?: number;
  repo: string;
  errorMessage: string;
  stackTrace: string[];
  aiSummary: string;
  aiTags?: string[];
  triagedAt?: string | null;
  assignee: Assignee;
  rootCause: RootCauseAnalysis;
  fix: Fix;
  timeline: TimelineEvent[];
}

export interface ConnectedRepo {
  id: string;
  name: string;
  owner: string;
  branch: string;
  repoUrl?: string;
  deploymentTrackingEnabled?: boolean;
  status: "connected" | "syncing" | "error" | string;
  lastSynced: string;
  incidentsCount: number;
}

export interface ErrorSource {
  id: string;
  name: string;
  type: "sentry" | "datadog" | "pagerduty" | "aws_cloudwatch" | "custom_webhook";
  iconUrl?: string;
  status: "active" | "paused" | "disconnected";
  lastEventAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string;
}

// Phase 2 DB Entities
export interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: Date | string;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | string;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: Date | string;
  user?: User;
  org?: Org;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  repoUrl: string;
  createdAt: Date | string;
}
