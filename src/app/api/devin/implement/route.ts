import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, getPlaybookId } from "@/lib/devin";
import { buildImplementationPrompt } from "@/lib/prompts";
import { serializeIssue, serializeScopingReport } from "@/lib/serialize";
import { v4 as uuid } from "uuid";
import type { Issue, ScopingReport } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { issueId, approach } = await request.json();

  if (!issueId) {
    return NextResponse.json({ error: "issueId is required" }, { status: 400 });
  }

  const dbIssue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: { scopingReport: true },
  });

  if (!dbIssue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  if (!dbIssue.scopingReport) {
    return NextResponse.json(
      { error: "Issue has no scoping report. Run scoping first." },
      { status: 400 }
    );
  }

  // Resolve playbook
  let playbookId: string;
  try {
    playbookId = await getPlaybookId("Implement");
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to resolve playbook: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }

  // Build prompt
  const issue = serializeIssue(dbIssue) as unknown as Issue;
  const scopingReport = serializeScopingReport(dbIssue.scopingReport) as unknown as ScopingReport;
  const prompt = buildImplementationPrompt(issue, scopingReport, approach);

  // Create Devin session with "Implement" playbook
  const session = await createSession({
    prompt,
    playbook_id: playbookId,
    tags: ["implement", issueId],
  });

  // Update issue
  await prisma.issue.update({
    where: { id: issueId },
    data: {
      status: "in_progress",
      assignee: "devin",
      devinSessionId: session.session_id,
    },
  });

  // Log activity
  await prisma.activityEvent.create({
    data: {
      id: uuid(),
      issueId,
      eventType: "agent_fix_started",
      actor: "devin",
      message: approach
        ? "Agent started implementation with updated plan"
        : "Agent started implementation",
      metadata: JSON.stringify({
        devinSessionId: session.session_id,
        devinUrl: session.url,
        approachOverridden: !!approach,
      }),
    },
  });

  return NextResponse.json({
    issueId,
    sessionId: session.session_id,
    sessionUrl: session.url,
  });
}
