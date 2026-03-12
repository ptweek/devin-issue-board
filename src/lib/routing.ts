import type { Confidence, IssueStatus } from "@/lib/types";

export interface RoutingDecision {
  nextStatus: IssueStatus;
  assignee: string | null;
  autoDispatch: boolean;
}

export function routeAfterScoping(confidence: Confidence): RoutingDecision {
  if (confidence === "high") {
    return {
      nextStatus: "in_progress",
      assignee: "devin",
      autoDispatch: true,
    };
  }

  // Medium and low confidence: queue for human review
  return {
    nextStatus: "ready",
    assignee: null,
    autoDispatch: false,
  };
}
