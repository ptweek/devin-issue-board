"use client";

import { useEffect, useState } from "react";
import type { Stats } from "@/lib/types";

export function Analytics() {
  const [stats, setStats] = useState<
    | (Stats & {
        repos?: string[];
        resolutionTimeline?: { week: string; resolved: number; wontFix: number }[];
      })
    | null
  >(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-muted/20 rounded-lg" />
        ))}
      </div>
    );
  }

  const statusData = [
    { key: "untriaged", label: "Untriaged", color: "bg-muted-foreground/40", count: stats.byStatus.untriaged || 0 },
    { key: "scoping", label: "Scoping", color: "bg-muted-foreground/30", count: stats.byStatus.scoping || 0 },
    { key: "ready", label: "Ready", color: "bg-muted-foreground/30", count: stats.byStatus.ready || 0 },
    { key: "in_progress", label: "In Progress", color: "bg-amber-400/50", count: stats.byStatus.in_progress || 0 },
    { key: "in_review", label: "In Review", color: "bg-amber-400/40", count: stats.byStatus.in_review || 0 },
    { key: "resolved", label: "Resolved", color: "bg-emerald-500/50", count: stats.byStatus.resolved || 0 },
    { key: "wont_fix", label: "Won't Fix", color: "bg-muted-foreground/20", count: stats.byStatus.wont_fix || 0 },
  ];

  const priorityData = [
    { key: "critical", label: "Critical", color: "bg-emerald-500/60", count: stats.byPriority.critical || 0 },
    { key: "high", label: "High", color: "bg-emerald-500/40", count: stats.byPriority.high || 0 },
    { key: "medium", label: "Medium", color: "bg-amber-400/40", count: stats.byPriority.medium || 0 },
    { key: "low", label: "Low", color: "bg-muted-foreground/30", count: stats.byPriority.low || 0 },
    { key: "unprioritized", label: "Unprioritized", color: "bg-muted-foreground/20", count: stats.byPriority.unprioritized || 0 },
  ];

  const maxTimeline = Math.max(1, ...(stats.resolutionTimeline || []).map((w) => w.resolved + w.wontFix));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h2 className="text-sm font-medium text-foreground/80">Analytics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Issues", value: stats.totalIssues, color: "" },
          { label: "Avg Stale Days", value: `${stats.avgStaleDays}d`, color: "text-muted-foreground" },
          { label: "Resolved (30d)", value: stats.resolvedLast30, color: "text-emerald-400/70" },
          { label: "Agent Active", value: stats.agentActive, color: "text-emerald-400/50" },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-muted/10 p-5">
            <div className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-2">{card.label}</div>
            <div className={`text-2xl font-medium font-mono ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Status and Priority distribution */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-muted/10 p-6">
          <h3 className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-5">Status Distribution</h3>
          {/* Stacked bar */}
          <div className="flex h-1.5 rounded-full overflow-hidden mb-5">
            {statusData.filter((d) => d.count > 0).map((d) => (
              <div
                key={d.key}
                style={{ width: `${(d.count / stats.totalIssues) * 100}%` }}
                className={`${d.color} transition-all`}
                title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {statusData.map((d) => (
              <div key={d.key} className="flex items-center gap-2.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.color}`} />
                <span className="flex-1 text-muted-foreground/60">{d.label}</span>
                <span className="font-mono text-muted-foreground/80">{d.count}</span>
                <span className="font-mono text-muted-foreground/30 w-10 text-right">
                  {stats.totalIssues > 0 ? Math.round((d.count / stats.totalIssues) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/10 p-6">
          <h3 className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-5">Priority Distribution</h3>
          <div className="flex h-1.5 rounded-full overflow-hidden mb-5">
            {priorityData.filter((d) => d.count > 0).map((d) => (
              <div
                key={d.key}
                style={{ width: `${(d.count / stats.totalIssues) * 100}%` }}
                className={`${d.color} transition-all`}
                title={`${d.label}: ${d.count}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {priorityData.map((d) => (
              <div key={d.key} className="flex items-center gap-2.5 text-xs">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.color}`} />
                <span className="flex-1 text-muted-foreground/60">{d.label}</span>
                <span className="font-mono text-muted-foreground/80">{d.count}</span>
                <span className="font-mono text-muted-foreground/30 w-10 text-right">
                  {stats.totalIssues > 0 ? Math.round((d.count / stats.totalIssues) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resolution timeline */}
      {stats.resolutionTimeline && (
        <div className="rounded-lg border border-border bg-muted/10 p-6">
          <h3 className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-5">
            Resolution Timeline (12 weeks)
          </h3>
          <div className="flex items-end gap-1.5 h-32">
            {stats.resolutionTimeline.map((week) => (
              <div key={week.week} className="flex-1 flex flex-col items-center gap-0.5 group">
                <div className="w-full flex flex-col-reverse" style={{ height: "100px" }}>
                  {week.resolved > 0 && (
                    <div
                      className="w-full bg-emerald-500/40 rounded-t-sm transition-all"
                      style={{ height: `${(week.resolved / maxTimeline) * 100}px` }}
                      title={`${week.resolved} resolved`}
                    />
                  )}
                  {week.wontFix > 0 && (
                    <div
                      className="w-full bg-muted-foreground/20 rounded-t-sm transition-all"
                      style={{ height: `${(week.wontFix / maxTimeline) * 100}px` }}
                      title={`${week.wontFix} won't fix`}
                    />
                  )}
                </div>
                <span className="text-[9px] text-muted-foreground/30 font-mono">
                  {week.week.slice(5)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground/40">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" /> Resolved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" /> Won&apos;t Fix
            </span>
          </div>
        </div>
      )}

      {/* Staleness distribution */}
      <div className="rounded-lg border border-border bg-muted/10 p-6">
        <h3 className="text-[11px] text-muted-foreground/50 uppercase tracking-widest mb-5">Staleness Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-5 bg-muted/15 rounded-lg border border-border/50">
            <div className="text-xl font-medium font-mono text-emerald-400/60">{stats.totalIssues - stats.staleOver7}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">Fresh (&lt; 7d)</div>
          </div>
          <div className="text-center p-5 bg-muted/15 rounded-lg border border-border/50">
            <div className="text-xl font-medium font-mono text-amber-400/60">{stats.staleOver7 - stats.staleOver30}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">Aging (7-30d)</div>
          </div>
          <div className="text-center p-5 bg-muted/15 rounded-lg border border-border/50">
            <div className="text-xl font-medium font-mono text-muted-foreground/60">{stats.staleOver30}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1 uppercase tracking-wider">Stale (30d+)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
