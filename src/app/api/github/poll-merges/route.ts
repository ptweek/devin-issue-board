import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuid } from "uuid";

/**
 * Poll GitHub for merged PRs linked to issues in "in_review" status.
 * Call this on an interval (e.g. every 60s) to auto-resolve issues
 * whose PRs have been merged.
 */
export async function POST() {
  const issues = await prisma.issue.findMany({
    where: {
      prUrl: { not: null },
      status: "in_review",
    },
  });

  if (issues.length === 0) {
    return NextResponse.json({ resolved: [], checked: 0 });
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "resolver-app",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resolved: string[] = [];

  for (const issue of issues) {
    const match = issue.prUrl!.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) continue;

    const [, owner, repo, number] = match;

    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
        { headers }
      );

      if (!res.ok) continue;

      const pr = await res.json();

      if (!pr.merged) continue;

      await prisma.issue.update({
        where: { id: issue.id },
        data: { status: "resolved" },
      });

      await prisma.activityEvent.create({
        data: {
          id: uuid(),
          issueId: issue.id,
          eventType: "status_change",
          actor: "github",
          message: `Status changed from in_review → resolved (PR merged: ${issue.prUrl})`,
          metadata: JSON.stringify({
            from: "in_review",
            to: "resolved",
            prUrl: issue.prUrl,
          }),
        },
      });

      resolved.push(issue.id);
    } catch (err) {
      console.error(`Failed to check PR for issue ${issue.id}:`, err);
    }
  }

  return NextResponse.json({ resolved, checked: issues.length });
}
