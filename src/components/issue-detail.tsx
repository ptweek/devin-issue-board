"use client";

import { useEffect, useState, useCallback } from "react";
import type { Issue, IssueStatus, Priority, DatadogFindings, DataLayerFindings } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  StatusBadge,
  PriorityBadge,
  ComplexityBadge,
  ConfidenceBadge,
  RepoBadge,
  LabelBadge,
} from "@/components/status-badge";
import { updateIssue, dispatchToDevin, dispatchToDevinFix } from "@/hooks/use-issues";
import {
  Bot,
  User,
  XCircle,
  ExternalLink,
  FileCode,
  AlertTriangle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Pencil,
  CheckCircle,
  Zap,
  Activity,
  Database,
  Search,
  BarChart3,
  Radio,
  Shield,
  CircleDot,
  Table2,
  Link2,
  KeyRound,
  Layers,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PipelineVisualization } from "@/components/pipeline-visualization";

interface IssueDetailProps {
  issueId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

// --- Structured Findings Components ---

const ddFindingTypeIcon: Record<string, React.ReactNode> = {
  error: <XCircle className="w-3.5 h-3.5" />,
  latency: <BarChart3 className="w-3.5 h-3.5" />,
  trace: <Activity className="w-3.5 h-3.5" />,
  monitor: <Radio className="w-3.5 h-3.5" />,
  log: <Search className="w-3.5 h-3.5" />,
};

const ddSeverityStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", dot: "bg-red-400" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", dot: "bg-amber-400" },
  info: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", dot: "bg-blue-400" },
};

const ddStatusStyles: Record<string, { bg: string; text: string; label: string }> = {
  ongoing: { bg: "bg-red-500/15", text: "text-red-400", label: "Ongoing" },
  resolved: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Resolved" },
  intermittent: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Intermittent" },
  unknown: { bg: "bg-muted/30", text: "text-muted-foreground", label: "Unknown" },
};

function DatadogFindingsCard({ findings, open, onToggle }: { findings: DatadogFindings | string; open: boolean; onToggle: () => void }) {
  // Legacy plain-text support
  if (typeof findings === "string") {
    return (
      <div>
        <button onClick={onToggle} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground transition-colors">
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Activity className="w-3 h-3" /> Datadog Findings
        </button>
        {open && <p className="mt-3 text-sm text-muted-foreground bg-muted/15 rounded-md p-4 leading-relaxed border border-border/30">{findings}</p>}
      </div>
    );
  }

  const status = ddStatusStyles[findings.productionStatus] || ddStatusStyles.unknown;

  return (
    <div className="border border-purple-500/15 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-purple-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-purple-500/15 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-[11px] font-medium text-purple-400/80 uppercase tracking-widest">Datadog Findings</span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">{findings.findings.length} signal{findings.findings.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Rationale */}
          <p className="text-xs text-muted-foreground/60 italic">{findings.investigationRationale}</p>

          {/* Search queries */}
          {findings.searches && findings.searches.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {findings.searches.map((q, i) => (
                <span key={i} className="text-[10px] font-mono text-purple-400/60 bg-purple-500/10 px-2 py-0.5 rounded">
                  {q}
                </span>
              ))}
            </div>
          )}

          {/* Findings */}
          <div className="space-y-2">
            {findings.findings.map((f, i) => {
              const sev = ddSeverityStyles[f.severity || "info"] || ddSeverityStyles.info;
              return (
                <div key={i} className={`rounded-md border ${sev.border} ${sev.bg} p-3`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={sev.text}>{ddFindingTypeIcon[f.type] || <CircleDot className="w-3.5 h-3.5" />}</span>
                    <span className={`text-xs font-medium ${sev.text}`}>{f.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                    <span className="text-[9px] text-muted-foreground/40 uppercase">{f.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 leading-relaxed pl-5.5">{f.detail}</p>
                </div>
              );
            })}
          </div>

          {/* Impact */}
          <div className="border-t border-purple-500/10 pt-3">
            <h5 className="text-[10px] font-medium text-purple-400/60 uppercase tracking-wider mb-1">Impact on Scoping</h5>
            <p className="text-xs text-muted-foreground/70">{findings.impactOnScoping}</p>
          </div>
        </div>
      )}
    </div>
  );
}

