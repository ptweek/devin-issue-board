export type IssueStatus =
  | "untriaged"
  | "scoping"
  | "ready"
  | "in_progress"
  | "in_review"
  | "resolved"
  | "wont_fix";

export type Priority = "critical" | "high" | "medium" | "low" | "unprioritized";

export type Complexity = "trivial" | "small" | "medium" | "large" | "unknown";

export type Confidence = "high" | "medium" | "low";

export type EventType =
  | "status_change"
  | "agent_scoping_started"
  | "agent_scoping_complete"
  | "agent_fix_started"
  | "agent_fix_complete"
  | "comment"
  | "priority_change"
  | "assigned";

export interface Issue {
  id: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: Priority;
  complexity: Complexity;
  sourceUrl: string | null;
  repo: string;
  labels: string[];
  assignee: string | null;
  prUrl?: string | null;
  scopingSessionId?: string | null;
  implementSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  staleDays: number;
  scopingReport?: ScopingReport | null;
  activityEvents?: ActivityEvent[];
}

export interface DatadogFinding {
  type: "error" | "latency" | "trace" | "monitor" | "log";
  title: string;
  detail: string;
  severity?: "critical" | "warning" | "info";
  url?: string;
}

export interface DatadogSearch {
  query: string;
  url?: string;
}

export interface DatadogFindings {
  investigationRationale: string;
  searches?: (string | DatadogSearch)[];
  findings: DatadogFinding[];
  productionStatus: "ongoing" | "resolved" | "intermittent" | "unknown";
  impactOnScoping: string;
}

export interface DataLayerFinding {
  type: "schema" | "data" | "index" | "constraint" | "relationship";
  title: string;
  detail: string;
}

export interface DataLayerFindings {
  investigationRationale: string;
  modelsExamined?: string[];
  findings: DataLayerFinding[];
  schemaVsReality?: string | null;
  impactOnScoping: string;
}

export interface ScopingReport {
  id: string;
  issueId: string;
  summary: string;
  affectedFiles: string[];
  rootCauseHypothesis: string;
  suggestedApproach: string;
  estimatedEffort: string;
  datadogFindings: DatadogFindings | string | null;
  dataLayerFindings: DataLayerFindings | string | null;
  confidence: Confidence;
  openQuestions: string[];
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  issueId: string;
  eventType: EventType;
  actor: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Stats {
  byStatus: Record<IssueStatus, number>;
  byPriority: Record<Priority, number>;
  byComplexity: Record<Complexity, number>;
  totalIssues: number;
  staleOver30: number;
  staleOver7: number;
  avgStaleDays: number;
  agentActive: number;
  resolvedLast30: number;
}
