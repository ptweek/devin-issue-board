"use client";

import {
  Inbox,
  Search,
  GitBranch,
  Zap,
  UserCheck,
  Pencil,
  Code,
  GitPullRequest,
  CheckCircle2,
  Bot,
  Bug,
  Lightbulb,
  ArrowDown,
} from "lucide-react";

// --- Types ---

interface WorkflowNode {
  id: string;
  label: string;
  description: string;
  details?: string[];
  icon: React.ReactNode;
  color: "emerald" | "amber" | "muted" | "blue";
  actor?: string;
}

// --- Data ---

const workflowNodes = {
  intake: {
    id: "intake",
    label: "Batch Send to Scoping",
    description: "Issues selected and dispatched to agent pipeline",
    details: [
      "Select issues from triage view",
      "Concurrent Devin sessions launched in parallel",
      "Each issue gets its own scoping agent",
    ],
    icon: <Inbox className="w-5 h-5" />,
    color: "muted" as const,
    actor: "Engineer",
  },
  bugTriage: {
    id: "bug_triage",
    label: "Bug Triage Workflow",
    description: "MCP-heavy investigation of the bug",
    details: [
      "Heavily dependent on MCP integrations",
      "References codebase architecture",
      "Checks DataDog for error patterns",
      "Queries database for data layer context",
      "Identifies root cause hypothesis",
    ],
    icon: <Bug className="w-5 h-5" />,
    color: "emerald" as const,
    actor: "Devin",
  },
  featureDev: {
    id: "feature_dev",
    label: "Feature Development Workflow",
    description: "Design-focused analysis of the feature request",
    details: [
      "Leans on feature understanding & development instinct",
      "Codebase and architecture understanding",
      "Designs implementation approach",
      "Breaks feature into implementation steps",
    ],
    icon: <Lightbulb className="w-5 h-5" />,
    color: "blue" as const,
    actor: "Devin",
  },
  confidenceGate: {
    id: "confidence_gate",
    label: "Confidence Gate",
    description: "Routes based on agent's confidence in the implementation plan",
    icon: <GitBranch className="w-5 h-5" />,
    color: "emerald" as const,
    actor: "Devin",
  },
  highPath: {
    id: "high_confidence",
    label: "Auto-dispatch",
    description: "High confidence — Devin immediately begins implementation",
    details: [
      "No human review needed",
      "Agent creates PR directly",
      "Sent to Sr. Engineers for final review",
    ],
    icon: <Zap className="w-5 h-5" />,
    color: "emerald" as const,
    actor: "System",
  },
  reviewPath: {
    id: "human_review",
    label: "Engineer Review",
    description: "Medium / Low confidence plans require human review",
    details: [
      "Implementation plan reviewed by Jr. Engineers",
      "Jr. Engineers can approve or update the plan",
      "Can edit the suggested approach before dispatch",
    ],
    icon: <UserCheck className="w-5 h-5" />,
    color: "amber" as const,
    actor: "Engineer",
  },
  editPlan: {
    id: "edit_plan",
    label: "Edit Implementation Plan",
    description: "Engineer modifies the approach before dispatching",
    details: [
      "Update suggested approach",
      "Add context or constraints",
      "Approve & dispatch to agent",
    ],
    icon: <Pencil className="w-5 h-5" />,
    color: "amber" as const,
    actor: "Engineer",
  },
  implementation: {
    id: "implementation",
    label: "Agent Implementation",
    description: "Devin implements the fix and creates a PR",
    details: [
      "Agent follows the approved implementation plan",
      "Works in sandbox environment",
      "Creates pull request with changes",
      "Handles open questions from scoping",
    ],
    icon: <Code className="w-5 h-5" />,
    color: "emerald" as const,
    actor: "Devin",
  },
  prReview: {
    id: "pr_review",
    label: "PR Review",
    description: "Engineers review the generated pull request",
    details: [
      "Jr. Engineers review PR first (for medium/low confidence)",
      "Then sent to Sr. Engineers for final review",
      "Merge or request changes",
    ],
    icon: <GitPullRequest className="w-5 h-5" />,
    color: "amber" as const,
    actor: "Engineer",
  },
  resolved: {
    id: "resolved",
    label: "Resolved",
    description: "PR merged, issue closed",
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: "emerald" as const,
    actor: "System",
  },
};

// --- Color utils ---

const colorStyles = {
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-400/80 border-emerald-500/25",
    connector: "bg-emerald-500/40",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.08)]",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    text: "text-amber-400",
    icon: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400/80 border-amber-500/25",
    connector: "bg-amber-500/40",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.08)]",
  },
  muted: {
    bg: "bg-muted/20",
    border: "border-border/50",
    text: "text-muted-foreground",
    icon: "text-muted-foreground/70",
    badge: "bg-muted/30 text-muted-foreground/70 border-border",
    connector: "bg-border/50",
    glow: "",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/25",
    text: "text-blue-400",
    icon: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-400/80 border-blue-500/25",
    connector: "bg-blue-500/40",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.08)]",
  },
};

