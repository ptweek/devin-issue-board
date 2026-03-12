import type { Issue as PrismaIssue, ScopingReport as PrismaScopingReport, ActivityEvent as PrismaActivityEvent } from "@/generated/prisma/client";
import { differenceInDays } from "date-fns";

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    // Legacy plain-text findings — wrap in a compatible structure
    return value;
  }
}

export function serializeIssue(issue: PrismaIssue & { scopingReport?: PrismaScopingReport | null; activityEvents?: PrismaActivityEvent[] }) {
  const now = new Date();
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    complexity: issue.complexity,
    sourceUrl: issue.sourceUrl,
    repo: issue.repo,
    labels: JSON.parse(issue.labels),
    assignee: issue.assignee,
    prUrl: issue.prUrl,
    scopingSessionId: issue.scopingSessionId,
    implementSessionId: issue.implementSessionId,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
    staleDays: differenceInDays(now, issue.updatedAt),
    ...(issue.scopingReport !== undefined && {
      scopingReport: issue.scopingReport ? serializeScopingReport(issue.scopingReport) : null,
    }),
    ...(issue.activityEvents !== undefined && {
      activityEvents: issue.activityEvents.map(serializeActivityEvent),
    }),
  };
}

export function serializeScopingReport(report: PrismaScopingReport) {
  return {
    id: report.id,
    issueId: report.issueId,
    summary: report.summary,
    affectedFiles: JSON.parse(report.affectedFiles),
    rootCauseHypothesis: report.rootCauseHypothesis,
    suggestedApproach: report.suggestedApproach,
    estimatedEffort: report.estimatedEffort,
    datadogFindings: report.datadogFindings ? tryParseJson(report.datadogFindings) : null,
    dataLayerFindings: report.dataLayerFindings ? tryParseJson(report.dataLayerFindings) : null,
    confidence: report.confidence,
    openQuestions: JSON.parse(report.openQuestions),
    createdAt: report.createdAt.toISOString(),
  };
}

export function serializeActivityEvent(event: PrismaActivityEvent) {
  return {
    id: event.id,
    issueId: event.issueId,
    eventType: event.eventType,
    actor: event.actor,
    message: event.message,
    metadata: JSON.parse(event.metadata),
    createdAt: event.createdAt.toISOString(),
  };
}
