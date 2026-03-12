const DEVIN_API_KEY = process.env.DEVIN_API_KEY;
const BASE_URL = "https://api.devin.ai/v1";

// --- Types ---

export type DevinSessionStatus =
  | "new"
  | "claimed"
  | "running"
  | "exit"
  | "error"
  | "suspended"
  | "resuming";

export type DevinStatusDetail =
  | "working"
  | "waiting_for_user"
  | "waiting_for_approval"
  | "finished"
  | "inactivity"
  | "user_request"
  | "usage_limit_exceeded"
  | "out_of_credits"
  | "error";

export interface DevinSession {
  session_id: string;
  url: string;
  status: DevinSessionStatus;
  status_detail?: DevinStatusDetail | null;
  structured_output?: Record<string, unknown> | null;
  // API can return either shape depending on session state
  pull_requests?: Array<{ pr_url: string; pr_state: string }>;
  pull_request?: { url: string } | null;
  title?: string | null;
  tags: string[];
  created_at: number;
  updated_at: number;
  acus_consumed: number;
  playbook_id?: string | null;
}

export interface DevinPlaybook {
  playbook_id: string;
  title: string;
  body: string;
  status: string;
  access_type: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  created_by_user_name: string;
}

export interface CreateSessionOptions {
  prompt: string;
  playbook_id?: string;
  structured_output_schema?: Record<string, unknown>;
  idempotent?: boolean;
  tags?: string[];
}

export interface CreateSessionResponse {
  session_id: string;
  url: string;
  is_new_session?: boolean | null;
}

// --- Helpers ---

function assertConfigured(): void {
  if (!DEVIN_API_KEY) throw new Error("DEVIN_API_KEY is not configured");
}

async function devinFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  assertConfigured();

  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${DEVIN_API_KEY}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Devin API error ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// --- API Functions ---

export async function listPlaybooks(): Promise<DevinPlaybook[]> {
  return devinFetch<DevinPlaybook[]>(
    `https://api.devin.ai/v1/playbooks`
  );
}

let playbookCache: Map<string, string> | null = null;

export async function getPlaybookId(title: string): Promise<string> {
  if (!playbookCache) {
    const playbooks = await listPlaybooks();
    playbookCache = new Map(playbooks.map((p) => [p.title, p.playbook_id]));
  }
  const id = playbookCache.get(title);
  if (!id) throw new Error(`Playbook "${title}" not found`);
  return id;
}

export async function createSession(
  options: CreateSessionOptions
): Promise<CreateSessionResponse> {
  return devinFetch<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify(options),
  });
}

export function normalizeSessionId(sessionId: string): string {
  return sessionId.startsWith("devin-") ? sessionId.slice(6) : sessionId;
}

/**
 * Normalize PR data from the Devin API, which can return either:
 * - `pull_requests`: Array<{ pr_url, pr_state }>  (documented shape)
 * - `pull_request`: { url }                        (actual API shape)
 */
export function extractPullRequests(
  session: DevinSession
): Array<{ pr_url: string; pr_state: string }> {
  if (session.pull_requests && session.pull_requests.length > 0) {
    return session.pull_requests;
  }
  if (session.pull_request?.url) {
    return [{ pr_url: session.pull_request.url, pr_state: "open" }];
  }
  return [];
}

export async function getSession(sessionId: string): Promise<DevinSession> {
  return devinFetch<DevinSession>(`/sessions/${normalizeSessionId(sessionId)}`);
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<void> {
  await devinFetch(`/sessions/${normalizeSessionId(sessionId)}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
