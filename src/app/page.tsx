"use client";

import { useState, useCallback } from "react";
import { useIssues } from "@/hooks/use-issues";
import { Sidebar } from "@/components/sidebar";
import { IssueTable } from "@/components/issue-table";
import { IssueDetail } from "@/components/issue-detail";
import { AgentFeed } from "@/components/agent-feed";
import { Analytics } from "@/components/analytics";
import { WorkflowDiagram } from "@/components/workflow-diagram";
import { Search } from "lucide-react";

type View = "triage" | "agent" | "workflow" | "analytics";

export default function Home() {
  const [view, setView] = useState<View>("triage");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
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

  const { issues, loading, refetch } = useIssues({
    ...filters,
    search: searchQuery || filters.search,
  });

  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="h-12 border-b border-border flex items-center px-5 gap-6 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white leading-none">R</span>
          </div>
          <span className="font-semibold text-sm text-foreground/90 tracking-tight">Resolver</span>
        </div>

        <nav className="flex items-center gap-0.5 ml-2">
          {(["triage", "agent", "workflow", "analytics"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`relative px-3 py-1.5 text-[14px] font-medium transition-colors rounded-md ${
                view === tab
                  ? "text-foreground bg-muted"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {view === tab && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {view === "triage" && (
          <div className="flex-1 flex justify-end">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-[14px] bg-muted/40 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 placeholder:text-muted-foreground/40 transition-colors"
              />
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {view === "triage" && (
          <>
            <Sidebar filters={filters} onFilterChange={handleFilterChange} />
            <IssueTable
              issues={issues}
              loading={loading}
              onSelectIssue={setSelectedIssueId}
              onRefresh={refetch}
            />
            <IssueDetail
              issueId={selectedIssueId}
              onClose={() => setSelectedIssueId(null)}
              onRefresh={refetch}
            />
          </>
        )}
        {view === "agent" && (
          <div className="flex-1 overflow-y-auto">
            <AgentFeed />
          </div>
        )}
        {view === "workflow" && (
          <div className="flex-1 overflow-y-auto">
            <WorkflowDiagram />
          </div>
        )}
        {view === "analytics" && (
          <div className="flex-1 overflow-y-auto">
            <Analytics />
          </div>
        )}
      </div>
    </div>
  );
}
