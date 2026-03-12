import type { Issue, ScopingReport } from "@/lib/types";

export type WorkflowType = "bug_triage" | "feature_dev";

const BUG_KEYWORDS = [
  "bug", "error", "crash", "broken", "fix", "fail", "exception",
  "regression", "defect", "issue", "incorrect", "wrong", "null",
  "undefined", "timeout", "500", "404", "stacktrace",
];

const FEATURE_KEYWORDS = [
  "feature", "enhancement", "add", "implement", "support",
  "create", "new", "introduce", "enable", "allow", "improve",
];

export function detectWorkflowType(issue: Issue): WorkflowType {
  const labels = issue.labels.map((l) => l.toLowerCase());

  if (labels.includes("bug")) return "bug_triage";
  if (labels.includes("feature") || labels.includes("enhancement")) return "feature_dev";

  const text = `${issue.title} ${issue.description}`.toLowerCase();
  const bugScore = BUG_KEYWORDS.filter((kw) => text.includes(kw)).length;
  const featureScore = FEATURE_KEYWORDS.filter((kw) => text.includes(kw)).length;

  return bugScore >= featureScore ? "bug_triage" : "feature_dev";
}

export function buildScopingPrompt(issue: Issue, workflowType: WorkflowType): string {
  const baseContext = `
## Issue Details
- **Title**: ${issue.title}
- **Repository**: ${issue.repo}
- **Current Priority**: ${issue.priority}
- **Complexity**: ${issue.complexity}
- **Labels**: ${issue.labels.join(", ") || "none"}
${issue.sourceUrl ? `- **Source URL**: ${issue.sourceUrl}` : ""}

## Description
${issue.description}
`.trim();

  if (workflowType === "bug_triage") {
    return `
You are triaging a bug report. Your goal is to deeply understand this bug, identify its root cause, and create an actionable plan to fix it.

${baseContext}

## Your Tasks

1. **Understand the Bug**: Analyze the issue description carefully. Identify what the expected behavior is vs. what is actually happening.

2. **Investigate the Codebase**: Use your access to the repository to:
   - Find the affected files and code paths
   - Trace the execution flow that leads to the bug
   - Identify the root cause

3. **Check Monitoring & Data** (if available via MCP):
   - Review DataDog logs for related errors, stack traces, and event patterns
   - Query the database to understand the data layer state and find relevant examples
   - Look for error frequency, affected users, and blast radius

4. **Create a Scoping Report**: Provide your findings as structured output with:
   - A clear summary of the bug and its impact
   - The affected files and code paths
   - Your root cause hypothesis
   - A step-by-step approach to fix the bug
   - Estimated effort (trivial, small, medium, large)
   - Your confidence level in this plan (high, medium, low)
   - Any open questions that need human input
   - Your recommended priority (critical, high, medium, low) based on impact analysis
   - Any DataDog findings (error rates, stack traces, affected endpoints)
   - Any data layer findings (data inconsistencies, schema issues)
`.trim();
  }

  return `
You are scoping a feature request. Your goal is to deeply understand the feature, design an implementation approach, and create an actionable development plan.

${baseContext}

## Your Tasks

1. **Understand the Feature**: Analyze the feature request. Identify the user need, the expected behavior, and how it fits into the existing product.

2. **Investigate the Codebase**: Use your access to the repository to:
   - Understand the current architecture and relevant code patterns
   - Identify where the feature would be implemented
   - Find existing utilities, components, or patterns to reuse
   - Assess integration points and potential conflicts

3. **Design the Implementation**: Think about:
   - The best architectural approach for this feature
   - Breaking the work into logical steps
   - Edge cases and error handling
   - Testing strategy
   - Any database schema changes needed

4. **Create a Scoping Report**: Provide your findings as structured output with:
   - A clear summary of the feature and its value
   - The files that will need to be created or modified
   - Your recommended implementation approach (step-by-step)
   - Estimated effort (trivial, small, medium, large)
   - Your confidence level in this plan (high, medium, low)
   - Any open questions or design decisions that need human input
   - Your recommended priority (critical, high, medium, low) based on value assessment
`.trim();
}

