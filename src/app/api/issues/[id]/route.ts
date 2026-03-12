import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIssue } from "@/lib/serialize";
import { v4 as uuid } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      scopingReport: true,
      activityEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!issue) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json(serializeIssue(issue));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.issue.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.complexity !== undefined) updateData.complexity = body.complexity;
  if (body.sourceUrl !== undefined) updateData.sourceUrl = body.sourceUrl;
  if (body.repo !== undefined) updateData.repo = body.repo;
  if (body.labels !== undefined) updateData.labels = JSON.stringify(body.labels);
  if (body.assignee !== undefined) updateData.assignee = body.assignee;
  if (body.scopingSessionId !== undefined) updateData.scopingSessionId = body.scopingSessionId;
  if (body.implementSessionId !== undefined) updateData.implementSessionId = body.implementSessionId;

  // Handle status changes with activity events
  if (body.status !== undefined && body.status !== existing.status) {
    updateData.status = body.status;

    await prisma.activityEvent.create({
      data: {
        id: uuid(),
        issueId: id,
        eventType: "status_change",
        actor: body.actor || "system",
        message: `Status changed from ${existing.status} → ${body.status}`,
        metadata: JSON.stringify({ from: existing.status, to: body.status }),
      },
    });
  }

  // Handle priority changes with activity events
  if (body.priority !== undefined && body.priority !== existing.priority) {
    await prisma.activityEvent.create({
      data: {
        id: uuid(),
        issueId: id,
        eventType: "priority_change",
        actor: body.actor || "system",
        message: `Priority changed from ${existing.priority} → ${body.priority}`,
        metadata: JSON.stringify({ from: existing.priority, to: body.priority }),
      },
    });
  }

  // Handle assignee changes with activity events
  if (body.assignee !== undefined && body.assignee !== existing.assignee) {
    await prisma.activityEvent.create({
      data: {
        id: uuid(),
        issueId: id,
        eventType: "assigned",
        actor: body.actor || "system",
        message: body.assignee
          ? `Assigned to ${body.assignee}`
          : "Unassigned",
        metadata: JSON.stringify({ from: existing.assignee, to: body.assignee }),
      },
    });
  }

  const updated = await prisma.issue.update({
    where: { id },
    data: updateData,
    include: { scopingReport: true, activityEvents: { orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(serializeIssue(updated));
}
