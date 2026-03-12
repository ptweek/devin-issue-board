import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeScopingReport } from "@/lib/serialize";
import { v4 as uuid } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const existing = await prisma.scopingReport.findUnique({ where: { issueId: id } });
  if (existing) {
    return NextResponse.json({ error: "Scoping report already exists. Use PATCH to update." }, { status: 409 });
  }

  const report = await prisma.scopingReport.create({
    data: {
      id: uuid(),
      issueId: id,
      summary: body.summary,
      affectedFiles: JSON.stringify(body.affectedFiles || []),
      rootCauseHypothesis: body.rootCauseHypothesis,
      suggestedApproach: body.suggestedApproach,
      estimatedEffort: body.estimatedEffort,
      datadogFindings: body.datadogFindings || null,
      dataLayerFindings: body.dataLayerFindings || null,
      confidence: body.confidence || "medium",
      openQuestions: JSON.stringify(body.openQuestions || []),
    },
  });

  // Update issue status to ready
  await prisma.issue.update({
    where: { id },
    data: { status: "ready" },
  });

  // Log activity
  await prisma.activityEvent.create({
    data: {
      id: uuid(),
      issueId: id,
      eventType: "agent_scoping_complete",
      actor: "devin",
      message: "Agent completed scoping — findings submitted",
      metadata: JSON.stringify({ confidence: body.confidence }),
    },
  });

  return NextResponse.json(serializeScopingReport(report), { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.scopingReport.findUnique({ where: { issueId: id } });
  if (!existing) {
    return NextResponse.json({ error: "No scoping report found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.summary !== undefined) updateData.summary = body.summary;
  if (body.affectedFiles !== undefined) updateData.affectedFiles = JSON.stringify(body.affectedFiles);
  if (body.rootCauseHypothesis !== undefined) updateData.rootCauseHypothesis = body.rootCauseHypothesis;
  if (body.suggestedApproach !== undefined) updateData.suggestedApproach = body.suggestedApproach;
  if (body.estimatedEffort !== undefined) updateData.estimatedEffort = body.estimatedEffort;
  if (body.datadogFindings !== undefined) updateData.datadogFindings = body.datadogFindings;
  if (body.dataLayerFindings !== undefined) updateData.dataLayerFindings = body.dataLayerFindings;
  if (body.confidence !== undefined) updateData.confidence = body.confidence;
  if (body.openQuestions !== undefined) updateData.openQuestions = JSON.stringify(body.openQuestions);

  const updated = await prisma.scopingReport.update({
    where: { issueId: id },
    data: updateData,
  });

  return NextResponse.json(serializeScopingReport(updated));
}
