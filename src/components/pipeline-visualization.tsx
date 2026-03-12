"use client";

import type { Issue, IssueStatus, Confidence } from "@/lib/types";
import {
  Bot,
  Search,
  GitBranch,
  UserCheck,
  Code,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Zap,
  ArrowRight,
} from "lucide-react";

interface PipelineStage {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  state: "completed" | "active" | "upcoming" | "skipped";
}

function derivePipelineStages(issue: Issue): PipelineStage[] {
  const status = issue.status;
  const confidence = issue.scopingReport?.confidence;
  const isHighConfidence = confidence === "high";
  const hasScoping = !!issue.scopingReport;

  // Terminal state
  if (status === "wont_fix") {
    return [
      stage("intake", "Intake", "Received", <Bot className="w-4 h-4" />, "completed"),
      stage("wont_fix", "Won't Fix", "Closed", <XCircle className="w-4 h-4" />, "active"),
    ];
  }

  const stages: PipelineStage[] = [];

  // 1. Intake
  stages.push(
    stage("intake", "Intake", "Received", <Bot className="w-4 h-4" />,
      status === "untriaged" ? "active" : "completed"
    )
  );

  // 2. Agent Scoping
  stages.push(
    stage("scoping", "Agent Scoping", scopingSublabel(issue), <Search className="w-4 h-4" />,
      status === "scoping" ? "active"
        : status === "untriaged" ? "upcoming"
        : "completed"
    )
  );

  // 3. Confidence Gate
  stages.push(
    stage("confidence", "Confidence Gate", confidence ? confidenceLabel(confidence) : "Routing",
      <GitBranch className="w-4 h-4" />,
      hasScoping && status !== "scoping" && status !== "untriaged" ? "completed"
        : status === "scoping" || status === "untriaged" ? "upcoming"
        : "upcoming"
    )
  );

  // 4. Human Review (only for medium/low confidence)
  if (!isHighConfidence || status === "ready") {
    stages.push(
      stage("review", "Engineer Review", reviewSublabel(issue), <UserCheck className="w-4 h-4" />,
        status === "ready" ? "active"
          : ["in_progress", "in_review", "resolved"].includes(status) && !isHighConfidence ? "completed"
          : "upcoming"
      )
    );
  } else if (isHighConfidence && status !== "untriaged" && status !== "scoping") {
    // High confidence: show auto-dispatch instead
    stages.push(
      stage("auto_dispatch", "Auto-dispatched", "High confidence", <Zap className="w-4 h-4" />, "completed")
    );
  }

  // 5. Implementation
  stages.push(
    stage("implementation", "Implementation", implSublabel(issue), <Code className="w-4 h-4" />,
      status === "in_progress" ? "active"
        : ["in_review", "resolved"].includes(status) ? "completed"
        : "upcoming"
    )
  );

  // 6. PR Review
  stages.push(
    stage("pr_review", "PR Review", "Engineer", <GitPullRequest className="w-4 h-4" />,
      status === "in_review" ? "active"
        : status === "resolved" ? "completed"
        : "upcoming"
    )
  );

  // 7. Resolved
  stages.push(
    stage("resolved", "Resolved", "Merged", <CheckCircle2 className="w-4 h-4" />,
      status === "resolved" ? "active" : "upcoming"
    )
  );

  return stages;
}

function stage(id: string, label: string, sublabel: string, icon: React.ReactNode, state: PipelineStage["state"]): PipelineStage {
  return { id, label, sublabel, icon, state };
}

function scopingSublabel(issue: Issue): string {
  if (issue.status === "scoping") {
    const labels = issue.labels.map(l => l.toLowerCase());
    const isBug = labels.some(l => l.includes("bug")) || issue.title.toLowerCase().includes("bug");
    return isBug ? "Bug triage" : "Feature analysis";
  }
  if (issue.scopingReport) return "Complete";
  return "Pending";
}

function confidenceLabel(confidence: Confidence): string {
  return `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence`;
}

function reviewSublabel(issue: Issue): string {
  if (issue.status === "ready") return "Awaiting approval";
  if (["in_progress", "in_review", "resolved"].includes(issue.status)) return "Approved";
  return "Pending";
}

