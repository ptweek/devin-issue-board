"use client";

import { Badge } from "@/components/ui/badge";
import type { IssueStatus, Priority, Complexity, Confidence } from "@/lib/types";

// Devin palette: green for positive, amber for attention, gray for neutral
const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  untriaged: { label: "Untriaged", className: "bg-transparent text-muted-foreground border-border" },
  scoping: { label: "Scoping", className: "bg-transparent text-muted-foreground border-border" },
  ready: { label: "Ready", className: "bg-transparent text-muted-foreground border-border" },
  in_progress: { label: "In Progress", className: "bg-transparent text-amber-400/80 border-amber-500/20" },
  in_review: { label: "In Review", className: "bg-transparent text-amber-400/80 border-amber-500/20" },
  resolved: { label: "Resolved", className: "bg-transparent text-emerald-400 border-emerald-500/25" },
  wont_fix: { label: "Won't Fix", className: "bg-transparent text-muted-foreground/60 border-border" },
};

const priorityConfig: Record<Priority, { label: string; className: string; dot: string }> = {
  critical: { label: "Critical", className: "bg-transparent text-emerald-400 border-emerald-500/25", dot: "bg-emerald-500" },
  high: { label: "High", className: "bg-transparent text-emerald-400/70 border-emerald-500/20", dot: "bg-emerald-500/70" },
  medium: { label: "Medium", className: "bg-transparent text-amber-400/80 border-amber-500/20", dot: "bg-amber-400" },
  low: { label: "Low", className: "bg-transparent text-muted-foreground border-border", dot: "bg-muted-foreground/50" },
  unprioritized: { label: "Unprioritized", className: "bg-transparent text-muted-foreground/60 border-border", dot: "bg-muted-foreground/30" },
};

// Outlined pills — no fill, thin border, subtle text variation
const complexityConfig: Record<Complexity, { label: string; className: string }> = {
  trivial: { label: "Trivial", className: "bg-transparent text-muted-foreground/60 border-border" },
  small: { label: "Small", className: "bg-transparent text-muted-foreground/70 border-border" },
  medium: { label: "Medium", className: "bg-transparent text-muted-foreground border-border" },
  large: { label: "Large", className: "bg-transparent text-foreground/80 border-border" },
  unknown: { label: "Unknown", className: "bg-transparent text-muted-foreground/50 border-border" },
};

const confidenceConfig: Record<Confidence, { label: string; className: string }> = {
  high: { label: "High Confidence", className: "bg-transparent text-emerald-400 border-emerald-500/25" },
  medium: { label: "Medium Confidence", className: "bg-transparent text-amber-400/80 border-amber-500/20" },
  low: { label: "Low Confidence", className: "bg-transparent text-muted-foreground border-border" },
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const config = statusConfig[status];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function PriorityDot({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return <span className={`inline-block w-2 h-2 rounded-full ${config.dot}`} title={config.label} />;
}

export function ComplexityBadge({ complexity }: { complexity: Complexity }) {
  const config = complexityConfig[complexity];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const config = confidenceConfig[confidence];
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
}

export function RepoBadge({ repo }: { repo: string }) {
  return (
    <Badge variant="outline" className="bg-transparent text-muted-foreground/50 border-border font-mono text-[13px]">
      {repo}
    </Badge>
  );
}

export function LabelBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="bg-transparent text-muted-foreground/60 border-border text-[13px]">
      {label}
    </Badge>
  );
}
