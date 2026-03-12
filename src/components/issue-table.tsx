"use client";

import { useState } from "react";
import type { Issue } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, PriorityDot, ComplexityBadge, TypeBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateIssue, dispatchToDevin } from "@/hooks/use-issues";
import {
  Check,
  Bot,
  MoreHorizontal,
  XCircle,
  User,
} from "lucide-react";

interface IssueTableProps {
  issues: Issue[];
  loading: boolean;
  onSelectIssue: (id: string) => void;
  onRefresh: () => void;
}

export function IssueTable({ issues, loading, onSelectIssue, onRefresh }: IssueTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === issues.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(issues.map((i) => i.id)));
    }
  };

  const [dispatching, setDispatching] = useState(false);

  const bulkAction = async (action: "scope" | "wont_fix" | "priority") => {
    if (action === "scope") {
      setDispatching(true);
      try {
        const result = await dispatchToDevin(Array.from(selected));
        if (result.failed.length > 0) {
          console.error("Some issues failed to dispatch:", result.failed);
        }
      } catch (err) {
        console.error("Failed to dispatch to Devin:", err);
      } finally {
        setDispatching(false);
      }
    } else if (action === "wont_fix") {
      for (const id of selected) {
        await updateIssue(id, { status: "wont_fix", actor: "system" });
      }
    }
    setSelected(new Set());
    onRefresh();
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="animate-pulse space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-10 bg-muted/30 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="bg-muted/30 border-b border-border px-5 py-2.5 flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => bulkAction("scope")} disabled={dispatching}>
            <Bot className="w-3 h-3" /> {dispatching ? "Dispatching..." : "Send to Agent"}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={() => bulkAction("wont_fix")}>
            <XCircle className="w-3 h-3" /> Won&apos;t Fix
          </Button>
        </div>
      )}

      {/* Table header */}
      <div className="border-b border-border px-5 py-2.5 flex items-center gap-3 text-[12px] uppercase tracking-widest text-muted-foreground/60 font-medium">
        <div className="w-6">
          <Checkbox
            checked={selected.size === issues.length && issues.length > 0}
            onCheckedChange={toggleAll}
            className="h-3.5 w-3.5"
          />
        </div>
        <div className="w-5">P</div>
        <div className="flex-1 min-w-0">Issue</div>
        <div className="w-20">Type</div>
        <div className="w-20">Complexity</div>
        <div className="w-16 text-right">Stale</div>
        <div className="w-20">Assignee</div>
        <div className="w-24">Status</div>
        <div className="w-6" />
      </div>

      {/* Issue rows */}
      <div className="flex-1 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground/50">
            No issues match your filters
          </div>
        ) : (
          issues.map((issue) => (
            <div
              key={issue.id}
              className={`border-b border-border/50 px-5 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors cursor-pointer group ${
                selected.has(issue.id) ? "bg-muted/30 border-l-2 border-l-emerald-500" : ""
              }`}
              onClick={() => onSelectIssue(issue.id)}
            >
              <div className="w-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.has(issue.id)}
                  onCheckedChange={() => toggleSelect(issue.id)}
                  className="h-3.5 w-3.5"
                />
              </div>
              <div className="w-5">
                <PriorityDot priority={issue.priority} />
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-[14.5px] font-medium truncate text-foreground/90">{issue.title}</span>
                {issue.scopingReport && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500/60" />
                )}
              </div>
              <div className="w-20">
                {issue.labels.includes("bug") ? (
                  <TypeBadge type="bug" />
                ) : issue.labels.includes("feature") ? (
                  <TypeBadge type="feature" />
                ) : (
                  <span className="text-[12px] text-muted-foreground/30">&mdash;</span>
                )}
              </div>
              <div className="w-20">
                <ComplexityBadge complexity={issue.complexity} />
              </div>
              <div className="w-16 text-right">
                <span
                  className={`text-[13px] font-mono ${
                    issue.staleDays > 90
                      ? "text-amber-400"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {issue.staleDays}d
                </span>
              </div>
              <div className="w-20">
                {issue.assignee ? (
                  <span className={`text-[13px] flex items-center gap-1.5 ${issue.assignee === "devin" ? "text-emerald-400/70" : "text-muted-foreground/60"}`}>
                    {issue.assignee === "devin" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {issue.assignee}
                  </span>
                ) : (
                  <span className="text-[13px] text-muted-foreground/30">&mdash;</span>
                )}
              </div>
              <div className="w-24">
                <StatusBadge status={issue.status} />
              </div>
              <div className="w-6" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={async () => {
                        await dispatchToDevin([issue.id]);
                        onRefresh();
                      }}
                    >
                      <Bot className="w-3 h-3 mr-2" /> Send to Agent
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        await updateIssue(issue.id, { status: "wont_fix", actor: "system" });
                        onRefresh();
                      }}
                    >
                      <XCircle className="w-3 h-3 mr-2" /> Won&apos;t Fix
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground/50 flex items-center justify-between">
        <span>{issues.length} issues</span>
        <span className="font-mono">avg {issues.length > 0 ? Math.round(issues.reduce((a, i) => a + i.staleDays, 0) / issues.length) : 0}d stale</span>
      </div>
    </div>
  );
}
