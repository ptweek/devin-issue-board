import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, getPlaybookId, extractPullRequests } from "@/lib/devin";
import { routeAfterScoping } from "@/lib/routing";
import { buildImplementationPrompt } from "@/lib/prompts";
import { serializeIssue } from "@/lib/serialize";
import { v4 as uuid } from "uuid";
import type { Confidence, Issue } from "@/lib/types";

export async function POST() {
  // Find all issues with active Devin sessions (scoping or implementation)
  const activeIssues = await prisma.issue.findMany({
    where: {
      OR: [
        { scopingSessionId: { not: null }, status: "scoping" },
        { implementSessionId: { not: null }, status: "in_progress" },
      ],
    },
    include: { scopingReport: true },
  });

  if (activeIssues.length === 0) {
    return NextResponse.json({ updated: [], stillActive: 0 });
  }

  const updated: Array<{ issueId: string; newStatus: string; detail?: string }> = [];
  let stillActive = 0;

  for (const dbIssue of activeIssues) {
    // Pick the right session ID based on the issue's current phase
    const sessionId = dbIssue.status === "scoping"
      ? dbIssue.scopingSessionId
      : dbIssue.implementSessionId;

    if (!sessionId) continue;

    try {
      const session = await getSession(sessionId);

      // Session still running — but if output is already available, treat as complete
      // (Devin emits structured output / creates PRs before the session fully exits)
      if (session.status === "running" && session.status_detail !== "finished") {
        const hasStructuredOutput = session.structured_output && Object.keys(session.structured_output).length > 0;
        const hasPRs = extractPullRequests(session).length > 0;
        if (dbIssue.status === "scoping" && hasStructuredOutput) {
          // Fall through to completion handling below
        } else if (dbIssue.status === "in_progress" && hasPRs) {
          // Fall through to completion handling below
        } else {
          stillActive++;
          continue;
        }
      }

      // Session is new or claimed (still starting up)
      if (session.status === "new" || session.status === "claimed" || session.status === "resuming") {
        stillActive++;
        continue;
      }

      // Session errored or suspended — recover what we can
      if (session.status === "error" || session.status === "suspended") {
        const hasOutput = session.structured_output && Object.keys(session.structured_output).length > 0;
        const hasPRs = extractPullRequests(session).length > 0;

        if (dbIssue.status === "scoping" && hasOutput) {
          // Ingest the output even though the session didn't exit cleanly
          await handleScopingComplete(dbIssue, session);
          await prisma.activityEvent.create({
            data: {
              id: uuid(),
              issueId: dbIssue.id,
              eventType: "comment",
              actor: "system",
              message: `Devin session ${session.status} — scoping output was recovered`,
              metadata: JSON.stringify({
                sessionId: session.session_id,
                devinStatus: session.status,
              }),
            },
          });
          updated.push({ issueId: dbIssue.id, newStatus: "routed", detail: `${session.status} (output recovered)` });
        } else if (dbIssue.status === "in_progress" && hasPRs) {
          // Implementation session errored but a PR exists — treat as complete
          await handleFixComplete(dbIssue, session);
          await prisma.activityEvent.create({
            data: {
              id: uuid(),
              issueId: dbIssue.id,
              eventType: "comment",
              actor: "system",
              message: `Devin session ${session.status} — PR was recovered`,
              metadata: JSON.stringify({
                sessionId: session.session_id,
                devinStatus: session.status,
              }),
            },
          });
          updated.push({ issueId: dbIssue.id, newStatus: "in_review", detail: `${session.status} (PR recovered)` });
        } else {
          await prisma.activityEvent.create({
            data: {
              id: uuid(),
              issueId: dbIssue.id,
              eventType: "comment",
              actor: "system",
              message: `Devin session ${session.status}: ${session.status_detail || "unknown reason"}`,
              metadata: JSON.stringify({
                sessionId: session.session_id,
                devinStatus: session.status,
                devinStatusDetail: session.status_detail,
              }),
            },
          });
          // Clear the relevant session so the issue isn't stuck
          const clearData = dbIssue.status === "scoping"
            ? { scopingSessionId: null }
            : { implementSessionId: null };
          await prisma.issue.update({
            where: { id: dbIssue.id },
            data: clearData,
          });
          updated.push({ issueId: dbIssue.id, newStatus: dbIssue.status, detail: session.status });
        }
        continue;
      }

      // Session completed (status === "exit" or status_detail === "finished")
      if (dbIssue.status === "scoping") {
        await handleScopingComplete(dbIssue, session);
        updated.push({ issueId: dbIssue.id, newStatus: "routed" });
      } else if (dbIssue.status === "in_progress") {
        await handleFixComplete(dbIssue, session);
        updated.push({ issueId: dbIssue.id, newStatus: "in_review" });
      }
    } catch (err) {
      console.error(`Failed to poll session for issue ${dbIssue.id}:`, err);
    }
  }

  return NextResponse.json({ updated, stillActive });
}

