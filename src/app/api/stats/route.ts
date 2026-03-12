import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInDays } from "date-fns";

export async function GET() {
  const issues = await prisma.issue.findMany();
  const now = new Date();

  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  const byComplexity: Record<string, number> = {};
  let staleOver30 = 0;
  let staleOver7 = 0;
  let totalStaleDays = 0;
  let agentActive = 0;
  let resolvedLast30 = 0;

  for (const issue of issues) {
    byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
    byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1;
    byComplexity[issue.complexity] = (byComplexity[issue.complexity] || 0) + 1;

    const staleDays = differenceInDays(now, issue.updatedAt);
    totalStaleDays += staleDays;

    if (staleDays > 30) staleOver30++;
    if (staleDays > 7) staleOver7++;
    if (issue.status === "scoping" || (issue.assignee === "devin" && ["in_progress", "in_review"].includes(issue.status))) {
      agentActive++;
    }
    if (issue.status === "resolved" && differenceInDays(now, issue.updatedAt) <= 30) {
      resolvedLast30++;
    }
  }

  // Get repos for filter
  const repos = [...new Set(issues.map((i) => i.repo))].sort();

  // Get resolution timeline data (last 12 weeks)
  const resolutionTimeline = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const resolved = issues.filter(
      (issue) =>
        issue.status === "resolved" &&
        issue.updatedAt >= weekStart &&
        issue.updatedAt < weekEnd
    ).length;

    const wontFix = issues.filter(
      (issue) =>
        issue.status === "wont_fix" &&
        issue.updatedAt >= weekStart &&
        issue.updatedAt < weekEnd
    ).length;

    resolutionTimeline.push({
      week: weekStart.toISOString().split("T")[0],
      resolved,
      wontFix,
    });
  }

  return NextResponse.json({
    byStatus,
    byPriority,
    byComplexity,
    totalIssues: issues.length,
    staleOver30,
    staleOver7,
    avgStaleDays: issues.length > 0 ? Math.round(totalStaleDays / issues.length) : 0,
    agentActive,
    resolvedLast30,
    repos,
    resolutionTimeline,
  });
}
