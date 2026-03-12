"use client";

import { useEffect, useState } from "react";
import type { Stats, IssueStatus, Priority } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface Filters {
  status: string;
  priority: string;
  complexity: string;
  repo: string;
  label: string;
  assignee: string;
  staleOver: string;
  search: string;
  sort: string;
}

interface SidebarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const statusLabels: Record<string, string> = {
  untriaged: "Untriaged",
  scoping: "Scoping",
  ready: "Ready",
  in_progress: "In Progress",
  in_review: "In Review",
  resolved: "Resolved",
  wont_fix: "Won't Fix",
};

export function Sidebar({ filters, onFilterChange }: SidebarProps) {
  const [stats, setStats] = useState<(Stats & { repos?: string[] }) | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  const setFilter = (key: keyof Filters, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      status: "",
      priority: "",
      complexity: "",
      repo: "",
      label: "",
      assignee: "",
      staleOver: "",
      search: "",
      sort: "staleDays",
    });
  };

  const quickFilter = (preset: Partial<Filters>) => {
    onFilterChange({ ...filters, ...preset });
  };

  if (!stats) {
    return (
      <div className="w-60 border-r border-border p-5 flex-shrink-0 bg-[oklch(0.13_0_0)]">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 bg-muted/40 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const isQuickActive = (preset: Partial<Filters>) => {
    return Object.entries(preset).every(([k, v]) => filters[k as keyof Filters] === v);
  };

  return (
    <div className="w-60 border-r border-border flex-shrink-0 flex flex-col overflow-y-auto bg-[oklch(0.13_0_0)]">
      <div className="p-5 space-y-6">
        {/* Overview — simple text */}
        <div>
          <p className="text-[13px] text-muted-foreground">
            <span className="text-foreground font-medium font-mono">{stats.totalIssues}</span> total
            <span className="mx-1.5 text-muted-foreground/30">&middot;</span>
            <span className="text-foreground font-medium font-mono">{stats.staleOver30}</span> stale 30d+
          </p>
        </div>

        {/* Status list */}
        <div>
          <h3 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-3">Status</h3>
          <div className="space-y-0.5">
            {Object.entries(statusLabels).map(([key, label]) => {
              const count = stats.byStatus[key as IssueStatus] || 0;
              const isActive = filters.status === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter("status", isActive ? "" : key)}
                  className={`w-full flex items-center gap-2.5 text-[14px] leading-[1.6] py-1.5 px-2 rounded-md transition-colors ${
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/30"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                  }`} />
                  <span className="flex-1 text-left">{label}</span>
                  <span className="font-mono text-muted-foreground/60 text-[14px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Quick filters */}
        <div>
          <h3 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest mb-3">Quick Filters</h3>
          <div className="space-y-0.5">
            {[
              { label: "Needs Triage", preset: { status: "untriaged", priority: "", staleOver: "" } },
              { label: "Ready to Assign", preset: { status: "ready", priority: "", staleOver: "" } },
              { label: "Agent is Working", preset: { status: "scoping,in_progress,in_review", priority: "", staleOver: "", assignee: "devin" } },
              { label: "Stale > 30 days", preset: { status: "", priority: "", staleOver: "30" } },
            ].map(({ label, preset }) => {
              const active = isQuickActive(preset);
              return (
                <button
                  key={label}
                  onClick={() => quickFilter(preset)}
                  className={`w-full text-left text-[14px] leading-[1.6] py-1.5 px-2 rounded-md transition-colors ${
                    active ? "text-emerald-400" : "text-muted-foreground hover:text-foreground/70 hover:bg-muted/30"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Separator className="bg-border" />

        {/* Filter dropdowns */}
        <div className="space-y-4">
          <h3 className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-widest">Filters</h3>

          <div>
            <label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Priority</label>
            <Select value={filters.priority || "all"} onValueChange={(v) => setFilter("priority", v === "all" ? "" : v ?? "")}>
              <SelectTrigger className="h-8 text-xs mt-1 bg-muted/20 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="unprioritized">Unprioritized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Complexity</label>
            <Select value={filters.complexity || "all"} onValueChange={(v) => setFilter("complexity", v === "all" ? "" : v ?? "")}>
              <SelectTrigger className="h-8 text-xs mt-1 bg-muted/20 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complexities</SelectItem>
                <SelectItem value="trivial">Trivial</SelectItem>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Repo</label>
            <Select value={filters.repo || "all"} onValueChange={(v) => setFilter("repo", v === "all" ? "" : v ?? "")}>
              <SelectTrigger className="h-8 text-xs mt-1 bg-muted/20 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Repos</SelectItem>
                {(stats.repos || []).map((r: string) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">Sort By</label>
            <Select value={filters.sort || "staleDays"} onValueChange={(v) => setFilter("sort", v ?? "staleDays")}>
              <SelectTrigger className="h-8 text-xs mt-1 bg-muted/20 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staleDays">Staleness</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="updatedAt">Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={clearFilters}
            className="w-full text-xs text-muted-foreground/50 hover:text-muted-foreground py-1.5 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}