function implSublabel(issue: Issue): string {
  if (issue.status === "in_progress") return "Devin working";
  if (["in_review", "resolved"].includes(issue.status)) return "Complete";
  return "Pending";
}

// --- Styles ---

const stateStyles: Record<PipelineStage["state"], {
  node: string;
  icon: string;
  label: string;
  sublabel: string;
  connector: string;
  ring: string;
}> = {
  completed: {
    node: "bg-emerald-500/10 border-emerald-500/30",
    icon: "text-emerald-400",
    label: "text-emerald-400/80",
    sublabel: "text-emerald-400/50",
    connector: "bg-emerald-500/40",
    ring: "",
  },
  active: {
    node: "bg-emerald-500/20 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
    icon: "text-emerald-300",
    label: "text-emerald-300 font-semibold",
    sublabel: "text-emerald-400/70",
    connector: "bg-emerald-500/40",
    ring: "ring-2 ring-emerald-400/30 ring-offset-1 ring-offset-background",
  },
  upcoming: {
    node: "bg-muted/20 border-border/50",
    icon: "text-muted-foreground/30",
    label: "text-muted-foreground/40",
    sublabel: "text-muted-foreground/25",
    connector: "bg-border/40",
    ring: "",
  },
  skipped: {
    node: "bg-muted/10 border-border/30 opacity-40",
    icon: "text-muted-foreground/20",
    label: "text-muted-foreground/30 line-through",
    sublabel: "text-muted-foreground/20",
    connector: "bg-border/20",
    ring: "",
  },
};

function PipelineNode({ stage: s, compact }: { stage: PipelineStage; compact?: boolean }) {
  const styles = stateStyles[s.state];
  const nodeSize = compact ? "w-7 h-7" : "w-9 h-9";
  const iconSize = compact ? "[&>svg]:w-3 [&>svg]:h-3" : "";
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className={`${nodeSize} rounded-full border flex items-center justify-center ${styles.node} ${styles.ring} transition-all duration-300`}>
        <span className={`${styles.icon} ${iconSize}`}>{s.icon}</span>
      </div>
      <span className={`text-[10px] leading-tight text-center whitespace-nowrap ${styles.label}`}>
        {s.label}
      </span>
      {!compact && s.sublabel && (
        <span className={`text-[9px] leading-tight text-center whitespace-nowrap -mt-0.5 ${styles.sublabel}`}>
          {s.sublabel}
        </span>
      )}
    </div>
  );
}

function Connector({ from, compact }: { from: PipelineStage["state"]; to: PipelineStage["state"]; compact?: boolean }) {
  const filled = from === "completed" || from === "active";
  return (
    <div className={`flex items-center flex-1 min-w-2 max-w-8 ${compact ? "-mt-3" : "-mt-5"}`}>
      <div className={`h-px w-full ${filled ? stateStyles.completed.connector : stateStyles.upcoming.connector} transition-all duration-300`} />
    </div>
  );
}

// --- Pulse animation for active stage ---

function PulseIndicator() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

// --- Main Component ---

export function PipelineVisualization({ issue, compact }: { issue: Issue; compact?: boolean }) {
  const stages = derivePipelineStages(issue);
  const activeStage = stages.find(s => s.state === "active");

  return (
    <div className={compact ? "px-5 py-3 border-t border-border/30 bg-muted/5" : "px-8 py-4 border-b border-border/50"}>
      {/* Active stage callout */}
      {activeStage && (
        <div className="flex items-center gap-2 mb-2">
          <PulseIndicator />
          <span className="text-[11px] font-medium text-emerald-400/80">
            {activeStage.label}
          </span>
          {activeStage.sublabel && (
            <>
              <span className="text-[10px] text-muted-foreground/30">—</span>
              <span className="text-[10px] text-muted-foreground/50">{activeStage.sublabel}</span>
            </>
          )}
        </div>
      )}

      {/* Pipeline */}
      <div className="flex items-start gap-1 overflow-x-auto pb-1">
        {stages.map((s, idx) => (
          <div key={s.id} className="contents">
            <PipelineNode stage={s} compact={compact} />
            {idx < stages.length - 1 && (
              <Connector from={s.state} to={stages[idx + 1].state} compact={compact} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