// --- Components ---

function NodeCard({ node }: { node: WorkflowNode }) {
  const styles = colorStyles[node.color];

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} ${styles.glow} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg border ${styles.border} bg-background/50 flex items-center justify-center shrink-0`}>
          <span className={styles.icon}>{node.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${styles.text}`}>{node.label}</h3>
            {node.actor && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles.badge}`}>
                {node.actor === "Devin" && <Bot className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />}
                {node.actor}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground/60">{node.description}</p>
        </div>
      </div>
    </div>
  );
}

function VerticalConnector({ color = "muted", label }: { color?: "emerald" | "amber" | "muted" | "blue"; label?: string }) {
  const styles = colorStyles[color];
  return (
    <div className="flex flex-col items-center py-1">
      <div className={`w-px h-6 ${styles.connector}`} />
      {label && (
        <span className={`text-[10px] font-medium px-2 py-0.5 ${styles.text} opacity-70`}>{label}</span>
      )}
      <ArrowDown className={`w-3 h-3 ${styles.text} opacity-50`} />
    </div>
  );
}

function ConfidenceSplit() {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute top-1/2 left-[15%] right-[15%] h-px bg-border/40" />
      <div className="flex w-full justify-between px-[10%]">
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-emerald-500/40" />
          <span className="text-[10px] font-medium text-emerald-400/70 bg-background px-2">High Confidence</span>
          <ArrowDown className="w-3 h-3 text-emerald-400/50" />
        </div>
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-amber-500/40" />
          <span className="text-[10px] font-medium text-amber-400/70 bg-background px-2">Medium / Low</span>
          <ArrowDown className="w-3 h-3 text-amber-400/50" />
        </div>
      </div>
    </div>
  );
}

function MergeConnector({ color = "emerald" }: { color?: "emerald" | "amber" | "muted" }) {
  const styles = colorStyles[color];
  return (
    <div className="flex flex-col items-center py-1">
      <div className="relative w-full flex justify-between px-[10%]">
        <div className="w-px h-4 bg-emerald-500/30" />
        <div className="w-px h-4 bg-amber-500/30" />
      </div>
      <div className="absolute left-[15%] right-[15%] h-px bg-border/30 mt-4" />
      <ArrowDown className={`w-3 h-3 ${styles.text} opacity-50 mt-1`} />
    </div>
  );
}

// --- Scoping Detail Panel ---

function ScopingDetail() {
  const styles = colorStyles.emerald;
  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} ${styles.glow} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg border ${styles.border} bg-background/50 flex items-center justify-center shrink-0`}>
          <span className={styles.icon}><Search className="w-5 h-5" /></span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${styles.text}`}>Agent Scoping</h3>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles.badge}`}>
              <Bot className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />
              Devin
            </span>
          </div>
          <p className="text-xs text-muted-foreground/60">Concurrent Devin sessions analyze the issue</p>
        </div>
      </div>
    </div>
  );
}

// --- Main Diagram ---

export function WorkflowDiagram() {
  const n = workflowNodes;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-0">
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground/90 mb-1">Resolver Workflow</h2>
        <p className="text-xs text-muted-foreground/50">End-to-end pipeline from issue intake to resolution.</p>
      </div>

      {/* 1. Intake */}
      <NodeCard node={n.intake} />

      <VerticalConnector color="muted" label="Detect workflow type" />

      {/* 2. Workflow branch: Bug vs Feature */}
      <div className="grid grid-cols-2 gap-3">
        <NodeCard node={n.bugTriage} />
        <NodeCard node={n.featureDev} />
      </div>

      <VerticalConnector color="emerald" />

      {/* 3. Agent Scoping (shared) */}
      <ScopingDetail />

      <VerticalConnector color="emerald" />

      {/* 4. Confidence Gate */}
      <NodeCard node={n.confidenceGate} />

      <ConfidenceSplit />

      {/* 5. Two paths */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-0">
          <NodeCard node={n.highPath} />
        </div>
        <div className="space-y-0">
          <NodeCard node={n.reviewPath} />
          <VerticalConnector color="amber" label="Optional" />
          <NodeCard node={n.editPlan} />
        </div>
      </div>

      <MergeConnector color="emerald" />

      {/* 6. Implementation */}
      <NodeCard node={n.implementation} />

      <VerticalConnector color="emerald" />

      {/* 7. PR Review */}
      <NodeCard node={n.prReview} />

      <VerticalConnector color="emerald" />

      {/* 8. Resolved */}
      <NodeCard node={n.resolved} />

      {/* Legend */}
      <div className="mt-10 pt-6 border-t border-border/30">
        <h4 className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest mb-3">Legend</h4>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Automated (Devin)", color: "emerald" as const },
            { label: "Human Review", color: "amber" as const },
            { label: "Feature Path", color: "blue" as const },
            { label: "System / Manual", color: "muted" as const },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground/50">
              <span className={`w-3 h-3 rounded border ${colorStyles[color].border} ${colorStyles[color].bg}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
