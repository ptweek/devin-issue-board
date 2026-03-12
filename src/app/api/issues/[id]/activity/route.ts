import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeActivityEvent } from "@/lib/serialize";
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

  const event = await prisma.activityEvent.create({
    data: {
      id: uuid(),
      issueId: id,
      eventType: body.eventType,
      actor: body.actor || "system",
      message: body.message,
      metadata: JSON.stringify(body.metadata || {}),
    },
  });

  // Update the issue's updatedAt
  await prisma.issue.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(serializeActivityEvent(event), { status: 201 });
}
