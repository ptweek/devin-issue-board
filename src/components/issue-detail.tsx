"use client";

import { useEffect, useState, useCallback } from "react";
import type { Issue, IssueStatus, Priority } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { updateIssue, postActivity } from "@/hooks/use-issues";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IssueDetailProps {
  issueId: string | null;
  onClose: () => void;
  onRefresh: () => void;
}

export function IssueDetail({ issueId, onClose, onRefresh }: IssueDetailProps) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "scoping" | "activity">("description");
  const [datadogOpen, setDatadogOpen] = useState(false);
  const [dataLayerOpen, setDataLayerOpen] = useState(false);

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

  const handleSendToAgent = async (action: "scope" | "fix") => {
    if (!issue) return;
    if (action === "scope") {
      await updateIssue(issue.id, { status: "scoping", assignee: "devin", actor: "system" });
      await postActivity(issue.id, {
        eventType: "agent_scoping_started",
        actor: "devin",
        message: "Agent started scoping this issue",
      });
    } else {
      await updateIssue(issue.id, { status: "in_progress", assignee: "devin", actor: "system" });
      await postActivity(issue.id, {
        eventType: "agent_fix_started",
        actor: "devin",
        message: "Agent started working on a fix",
      });
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
    <Sheet open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-background border-border">
        {loading || !issue ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-8 bg-muted/30 rounded w-3/4" />
            <div className="h-4 bg-muted/30 rounded w-1/2" />
            <div className="h-32 bg-muted/30 rounded" />
          </div>
        ) : (
          <>
            {/* Header */}
            <SheetHeader className="p-8 pb-5 space-y-4">
              <SheetTitle className="text-base font-medium leading-tight pr-8 text-foreground">
                {issue.title}
              </SheetTitle>
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
                {issue.sourceUrl && (
                  <a href={issue.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground/70 transition-colors">
                    <ExternalLink className="w-3 h-3" /> GitHub
                  </a>
                )}
              </div>
            </SheetHeader>

            {/* Actions */}
            <div className="px-8 py-3 border-t border-b border-border/50 flex items-center gap-2 flex-wrap">
              <Button size="sm" className="h-7 text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => handleSendToAgent("scope")}>
                <Bot className="w-3 h-3" /> Scope with Agent
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleSendToAgent("fix")}>
                <Bot className="w-3 h-3" /> Assign Agent for Fix
              </Button>
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
                      <div>
                        <button
                          onClick={() => setDatadogOpen(!datadogOpen)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground transition-colors"
                        >
                          {datadogOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          Datadog Findings
                        </button>
                        {datadogOpen && (
                          <p className="mt-3 text-sm text-muted-foreground bg-muted/15 rounded-md p-4 leading-relaxed border border-border/30">
                            {issue.scopingReport.datadogFindings}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Data layer findings */}
                    {issue.scopingReport.dataLayerFindings && (
                      <div>
                        <button
                          onClick={() => setDataLayerOpen(!dataLayerOpen)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest hover:text-muted-foreground transition-colors"
                        >
                          {dataLayerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          Data Layer Findings
                        </button>
                        {dataLayerOpen && (
                          <p className="mt-3 text-sm text-muted-foreground bg-muted/15 rounded-md p-4 leading-relaxed border border-border/30">
                            {issue.scopingReport.dataLayerFindings}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Bot className="w-10 h-10 mb-3 text-muted-foreground/20" />
                    <p className="text-sm mb-1">No scoping report yet</p>
                    <p className="text-xs text-muted-foreground/40 mb-5">Send this issue to the agent for scoping</p>
                    <Button size="sm" className="text-xs gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white border-0" onClick={() => handleSendToAgent("scope")}>
                      <Bot className="w-3 h-3" /> Send to Agent
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
      </SheetContent>
    </Sheet>
  );
}
