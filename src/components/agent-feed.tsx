"use client";

import { useEffect, useState } from "react";
import type { Issue } from "@/lib/types";
import { StatusBadge, RepoBadge, ConfidenceBadge } from "@/components/status-badge";
import { Bot, Clock, Check, Search, Wrench, Hourglass } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AgentFeed() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgentWork = async () => {
      const [activeRes, completedRes] = await Promise.all([
        fetch("/api/issues?assignee=devin&status=scoping,in_progress,in_review"),
        fetch("/api/issues?assignee=devin&status=resolved"),
      ]);
      const active = await activeRes.json();
      const completed = await completedRes.json();
      setIssues([...active, ...completed.slice(0, 10)]);
      setLoading(false);
    };
    fetchAgentWork();
    const interval = setInterval(fetchAgentWork, 15000);
    return () => clearInterval(interval);
  }, []);

  const getPhase = (issue: Issue) => {
    switch (issue.status) {
      case "scoping":
        return { label: "Scoping", icon: Search, color: "text-muted-foreground", borderColor: "border-border" };
      case "in_progress":
        return { label: "Fixing", icon: Wrench, color: "text-amber-400/70", borderColor: "border-amber-500/15" };
      case "in_review":
        return { label: "Awaiting Review", icon: Hourglass, color: "text-amber-400/70", borderColor: "border-amber-500/15" };
      case "resolved":
        return { label: "Completed", icon: Check, color: "text-emerald-400/70", borderColor: "border-emerald-500/20" };
      default:
        return { label: issue.status, icon: Bot, color: "text-muted-foreground", borderColor: "border-border" };
    }
  };

  const getLatestAgentEvent = (issue: Issue) => {
    if (!issue.activityEvents) return null;
    const agentEvents = issue.activityEvents.filter((e) => e.actor === "devin");
    return agentEvents.length > 0 ? agentEvents[agentEvents.length - 1] : null;
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground/80">
          <Bot className="w-4 h-4 text-emerald-400/60" /> Agent Activity
        </h2>
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted/20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const activeIssues = issues.filter((i) => ["scoping", "in_progress", "in_review"].includes(i.status));
  const completedIssues = issues.filter((i) => i.status === "resolved");

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground/80">
          <Bot className="w-4 h-4 text-emerald-400/60" /> Agent Activity Feed
        </h2>
        <span className="text-xs text-muted-foreground/50 font-mono">
          {activeIssues.length} active
        </span>
      </div>

      {/* Active work */}
      {activeIssues.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">Currently Working</h3>
          {activeIssues.map((issue) => {
            const phase = getPhase(issue);
            const latestEvent = getLatestAgentEvent(issue);
            const PhaseIcon = phase.icon;
            return (
              <div key={issue.id} className={`rounded-lg border ${phase.borderColor} bg-muted/10 p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <PhaseIcon className={`w-3.5 h-3.5 ${phase.color}`} />
                      <span className={`text-[10px] font-medium uppercase tracking-widest ${phase.color}`}>
                        {phase.label}
                      </span>
                      <RepoBadge repo={issue.repo} />
                    </div>
                    <h4 className="text-sm font-medium mb-2 truncate text-foreground/80">{issue.title}</h4>
                    {latestEvent && (
                      <p className="text-xs text-muted-foreground/50">{latestEvent.message}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <StatusBadge status={issue.status} />
                    <span className="text-[10px] text-muted-foreground/30 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(issue.updatedAt))}
                    </span>
                  </div>
                </div>
                {/* Progress indicator */}
                <div className="mt-4 flex items-center gap-1">
                  {["scoping", "in_progress", "in_review", "resolved"].map((step, idx) => {
                    const steps = ["scoping", "in_progress", "in_review", "resolved"];
                    const currentIdx = steps.indexOf(issue.status);
                    return (
                      <div
                        key={step}
                        className={`h-0.5 flex-1 rounded-full ${
                          idx <= currentIdx ? "bg-emerald-500/50" : "bg-muted/30"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/10 p-12 text-center">
          <Bot className="w-10 h-10 mx-auto mb-3 text-muted-foreground/15" />
          <p className="text-sm text-muted-foreground/50">No active agent work</p>
          <p className="text-xs text-muted-foreground/30 mt-1">Send issues to the agent from the triage view</p>
        </div>
      )}

      {/* Completed work */}
      {completedIssues.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">Recently Completed</h3>
          {completedIssues.map((issue) => {
            const latestEvent = getLatestAgentEvent(issue);
            return (
              <div key={issue.id} className="rounded-lg border border-emerald-500/10 bg-muted/10 p-4">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400/50 shrink-0" />
                  <span className="text-sm truncate flex-1 text-foreground/70">{issue.title}</span>
                  <RepoBadge repo={issue.repo} />
                  {issue.scopingReport && <ConfidenceBadge confidence={issue.scopingReport.confidence} />}
                </div>
                {latestEvent && (
                  <p className="text-xs text-muted-foreground/40 mt-2 ml-5.5">{latestEvent.message}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
