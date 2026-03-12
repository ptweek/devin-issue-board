import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeIssue } from "@/lib/serialize";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const status = params.get("status");
  const priority = params.get("priority");
  const complexity = params.get("complexity");
  const repo = params.get("repo");
  const label = params.get("label");
  const assignee = params.get("assignee");
  const staleOver = params.get("staleOver");
  const sort = params.get("sort") || "staleDays";
  const order = params.get("order") || "desc";
  const search = params.get("search");

  const where: Record<string, unknown> = {};
  if (status) {
    if (status.includes(",")) {
      where.status = { in: status.split(",") };
    } else {
      where.status = status;
    }
  }
  if (priority) where.priority = priority;
  if (complexity) where.complexity = complexity;
  if (repo) where.repo = repo;
  if (assignee) where.assignee = assignee === "unassigned" ? null : assignee;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }
  if (label) {
    where.labels = { contains: label };
  }

  const sortMap: Record<string, Record<string, string>> = {
    staleDays: { updatedAt: "asc" },
    priority: { priority: order },
    complexity: { complexity: order },
    updatedAt: { updatedAt: order },
    createdAt: { createdAt: order },
  };

  const issues = await prisma.issue.findMany({
    where: where as never,
    orderBy: sortMap[sort] || { updatedAt: "asc" },
    include: { scopingReport: true },
  });

  let serialized = issues.map(serializeIssue);

  if (staleOver) {
    const threshold = parseInt(staleOver);
    serialized = serialized.filter((i) => i.staleDays >= threshold);
  }

  return NextResponse.json(serialized);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const issues = Array.isArray(body) ? body : [body];
  const created = [];

  for (const issueData of issues) {
    const issue = await prisma.issue.create({
      data: {
        id: uuid(),
        title: issueData.title,
        description: issueData.description || "",
        status: issueData.status || "untriaged",
        priority: issueData.priority || "unprioritized",
        complexity: issueData.complexity || "unknown",
        sourceUrl: issueData.sourceUrl || null,
        repo: issueData.repo || "unknown",
        labels: JSON.stringify(issueData.labels || []),
        assignee: issueData.assignee || null,
      },
    });

    await prisma.activityEvent.create({
      data: {
        id: uuid(),
        issueId: issue.id,
        eventType: "status_change",
        actor: "system",
        message: "Issue created with status untriaged",
        metadata: JSON.stringify({ from: null, to: "untriaged" }),
      },
    });

    created.push(serializeIssue(issue));
  }

  return NextResponse.json(created.length === 1 ? created[0] : created, { status: 201 });
}
