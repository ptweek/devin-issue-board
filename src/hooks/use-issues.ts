"use client";

import { useState, useEffect, useCallback } from "react";
import type { Issue, Stats } from "@/lib/types";

interface UseIssuesParams {
  status?: string;
  priority?: string;
  complexity?: string;
  repo?: string;
  label?: string;
  assignee?: string;
  staleOver?: string;
  sort?: string;
  order?: string;
  search?: string;
}

export function useIssues(params: UseIssuesParams = {}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    const res = await fetch(`/api/issues?${searchParams}`);
    const data = await res.json();
    setIssues(data);
    setLoading(false);
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  return { issues, loading, refetch: fetchIssues };
}

export function useIssue(id: string | null) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchIssue = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/issues/${id}`);
    const data = await res.json();
    setIssue(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchIssue();
  }, [fetchIssue]);

  return { issue, loading, refetch: fetchIssue };
}

export function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  return { stats, loading };
}

export async function updateIssue(id: string, data: Partial<Issue> & { actor?: string }) {
  const res = await fetch(`/api/issues/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function postActivity(
  issueId: string,
  data: { eventType: string; actor: string; message: string; metadata?: Record<string, unknown> }
) {
  const res = await fetch(`/api/issues/${issueId}/activity`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
