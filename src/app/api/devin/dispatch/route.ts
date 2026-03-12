import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, getPlaybookId } from "@/lib/devin";
import { detectWorkflowType, buildScopingPrompt, getScopingOutputSchema } from "@/lib/prompts";
import { serializeIssue } from "@/lib/serialize";
import { v4 as uuid } from "uuid";
import type { Issue } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { issueIds } = await request.json();

  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    return NextResponse.json(
      { error: "issueIds must be a non-empty array" },
      { status: 400 }
    );
  }

  // Resolve the "Plan & Prioritize" playbook ID
  let playbookId: string;
  try {
    playbookId = await getPlaybookId("Plan & Prioritize");
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to resolve playbook: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }

  // Fetch all issues
  const issues = await prisma.issue.findMany({
    where: { id: { in: issueIds } },
    include: { scopingReport: true },
  });

  const issueMap = new Map(issues.map((i) => [i.id, i]));

  const results = await Promise.allSettled(
    issueIds.map(async (issueId: string) => {
      const dbIssue = issueMap.get(issueId);
      if (!dbIssue) throw new Error(`Issue ${issueId} not found`);

      // Serialize for prompt building (prompts.ts expects the Issue type)
      const issue = serializeIssue(dbIssue) as unknown as Issue;
      const workflowType = detectWorkflowType(issue);
      const prompt = buildScopingPrompt(issue, workflowType);

      // Create Devin session with "Plan & Prioritize" playbook
      const session = await createSession({
        prompt,
        playbook_id: playbookId,
        structured_output_schema: getScopingOutputSchema(),
        idempotent: true,
        tags: [workflowType, issueId],
      });

      // Update issue status
      await prisma.issue.update({
        where: { id: issueId },
        data: {
          status: "scoping",
          assignee: "devin",
          devinSessionId: session.session_id,
        },
      });

      // Log activity event
      await prisma.activityEvent.create({
        data: {
          id: uuid(),
          issueId,
          eventType: "agent_scoping_started",
          actor: "devin",
          message: `Agent started scoping this issue (${workflowType === "bug_triage" ? "Bug Triage" : "Feature Development"})`,
          metadata: JSON.stringify({
            workflowType,
            devinSessionId: session.session_id,
            devinUrl: session.url,
          }),
        },
      });

      return {
        issueId,
        sessionId: session.session_id,
        sessionUrl: session.url,
        workflowType,
      };
    })
  );

  const dispatched: Array<{ issueId: string; sessionId: string; sessionUrl: string; workflowType: string }> = [];
  const failed: Array<{ issueId: string; error: string }> = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      dispatched.push(r.value);
    } else {
      failed.push({
        issueId: issueIds[i],
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  });

  return NextResponse.json({ dispatched, failed });
}