async function handleScopingComplete(
  dbIssue: Awaited<ReturnType<typeof prisma.issue.findFirst>> & { scopingReport?: unknown },
  session: Awaited<ReturnType<typeof getSession>>
) {
  if (!dbIssue) return;

  const output = session.structured_output || {};

  // Create scoping report from structured output
  const confidence = (output.confidence as Confidence) || "medium";
  const priority = (output.priority as string) || dbIssue.priority;

  // Only create scoping report if one doesn't exist
  const existingReport = await prisma.scopingReport.findUnique({
    where: { issueId: dbIssue.id },
  });

  if (!existingReport) {
    await prisma.scopingReport.create({
      data: {
        id: uuid(),
        issueId: dbIssue.id,
        summary: (output.summary as string) || "Scoping complete — no summary provided",
        affectedFiles: JSON.stringify(output.affectedFiles || []),
        rootCauseHypothesis: (output.rootCauseHypothesis as string) || "",
        suggestedApproach: (output.suggestedApproach as string) || "",
        estimatedEffort: (output.estimatedEffort as string) || "unknown",
        datadogFindings: output.datadogFindings ? JSON.stringify(output.datadogFindings) : null,
        dataLayerFindings: output.dataLayerFindings ? JSON.stringify(output.dataLayerFindings) : null,
        confidence,
        openQuestions: JSON.stringify(output.openQuestions || []),
      },
    });
  }

  // Log completion
  await prisma.activityEvent.create({
    data: {
      id: uuid(),
      issueId: dbIssue.id,
      eventType: "agent_scoping_complete",
      actor: "devin",
      message: `Agent completed scoping with ${confidence} confidence`,
      metadata: JSON.stringify({
        confidence,
        sessionId: session.session_id,
      }),
    },
  });

  // Always update priority from Devin's recommendation
  await prisma.issue.update({
    where: { id: dbIssue.id },
    data: { priority },
  });

  // Apply routing logic
  const routing = routeAfterScoping(confidence);

  if (routing.autoDispatch) {
    // High confidence: auto-dispatch implementation
    await autoDispatchImplementation(dbIssue, output);
  } else {
    // Medium/Low: set to ready for human review
    await prisma.issue.update({
      where: { id: dbIssue.id },
      data: {
        status: routing.nextStatus,
        assignee: routing.assignee,
      },
    });
  }
}

async function autoDispatchImplementation(
  dbIssue: NonNullable<Awaited<ReturnType<typeof prisma.issue.findFirst>>>,
  scopingOutput: Record<string, unknown>
) {
  try {
    const playbookId = await getPlaybookId("Implement Feature");

    // Build issue type for prompt
    const issue = serializeIssue(dbIssue) as unknown as Issue;
    const scopingReport = {
      id: "",
      issueId: dbIssue.id,
      summary: (scopingOutput.summary as string) || "",
      affectedFiles: (scopingOutput.affectedFiles as string[]) || [],
      rootCauseHypothesis: (scopingOutput.rootCauseHypothesis as string) || "",
      suggestedApproach: (scopingOutput.suggestedApproach as string) || "",
      estimatedEffort: (scopingOutput.estimatedEffort as string) || "",
      datadogFindings: scopingOutput.datadogFindings ? JSON.stringify(scopingOutput.datadogFindings) : null,
      dataLayerFindings: scopingOutput.dataLayerFindings ? JSON.stringify(scopingOutput.dataLayerFindings) : null,
      confidence: (scopingOutput.confidence as "high" | "medium" | "low") || "medium",
      openQuestions: (scopingOutput.openQuestions as string[]) || [],
      createdAt: new Date().toISOString(),
    };

    const prompt = buildImplementationPrompt(issue, scopingReport);

    const session = await createSession({
      prompt,
      playbook_id: playbookId,
      tags: ["implement", dbIssue.id],
    });

    await prisma.issue.update({
      where: { id: dbIssue.id },
      data: {
        status: "in_progress",
        assignee: "devin",
        implementSessionId: session.session_id,
        // Priority already set in handleScopingComplete
        // scopingSessionId is preserved so we keep the history
      },
    });

    await prisma.activityEvent.create({
      data: {
        id: uuid(),
        issueId: dbIssue.id,
        eventType: "agent_fix_started",
        actor: "devin",
        message: "Agent auto-dispatched for implementation (high confidence)",
        metadata: JSON.stringify({
          sessionId: session.session_id,
          devinUrl: session.url,
          autoDispatched: true,
        }),
      },
    });
  } catch (err) {
    console.error(`Failed to auto-dispatch implementation for issue ${dbIssue.id}:`, err);
    // Fall back to ready status
    await prisma.issue.update({
      where: { id: dbIssue.id },
      data: { status: "ready", assignee: null },
    });
  }
}

async function handleFixComplete(
  dbIssue: NonNullable<Awaited<ReturnType<typeof prisma.issue.findFirst>>>,
  session: Awaited<ReturnType<typeof getSession>>
) {
  const prs = extractPullRequests(session);
  const prUrls = prs.map((pr) => pr.pr_url);
  const prUrl = prUrls.length > 0 ? prUrls[0] : null;

  await prisma.issue.update({
    where: { id: dbIssue.id },
    data: { status: "in_review", prUrl, implementSessionId: null },
  });

  await prisma.activityEvent.create({
    data: {
      id: uuid(),
      issueId: dbIssue.id,
      eventType: "agent_fix_complete",
      actor: "devin",
      message: prUrls.length > 0
        ? `Agent completed fix — PR: ${prUrls.join(", ")}`
        : "Agent completed fix",
      metadata: JSON.stringify({
        sessionId: session.session_id,
        pullRequests: prs,
      }),
    },
  });
}
