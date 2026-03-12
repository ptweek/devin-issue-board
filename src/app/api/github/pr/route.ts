import { NextRequest, NextResponse } from "next/server";

interface GitHubPRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export async function GET(request: NextRequest) {
  const prUrl = request.nextUrl.searchParams.get("url");
  if (!prUrl) {
    return NextResponse.json({ error: "url param is required" }, { status: 400 });
  }

  // Parse PR URL: https://github.com/{owner}/{repo}/pull/{number}
  const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid GitHub PR URL" }, { status: 400 });
  }

  const [, owner, repo, number] = match;
  const apiBase = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "resolver-app",
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const [prRes, filesRes] = await Promise.all([
      fetch(apiBase, { headers }),
      fetch(`${apiBase}/files`, { headers }),
    ]);

    if (!prRes.ok) {
      return NextResponse.json(
        { error: `GitHub API error: ${prRes.status}` },
        { status: prRes.status }
      );
    }

    const pr = await prRes.json();
    const files: GitHubPRFile[] = filesRes.ok ? await filesRes.json() : [];

    return NextResponse.json({
      title: pr.title,
      body: pr.body,
      state: pr.state,
      merged: pr.merged,
      additions: pr.additions,
      deletions: pr.deletions,
      changedFiles: pr.changed_files,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      mergedAt: pr.merged_at,
      user: pr.user?.login,
      headBranch: pr.head?.ref,
      baseBranch: pr.base?.ref,
      files: files.map((f) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch PR: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  }
}