const dlFindingTypeIcon: Record<string, React.ReactNode> = {
  schema: <Layers className="w-3.5 h-3.5" />,
  data: <Table2 className="w-3.5 h-3.5" />,
  index: <BarChart3 className="w-3.5 h-3.5" />,
  constraint: <Shield className="w-3.5 h-3.5" />,
  relationship: <Link2 className="w-3.5 h-3.5" />,
};

function DataLayerFindingsCard({ findings, open, onToggle }: { findings: DataLayerFindings | string; open: boolean; onToggle: () => void }) {
  // Legacy plain-text support
  if (typeof findings === "string") {
    return (
      <div>
        <button onClick={onToggle} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground transition-colors">
          {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <Database className="w-3 h-3" /> Data Layer Findings
        </button>
        {open && <p className="mt-3 text-sm text-muted-foreground bg-muted/15 rounded-md p-4 leading-relaxed border border-border/30">{findings}</p>}
      </div>
    );
  }

  return (
    <div className="border border-cyan-500/15 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500/15 flex items-center justify-center">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="text-[11px] font-medium text-cyan-400/80 uppercase tracking-widest">Data Layer Findings</span>
          <span className="text-[10px] text-muted-foreground/40 font-mono">{findings.findings.length} finding{findings.findings.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          {findings.modelsExamined && (
            <span className="text-[10px] text-muted-foreground/40 font-mono">{findings.modelsExamined.length} model{findings.modelsExamined.length !== 1 ? "s" : ""}</span>
          )}
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4">
          {/* Rationale */}
          <p className="text-xs text-muted-foreground/60 italic">{findings.investigationRationale}</p>

          {/* Models examined */}
          {findings.modelsExamined && findings.modelsExamined.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {findings.modelsExamined.map((m, i) => (
                <span key={i} className="text-[10px] font-mono text-cyan-400/60 bg-cyan-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <KeyRound className="w-2.5 h-2.5" /> {m}
                </span>
              ))}
            </div>
          )}

          {/* Findings */}
          <div className="space-y-2">
            {findings.findings.map((f, i) => (
              <div key={i} className="rounded-md border border-cyan-500/15 bg-cyan-500/5 p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-cyan-400/70">{dlFindingTypeIcon[f.type] || <CircleDot className="w-3.5 h-3.5" />}</span>
                  <span className="text-xs font-medium text-cyan-400/80">{f.title}</span>
                  <span className="text-[9px] text-muted-foreground/40 uppercase">{f.type}</span>
                </div>
                <p className="text-xs text-muted-foreground/70 leading-relaxed pl-5.5">{f.detail}</p>
              </div>
            ))}
          </div>

          {/* Schema vs Reality */}
          {findings.schemaVsReality && (
            <div className="border border-amber-500/15 bg-amber-500/5 rounded-md p-3">
              <h5 className="text-[10px] font-medium text-amber-400/70 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Schema vs Reality
              </h5>
              <p className="text-xs text-muted-foreground/70">{findings.schemaVsReality}</p>
            </div>
          )}

          {/* Impact */}
          <div className="border-t border-cyan-500/10 pt-3">
            <h5 className="text-[10px] font-medium text-cyan-400/60 uppercase tracking-wider mb-1">Impact on Scoping</h5>
            <p className="text-xs text-muted-foreground/70">{findings.impactOnScoping}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function IssueDetail({ issueId, onClose, onRefresh }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "scoping" | "activity">("description");
  const [datadogOpen, setDatadogOpen] = useState(false);
  const [dataLayerOpen, setDataLayerOpen] = useState(false);
  const [editingApproach, setEditingApproach] = useState(false);
  const [approachText, setApproachText] = useState("");

  const fetchIssue = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    const res = await fetch(`/api/issues/${issueId}`);
    const data = await res.json();
    setIssue(data);
    setLoading(false);
    if (data.scopingReport) setActiveTab("scoping");
    else setActiveTab("description");
  }, [issueId]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  const handleStatusChange = async (status: IssueStatus) => {
    if (!issue) return;
    await updateIssue(issue.id, { status, actor: "system" });
    fetchIssue();
    onRefresh();
  };

  const handlePriorityChange = async (priority: Priority) => {
    if (!issue) return;
    await updateIssue(issue.id, { priority, actor: "system" });
    fetchIssue();
    onRefresh();
  };

  const [agentLoading, setAgentLoading] = useState(false);

  const handleSendToAgent = async (action: "scope" | "fix") => {
    if (!issue) return;
    setAgentLoading(true);
    try {
      if (action === "scope") {
        await dispatchToDevin([issue.id]);
      } else {
        await dispatchToDevinFix(issue.id);
      }
    } catch (err) {
      console.error("Failed to dispatch to Devin:", err);
    } finally {
      setAgentLoading(false);
    }
    fetchIssue();
    onRefresh();
  };

  const eventIcon = (eventType: string, actor: string) => {
    if (actor === "devin") return <Bot className="w-3.5 h-3.5 text-emerald-400/70" />;
    if (eventType === "comment") return <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/50" />;
    return <User className="w-3.5 h-3.5 text-muted-foreground/50" />;
  };

  return (
    <Dialog open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0 bg-background" showCloseButton>
        {loading || !issue ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-8 bg-muted/30 rounded w-3/4" />
            <div className="h-4 bg-muted/30 rounded w-1/2" />
            <div className="h-32 bg-muted/30 rounded" />
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="p-8 pb-5 space-y-4">
              <DialogTitle className="text-base font-medium leading-tight pr-8 text-foreground">
                {issue.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={issue.status} onValueChange={(v) => v && handleStatusChange(v as IssueStatus)}>
                  <SelectTrigger className="h-7 w-auto text-xs">
                    <StatusBadge status={issue.status} />
                  </SelectTrigger>
                  <SelectContent>
                    {["untriaged", "scoping", "ready", "in_progress", "in_review", "resolved", "wont_fix"].map((s) => (
                      <SelectItem key={s} value={s}>
                        <StatusBadge status={s as IssueStatus} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={issue.priority} onValueChange={(v) => v && handlePriorityChange(v as Priority)}>
                  <SelectTrigger className="h-7 w-auto text-xs">
                    <PriorityBadge priority={issue.priority} />
                  </SelectTrigger>
                  <SelectContent>
                    {["critical", "high", "medium", "low", "unprioritized"].map((p) => (
                      <SelectItem key={p} value={p}>
                        <PriorityBadge priority={p as Priority} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ComplexityBadge complexity={issue.complexity} />
                <RepoBadge repo={issue.repo} />
              </div>
              <div className="flex flex-wrap gap-1">
                {issue.labels.map((label: string) => (
                  <LabelBadge key={label} label={label} />
                ))}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                {issue.assignee && (
                  <span className="flex items-center gap-1">
                    {issue.assignee === "devin" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {issue.assignee}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {issue.staleDays}d stale
                </span>
                {issue.prUrl && (
                  <a href={issue.prUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-400 transition-colors">
                    <ExternalLink className="w-3 h-3" /> Pull Request
                  </a>
                )}
                {issue.sourceUrl && (
                  <a href={issue.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground/70 transition-colors">
                    <ExternalLink className="w-3 h-3" /> GitHub
                  </a>
                )}
              </div>
            </DialogHeader>

            {/* Pipeline Visualization */}
            <PipelineVisualization issue={issue} />

            {/* Actions */}
            {(() => {
              const agentBusy = ["scoping", "in_progress"].includes(issue.status) && issue.assignee === "devin";
              const devinUrl = issue.activityEvents
                ?.slice().reverse()
                .map(e => (e.metadata as Record<string, unknown>)?.devinUrl as string | undefined)
                .find(Boolean) || null;
              return (
                <div className="px-8 py-3 border-b border-border/50 flex items-center gap-2 flex-wrap">
                  {agentBusy ? (
                    <>
                      <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-500/20 text-emerald-400/60 border-0 cursor-not-allowed" disabled>
                        <Bot className="w-3 h-3" /> Agent Working...
                      </Button>
                      {devinUrl && (
                        <a href={devinUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-emerald-400/80 border-emerald-500/20 hover:bg-emerald-500/10">
                            <ExternalLink className="w-3 h-3" /> View Devin Session
                          </Button>
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => handleSendToAgent("scope")} disabled={agentLoading}>
                        <Bot className="w-3 h-3" /> {agentLoading ? "Dispatching..." : "Scope with Agent"}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleSendToAgent("fix")} disabled={agentLoading}>
                        <Bot className="w-3 h-3" /> Assign Agent for Fix
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5 text-muted-foreground"
                    onClick={async () => {
                      await handleStatusChange("wont_fix");
                    }}
                  >
                    <XCircle className="w-3 h-3" /> Won&apos;t Fix
                  </Button>
                </div>
              );
            })()}

            {/* Tabs */}
            <div className="border-b border-border/50 flex px-8">
              {(["description", "scoping", "activity"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-3 text-xs font-medium transition-colors relative ${
                    activeTab === tab
                      ? "text-foreground"
                      : "text-muted-foreground/50 hover:text-muted-foreground"
                  }`}
                >
                  {tab === "description" ? "Description" : tab === "scoping" ? "Scoping Report" : "Activity"}
                  {tab === "scoping" && issue.scopingReport && (
                    <span className="ml-1.5 w-1.5 h-1.5 bg-emerald-500/60 rounded-full inline-block" />
                  )}
                  {tab === "activity" && issue.activityEvents && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/40 font-mono">{issue.activityEvents.length}</span>
                  )}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-8">
              {activeTab === "description" && (
                <div className="prose prose-invert prose-sm max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </div>
              )}

              {activeTab === "scoping" && (
                issue.scopingReport ? (
                  <div className="space-y-6">
                    {/* Summary */}
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-2">Summary</h4>
                      <p className="text-sm leading-relaxed text-foreground/80">{issue.scopingReport.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <ConfidenceBadge confidence={issue.scopingReport.confidence} />
                      <Badge variant="outline" className="text-xs bg-transparent text-muted-foreground border-border">{issue.scopingReport.estimatedEffort}</Badge>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Root cause */}
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-2">Root Cause Hypothesis</h4>
                      <p className="text-sm leading-relaxed text-muted-foreground">{issue.scopingReport.rootCauseHypothesis}</p>
                    </div>

                    {/* Suggested approach */}
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-2">Suggested Approach</h4>
                      <pre className="text-sm text-muted-foreground bg-muted/20 rounded-md p-4 font-mono whitespace-pre-wrap leading-relaxed border border-border/50">
                        {issue.scopingReport.suggestedApproach}
                      </pre>
                    </div>

                    {/* Affected files */}
                    <div>
                      <h4 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-2">Affected Files</h4>
                      <div className="space-y-1">
                        {issue.scopingReport.affectedFiles.map((file: string) => (
                          <div key={file} className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/15 rounded px-3 py-2 border border-border/30">
                            <FileCode className="w-3 h-3 shrink-0 text-muted-foreground/40" />
                            {file}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Open questions */}
                    {issue.scopingReport.openQuestions.length > 0 && (
                      <div className="border border-amber-500/15 bg-amber-500/5 rounded-md p-5">
                        <h4 className="text-[10px] font-medium text-amber-400/70 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" /> Open Questions
                        </h4>
                        <ul className="space-y-2">
                          {issue.scopingReport.openQuestions.map((q: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/40 font-mono text-xs mt-0.5">{i + 1}.</span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Datadog findings */}
                    {issue.scopingReport.datadogFindings && (
                      <DatadogFindingsCard
                        findings={issue.scopingReport.datadogFindings}
                        open={datadogOpen}
                        onToggle={() => setDatadogOpen(!datadogOpen)}
                      />
                    )}

                    {/* Data layer findings */}
                    {issue.scopingReport.dataLayerFindings && (
                      <DataLayerFindingsCard
                        findings={issue.scopingReport.dataLayerFindings}
                        open={dataLayerOpen}
                        onToggle={() => setDataLayerOpen(!dataLayerOpen)}
                      />
                    )}

                    {/* Approval / Review Actions */}
                    <div className="h-px bg-border/50" />

                    {issue.status === "in_progress" && issue.assignee === "devin" && (
                      <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-md p-4 flex items-center gap-3">
                        <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-emerald-400/80">Auto-dispatched to Devin</p>
                          <p className="text-xs text-muted-foreground/50 mt-0.5">
                            High confidence — Devin is implementing this fix
                          </p>
                        </div>
                      </div>
                    )}

                    {issue.status === "ready" && issue.scopingReport.confidence !== "high" && (
                      <div className="border border-border/50 bg-muted/10 rounded-md p-5 space-y-4">
                        <div>
                          <h4 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest mb-1">
                            Review Required
                          </h4>
                          <p className="text-xs text-muted-foreground/60">
                            This {issue.scopingReport.confidence} confidence plan needs engineer review before implementation.
                          </p>
                        </div>

                        {editingApproach ? (
                          <div className="space-y-3">
                            <textarea
                              value={approachText}
                              onChange={(e) => setApproachText(e.target.value)}
                              rows={8}
                              className="w-full text-sm font-mono bg-muted/20 border border-border/50 rounded-md p-3 text-foreground/80 resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                                disabled={agentLoading}
                                onClick={async () => {
                                  setAgentLoading(true);
                                  try {
                                    // Update the scoping report with new approach
                                    await fetch(`/api/issues/${issue.id}/scoping-report`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ suggestedApproach: approachText }),
                                    });
                                    // Dispatch with updated approach
                                    await dispatchToDevinFix(issue.id, approachText);
                                  } catch (err) {
                                    console.error("Failed to dispatch:", err);
                                  } finally {
                                    setAgentLoading(false);
                                    setEditingApproach(false);
                                  }
                                  fetchIssue();
                                  onRefresh();
                                }}
                              >
                                <CheckCircle className="w-3 h-3" /> {agentLoading ? "Dispatching..." : "Save & Dispatch"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setEditingApproach(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0"
                              disabled={agentLoading}
                              onClick={async () => {
                                setAgentLoading(true);
                                try {
                                  await dispatchToDevinFix(issue.id);
                                } catch (err) {
                                  console.error("Failed to dispatch:", err);
                                } finally {
                                  setAgentLoading(false);
                                }
                                fetchIssue();
                                onRefresh();
                              }}
                            >
                              <CheckCircle className="w-3 h-3" /> {agentLoading ? "Dispatching..." : "Approve & Dispatch"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5"
                              onClick={() => {
                                setApproachText(issue.scopingReport?.suggestedApproach || "");
                                setEditingApproach(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" /> Edit Plan
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Bot className="w-10 h-10 mb-3 text-muted-foreground/20" />
                    <p className="text-sm mb-1">No scoping report yet</p>
                    <p className="text-xs text-muted-foreground/40 mb-5">Send this issue to the agent for scoping</p>
                    <Button size="sm" className="text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => handleSendToAgent("scope")} disabled={agentLoading}>
                      <Bot className="w-3 h-3" /> {agentLoading ? "Dispatching..." : "Send to Agent"}
                    </Button>
                  </div>
                )
              )}

              {activeTab === "activity" && (
                <div className="space-y-0">
                  {issue.activityEvents && issue.activityEvents.length > 0 ? (
                    issue.activityEvents.map((event, idx) => (
                      <div key={event.id} className="flex gap-3 py-3 group">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                            {eventIcon(event.eventType, event.actor)}
                          </div>
                          {idx < issue.activityEvents!.length - 1 && (
                            <div className="w-px flex-1 bg-border/30 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-xs font-medium ${event.actor === "devin" ? "text-emerald-400/70" : "text-muted-foreground/60"}`}>
                              {event.actor}
                            </span>
                            <span className="text-[10px] text-muted-foreground/30 font-mono">
                              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground/70">{event.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground/30 text-center py-12">No activity yet</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