export function buildImplementationPrompt(
  issue: Issue,
  scopingReport: ScopingReport,
  approachOverride?: string
): string {
  const approach = approachOverride || scopingReport.suggestedApproach;

  return `
You are implementing a fix/feature based on a completed scoping report. Follow the implementation plan precisely and create a pull request when done.

## Issue Details
- **Title**: ${issue.title}
- **Repository**: ${issue.repo}
- **Priority**: ${issue.priority}

## Description
${issue.description}

## Scoping Report Summary
${scopingReport.summary}

## Root Cause / Hypothesis
${scopingReport.rootCauseHypothesis}

## Implementation Plan
${approach}

## Affected Files
${scopingReport.affectedFiles.map((f) => `- ${f}`).join("\n")}

## Estimated Effort
${scopingReport.estimatedEffort}

${scopingReport.openQuestions.length > 0 ? `## Open Questions (use your best judgment)\n${scopingReport.openQuestions.map((q) => `- ${q}`).join("\n")}` : ""}

## Instructions
1. Follow the implementation plan above
2. Write clean, well-tested code that follows the existing patterns in the repository
3. Create a pull request with a clear description of the changes
4. Include any relevant tests
`.trim();
}

export function getScopingOutputSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Clear summary of the issue/feature and its impact",
      },
      affectedFiles: {
        type: "array",
        items: { type: "string" },
        description: "List of file paths that are affected or need changes",
      },
      rootCauseHypothesis: {
        type: "string",
        description: "Root cause analysis for bugs, or architectural rationale for features",
      },
      suggestedApproach: {
        type: "string",
        description: "Step-by-step implementation plan",
      },
      estimatedEffort: {
        type: "string",
        enum: ["trivial", "small", "medium", "large"],
        description: "Estimated implementation effort",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description: "Confidence level in the implementation plan",
      },
      openQuestions: {
        type: "array",
        items: { type: "string" },
        description: "Questions that need human input before proceeding",
      },
      priority: {
        type: "string",
        enum: ["critical", "high", "medium", "low"],
        description: "Recommended priority based on impact/value analysis",
      },
      datadogFindings: {
        type: ["object", "null"],
        description: "Structured findings from Datadog investigation",
        properties: {
          investigationRationale: {
            type: "string",
            description: "Why you looked at Datadog — what signal were you trying to find?",
          },
          searches: {
            type: "array",
            items: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "The Datadog query/filter used" },
                    url: { type: "string", description: "Direct Datadog URL for this search query" },
                  },
                  required: ["query"],
                },
              ],
            },
            description: "Queries/filters/time windows you searched — include the Datadog URL for each so reviewers can click through",
          },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["error", "latency", "trace", "monitor", "log"],
                  description: "Category of finding",
                },
                title: { type: "string", description: "Brief title of the finding" },
                detail: { type: "string", description: "Details — error messages, stack traces, metrics" },
                severity: {
                  type: "string",
                  enum: ["critical", "warning", "info"],
                  description: "How severe this finding is",
                },
                url: {
                  type: "string",
                  description: "Direct Datadog URL to the relevant log, trace, monitor, or dashboard for this finding",
                },
              },
              required: ["type", "title", "detail"],
            },
            description: "Individual findings from Datadog",
          },
          productionStatus: {
            type: "string",
            enum: ["ongoing", "resolved", "intermittent", "unknown"],
            description: "Current production status of the issue",
          },
          impactOnScoping: {
            type: "string",
            description: "How these findings change your understanding of the issue's scope or priority",
          },
        },
        required: ["investigationRationale", "findings", "productionStatus", "impactOnScoping"],
      },
      dataLayerFindings: {
        type: ["object", "null"],
        description: "Structured findings from Prisma/data layer investigation",
        properties: {
          investigationRationale: {
            type: "string",
            description: "Why you inspected the production data",
          },
          modelsExamined: {
            type: "array",
            items: { type: "string" },
            description: "Which models/tables you inspected",
          },
          findings: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["schema", "data", "index", "constraint", "relationship"],
                  description: "Category of finding",
                },
                title: { type: "string", description: "Brief title of the finding" },
                detail: { type: "string", description: "Details — row counts, data shape, constraints" },
              },
              required: ["type", "title", "detail"],
            },
            description: "Individual findings from data layer investigation",
          },
          schemaVsReality: {
            type: ["string", "null"],
            description: "Any discrepancies between schema.prisma and actual production state",
          },
          impactOnScoping: {
            type: "string",
            description: "How findings inform complexity, approach, or risk",
          },
        },
        required: ["investigationRationale", "findings", "impactOnScoping"],
      },
    },
    required: [
      "summary",
      "affectedFiles",
      "rootCauseHypothesis",
      "suggestedApproach",
      "estimatedEffort",
      "confidence",
      "openQuestions",
      "priority",
    ],
  };
}
