# Plan Implementation

## Overview
This playbook guides the process of gathering all necessary context for a Resolver issue before implementation begins. The workflow ensures thorough understanding of relevant files, systems, external information, and other details. The output is a concise overview of all important information related to the issue. The agent uses the Resolver API to manage issue status, activity, and scoping reports.

## What's Needed From User
- Resolver issue ID (UUID) or issue title/search term
- Repository access for the codebase where changes will be made

## Context Gathering Phase
Think about the full user intent. Issues are sometimes sparse. Make sure you disambiguate to the full scope that the user intended.

1. Fetch the issue details using `GET /api/issues/{id}` — this returns the issue with its scoping report (if any) and full activity event history
2. Review all activity events on the issue — activity events often contain critical context, clarifications, design decisions, or updated requirements that aren't in the main description. Pay attention to `comment` events and `agent_scoping_complete` events which may contain prior analysis.
3. Before diving into code: use the Devin MCP to get a high-level understanding of the relevant systems and architecture. Use `ask_question` to learn about the relevant systems – send queries for multiple repos that could be relevant to get the full picture. Use `read_wiki_contents` to then get a better understanding how different parts of the codebase connect to each other.
4. **Determine if observability or data-layer investigation would help clarify the issue:**
   - If the issue describes a bug, performance issue, error, unexpected behavior, or mentions logs/errors/latency/timeouts: use the **Datadog MCP** to search for relevant signals. See the [Datadog Debugging](#datadog-debugging) section below.
   - If the issue touches the data layer — queries, data integrity, schema, missing/incorrect data, or data-dependent behavior: use the **Prisma MCP** to inspect the production database. See the [Prisma Data Investigation](#prisma-data-investigation) section below.
   - You do not need explicit instructions to use these tools. If the issue _could_ benefit from observability or data-layer context, investigate proactively.
5. Gather additional context to understand what the issue means and refers to:
   - Use `GET /api/issues?search={term}` to find related issues in Resolver by keyword
   - Filter by repo (`?repo={repo}`) or labels (`?label={label}`) to find issues in the same area
   - Search for related commits and PRs (by author and content) that may provide context on the affected systems
   - Check the issue's `sourceUrl` if present — this links to the original external issue (e.g., GitHub)
6. Investigate the actual code
7. Identify any ambiguity in what the issue refers to or asks for, including jargon or project-specific terms and use all means necessary to answer this yourself
8. If there is critical ambiguity you are unable to resolve: Send a brief message with the specific clarifying questions, then stop and wait for answers
9. If the issue's meaning is clear: proceed to the Research phase (after completing verification)

### Datadog Debugging
Use the Datadog MCP whenever the issue involves or could involve runtime behavior — bugs, errors, latency, failed jobs, unexpected responses, or anything that would leave a trace in logs, APM, or monitors. The goal is to move from "what the issue says" to "what actually happened in production."

**When to use Datadog:**
- The issue mentions an error, crash, timeout, or degraded experience
- The issue describes behavior that "sometimes" happens or is intermittent
- The issue references a specific time window, user, or request
- You suspect a performance regression or infrastructure issue
- You want to verify whether a reported issue is still actively occurring
- The issue is vague and production signals could clarify the real scope

**How to investigate:**
1. Start broad: search logs and APM traces for the affected service, endpoint, or error message
2. Narrow down: filter by time window, environment (production), error type, status codes, or user identifiers mentioned in the issue
3. Check monitors and dashboards for the affected service to see if there are active alerts or recent anomalies
4. Look at related traces to understand latency distribution, error rates, and downstream dependency failures
5. If the issue involves a background job or async process, search for relevant worker logs and job execution traces

**What to record (for the Resolver activity event):**
- What you searched for and why (your reasoning for the investigation path)
- Key findings: error messages, stack traces, frequency/volume, affected time windows, impacted users or endpoints
- Whether the issue is ongoing, resolved, or intermittent based on the data
- How the findings change your understanding of the issue's scope or priority

### Prisma Data Investigation
Use the Prisma MCP whenever the issue involves the data layer — not just for schema changes, but also for understanding the current state of production data when it could inform the issue.

**When to use Prisma:**
- The issue involves data that looks wrong, missing, or inconsistent
- You need to understand the shape or volume of data in affected tables
- The issue involves a query that might be slow or returning unexpected results
- You want to verify foreign key relationships, constraints, or indexes before proposing changes
- The issue involves a feature that depends on specific data conditions (e.g., "users with X but not Y")

**How to investigate:**
1. Use `IntrospectSchemaTool` to get the current production schema for affected models
2. Use `Prisma-Studio` to visually explore production data: row counts, relationship cardinality, and data shape
3. Cross-reference what you see in production with the `schema.prisma` file and migration history in the repo
4. Trace Prisma Client usage in the affected code paths to understand how the application queries the data

**What to record (for the Resolver activity event):**
- Which models/tables you inspected and why
- Key findings: data shape, row counts, relationship patterns, missing indexes, constraint issues
- Whether the current production data matches what the code and schema expect
- How the findings inform the scope, complexity, or approach of the issue

### Context Gathering Verification Checklist
- Are you thinking about the right repo? Does this intent actually cover multiple repos?
- Is this a frontend change? Or backend? Infra? All the above?
- **Does this issue involve data model changes, new queries, or migrations? Are there existing Prisma schema relations or constraints that could be affected?**
- **Could production logs, traces, or monitors in Datadog clarify the issue's scope or root cause? If so, did you investigate?**
- **Could inspecting production data via Prisma clarify data-dependent behavior or verify assumptions? If so, did you investigate?**
- What is the change in user experience that the author intended?
- The scope covers the full user intent, not just the literal issue text
- Did you try everything in your power to resolve ambiguous aspects before asking the user for help?
- You are smart so you can make good assumptions if you researched them well. Don't block on the user for preferences. Just simulate what the user would want and do that.
- Did you review all activity events on the issue?

## Research Phase

1. Update the issue status to "in_progress" using `PATCH /api/issues/{id}` with `{ "status": "in_progress" }`. Available statuses are: `untriaged`, `scoping`, `ready`, `in_progress`, `in_review`, `resolved`, `wont_fix`.

2. **Identify all relevant files and modules:**
   - Search for files that will need to be modified
   - Identify related configuration files, tests, and documentation
   - Map out the directory structure of affected areas

3. **Investigate database schema and data model (Prisma MCP — Remote Production DB):**
   If the issue touches the data layer — new fields, changed relations, new queries, or anything that interacts with the database — use the Prisma MCP to build a complete picture:
   - Use `IntrospectSchemaTool` to introspect the production database schema and understand models, relations, indexes, and constraints as they exist in the live database
   - Use `Prisma-Studio` to open Studio and visually explore the production data shape, row counts, and relationship cardinality — this is especially useful when the issue involves data-layer behavior you need to verify
   - **All Prisma MCP interactions are against the production database. Do not create, update, or delete any records. Read-only exploration only.**
   - Review the `schema.prisma` file and the migration history in `prisma/migrations/` in the repo to understand how the schema evolved and what conventions are used (naming, relation patterns, enum usage, etc.)
   - Map how the Prisma Client is used in the affected code paths: generated types, query patterns (`findMany`, `include`, `select`, nested writes), middleware, and any raw SQL usage

4. **Deepen observability investigation (Datadog MCP):**
   If the issue involves runtime behavior, errors, or performance, and you have not already completed Datadog investigation during Context Gathering, do so now:
   - Search logs and APM for the affected service and endpoints
   - Review error rates, latency percentiles, and trace waterfalls for the affected code paths
   - Check monitors and dashboards for any active or recent alerts related to the affected systems
   - Correlate Datadog findings with code paths: if a trace shows a slow database query, cross-reference with the Prisma Client call in the code; if an error trace points to a specific function, review that function's implementation
   - Document any discrepancies between what the issue describes and what production telemetry shows

5. **Trace data flow and control flow through the affected systems:**
   - Map callers and callees of functions/methods that will be modified
   - Understand existing patterns and architectural constraints
   - Document API contracts and interfaces involved

6. **Research external dependencies and integrations:**
   - Check for external services, APIs, or libraries involved
   - Review any relevant external documentation
   - Identify potential compatibility concerns

7. If there are other MCPs available (Notion, Confluence etc.) that might have context, look into those as well

8. **Gather historical context:**
   - Review git history for the affected files
   - Look at past PRs that touched similar areas
   - Check for any known issues or technical debt in the area

9. Scope priority of issue based upon customer impact

### Research Phase Verification Checklist
- All affected files and modules have been identified
- Data flow and control flow are understood and documented
- **Production database schema has been introspected via remote Prisma MCP (if data-layer changes are in scope)**
- **Prisma Client usage patterns in affected code paths have been mapped**
- **Datadog logs, traces, and/or monitors have been reviewed (if runtime behavior, errors, or performance are in scope)**
- **Datadog and Prisma findings have been correlated with code paths where applicable**
- External dependencies and integrations are mapped
- Historical context has been gathered
- No major knowledge gaps remain about the affected systems

## Summary Phase

1. **Consult your smart friend:** pass in the raw content of the issue and all gathered context. Important: The smart friend only sees the context you provide - it has no access to your previous research. You must include:
   - The full issue text and any relevant activity events
   - List of affected files with brief descriptions
   - Key code snippets that show current behavior
   - Data flow and control flow diagrams/descriptions
   - **Current production Prisma schema definitions for affected models (if applicable)**
   - **Datadog findings: error messages, traces, log patterns, latency data, and your interpretation of what they mean (if applicable)**
   - **Prisma data investigation findings: data shape, row counts, relationships, and any anomalies found (if applicable)**
   - Any external documentation or API specs you found
   - Ask it to evaluate if your research is comprehensive and if there are any gaps in understanding.

2. Compile a concise implementation plan overview using the Output Format below

3. **Create or update the scoping report** on the issue using the Resolver API:
   - If no scoping report exists: `POST /api/issues/{id}/scoping-report` with the full scoping report body (summary, affectedFiles, rootCauseHypothesis, suggestedApproach, estimatedEffort, confidence, openQuestions, datadogFindings, dataLayerFindings). This also sets the issue status to "ready" and creates an `agent_scoping_complete` activity event automatically.
   - If a scoping report already exists: `PATCH /api/issues/{id}/scoping-report` to update any fields that have changed based on your research.
   - **You must set the `confidence` field** to `high`, `medium`, or `low` based on your assessment (see [Confidence Assessment](#confidence-assessment) for criteria).

4. **Add an activity event** with the implementation plan summary using `POST /api/issues/{id}/activity` with `{ "eventType": "comment", "actor": "devin", "message": "<plan summary including Observability & Data Findings>" }`.

5. **Update issue priority** using `PATCH /api/issues/{id}` with `{ "priority": "<level>" }` where level is one of: `critical`, `high`, `medium`, `low`, `unprioritized`. This automatically creates a `priority_change` activity event.

6. Send a brief message to the user with the compiled overview.

## Output Format
Your final implementation plan should include the following sections:

### Summary of Current Code
Describe the current state of the relevant systems:
- **Background Context:** What is this system/feature? How does it work generally?
- **Current Behavior:** What does the specific code do today that may need to change?
- **Key Components:** List the main files, functions, and classes involved

### Affected Files
List all files that will need modification:
- File path and brief description of needed changes
- Related test files
- Configuration files if applicable

### System Overview
Brief description of the systems and components involved:
- How different parts connect to each other
- Data flow through the affected areas
- External dependencies and integrations

### Observability & Data Findings
Summarize what you learned from Datadog and Prisma investigation. This section should document your reasoning, not just results. If neither tool was used, briefly explain why they were not applicable.

**Datadog Findings (if investigated):**
- **Investigation rationale:** Why you looked at Datadog — what signal were you trying to find?
- **What you searched:** Queries, filters, time windows, services, and endpoints examined
- **Key findings:** Error messages, stack traces, frequency, latency patterns, affected users/endpoints, active monitors or alerts
- **Current production status:** Is the issue ongoing, resolved, or intermittent? What does the telemetry show?
- **Impact on scoping:** How do these findings change your understanding of the issue? Did they reveal the issue is broader or narrower than described? Did they surface related problems?

**Prisma / Data Layer Findings (if investigated):**
- **Investigation rationale:** Why you inspected the production data — what were you trying to verify or understand?
- **Models and tables examined:** Which parts of the schema you looked at and why
- **Key findings:** Data shape, row counts, relationship cardinality, missing indexes, constraint issues, data anomalies
- **Schema vs. reality:** Any discrepancies between the `schema.prisma` file, migration history, and actual production state
- **Impact on scoping:** How do these findings inform the complexity, approach, or risk of the implementation?

### Edge Cases and Complexity Hotspots
Identify areas that need careful attention:
- Parts of the code where logic is distributed across multiple files/repos
- Potential edge cases the implementation must handle
- Error handling and validation concerns
- Backwards compatibility considerations
- Race conditions or timing-sensitive operations
- **Migration safety: are schema changes additive (safe) or destructive (requires migration strategy)?**
- **Index or constraint implications: will new fields, unique constraints, or foreign keys affect existing data or query performance?**
- **N+1 query risks: are there Prisma Client usage patterns in the affected paths that could degrade with the proposed changes (e.g., nested `include` depth, missing `select` scoping)?**
- **Production error patterns: did Datadog reveal error spikes, retry storms, or cascading failures that the implementation must account for?**

### Key Considerations
Important patterns, constraints, or gotchas to be aware of:
- Existing patterns that should be followed
- Architectural constraints
- Performance considerations
- Security implications

### Suggested Approach
High-level implementation strategy:
- Recommended order of changes
- Key design decisions to make
- Testing strategy

### Open Questions
Any remaining uncertainties:
- Questions that need team input
- Design decisions that require clarification
- Information that would help but isn't blocking

### Confidence Assessment
Confidence determines how the issue is routed after scoping. **You must update the scoping report's `confidence` field** via `PATCH /api/issues/{id}/scoping-report` with your assessed level. The routing logic is:
- **High confidence** → issue auto-dispatches to Devin for implementation (status → `in_progress`, assignee → `devin`)
- **Medium or Low confidence** → issue moves to `ready` for human review (assignee cleared)

Use these criteria to determine confidence:

- **High:** You have reviewed ≥90% of the relevant code. The root cause (for bugs) or architecture (for features) is well understood. No blocking open questions remain. Datadog and Prisma findings (if applicable) confirm your understanding. The suggested approach is specific and actionable with clear steps.
- **Medium:** You have reviewed ≥70% of the relevant code. The general direction is clear but some details need validation. There are open questions that are non-blocking but could affect the approach. Observability or data findings are partially available or inconclusive.
- **Low:** Significant gaps remain in your understanding. Key code paths have not been fully traced. There are blocking open questions or ambiguities. Datadog/Prisma signals contradict the issue description or reveal unexpected complexity. The suggested approach is tentative.

Report the following:
- **Overall Confidence:** High/Medium/Low — this value must match what you set in the scoping report's `confidence` field
- **Completeness:** What percentage of the relevant code have you reviewed?
- **Observability Coverage:** Did Datadog and Prisma investigation fill in gaps that code review alone could not? What gaps remain?
- **Open-endedness:** What design decisions did you make that weren't explicitly specified?
- **Confidence Rationale:** 2-3 sentences explaining why you chose this confidence level and how it maps to the routing outcome (auto-dispatch vs. human review)

### Prioritization
High-level Prioritization of Issue on Impacting Customer
- Priority level set in Resolver (critical/high/medium/low/unprioritized)
- Rationale for prioritizing the issue at this level
- **Production signal justification:** If Datadog data influenced priority (e.g., high error volume, active alerts, user-facing impact), cite it here

### Summary Phase Verification Checklist
- `ask_smart_friend` was used to validate completeness of research
- All sections of the implementation plan overview are filled out
- **Observability & Data Findings section is populated with Datadog and/or Prisma findings, or explicitly notes why these tools were not applicable**
- **A scoping report has been created or updated on the issue via the Resolver API, including the `confidence` field**
- **An activity event has been added to the issue with the implementation plan summary**
- The summary is concise but comprehensive
- The issue has been updated with priority and status via the Resolver API
- User has been notified with the final overview
- Summary of current code is included
- Edge cases and complexity hotspots are identified
- Open questions and confidence assessment are documented

## Specifications
- The output must be a concise, actionable implementation plan overview
- All relevant files, systems, and dependencies must be identified
- The issue must be updated in Resolver with: scoping report (including confidence), priority, status, and an activity event documenting the implementation plan
- **The activity event must include the Observability & Data Findings section so that teammates reviewing the issue can see what production signals informed the plan**
- All issue status transitions must be reflected via `PATCH /api/issues/{id}`
- Validation: The issue should have a scoping report and activity event documenting the implementation plan; the user should receive a clear summary of all gathered context
- You must update the priority of the issue based on your findings' impact on the overall production system

## TODO List Guidance
Only ever create the todo list for the current phase. Once you fully moved to the next phase, create the todo list for the next phase.

## Resolver API Reference

### Issues
- `GET /api/issues` — List/search issues. Query params: `status` (comma-separated), `priority`, `complexity`, `repo`, `label`, `assignee` (use "unassigned" for unassigned), `staleOver` (days), `search` (text search on title/description), `sort` (staleDays|priority|complexity|updatedAt|createdAt), `order` (asc|desc)
- `POST /api/issues` — Create issue(s). Accepts single object or array. Fields: title, description, status, priority, complexity, repo, labels, sourceUrl, assignee. Defaults: status=untriaged, priority=unprioritized, complexity=unknown
- `GET /api/issues/{id}` — Get issue with scoping report and activity events
- `PATCH /api/issues/{id}` — Update issue. Trackable fields: title, description, status, priority, complexity, sourceUrl, repo, labels, assignee, devinSessionId. Automatically creates activity events for status, priority, and assignee changes.

### Scoping Reports
- `POST /api/issues/{id}/scoping-report` — Create scoping report (one per issue, returns 409 if exists). Fields: summary, affectedFiles (string[]), rootCauseHypothesis, suggestedApproach, estimatedEffort (trivial|small|medium|large), confidence (high|medium|low), openQuestions (string[]), datadogFindings (string|null), dataLayerFindings (string|null). Automatically sets issue status to "ready" and creates `agent_scoping_complete` activity event.
- `PATCH /api/issues/{id}/scoping-report` — Update scoping report. All fields are optional for partial updates. **Use this to update `confidence` after completing your assessment.**

### Activity Events
- `POST /api/issues/{id}/activity` — Create activity event. Fields: eventType (status_change|agent_scoping_started|agent_scoping_complete|agent_fix_started|agent_fix_complete|comment|priority_change|assigned), actor (string), message (string), metadata (object). Automatically updates the issue's updatedAt timestamp.

### Statistics
- `GET /api/stats` — Dashboard stats: counts by status/priority/complexity, totalIssues, staleOver30, staleOver7, avgStaleDays, agentActive, resolvedLast30, resolution timeline (12 weeks), available repos

### Issue Statuses
Fixed set: `untriaged` → `scoping` → `ready` → `in_progress` → `in_review` → `resolved` | `wont_fix`

### Priority Levels
`critical` | `high` | `medium` | `low` | `unprioritized`

### Confidence Levels
`high` | `medium` | `low` — stored on the ScopingReport, determines routing:
- **high**: auto-dispatch to Devin for implementation
- **medium/low**: queue for human review

## Devin MCP
Use for high-level codebase understanding. Available tools:
- `read_wiki_structure`: Get documentation topics. Parameter: `repoName` (e.g., "owner/repo")
- `read_wiki_contents`: View documentation. Parameter: `repoName`
- `ask_question`: Ask about a repo. Parameters: `repoName` and `question`

Note: There is no search tool on the Devin MCP. Use `ask_question` instead. IMPORTANT: there is also a deepwiki MCP that is similar. DO NOT USE IT. Only use the Devin MCP. Because the Devin MCP allows you to access your private repos. The Deepwiki MCP only does public repos.

## Datadog MCP
Use for production observability — logs, APM traces, monitors, dashboards, and error tracking. This is your window into what is actually happening at runtime. **Use proactively whenever the issue could benefit from production signals, not only when the issue explicitly mentions errors or performance.**

**When to reach for Datadog:**
- Bug reports or unexpected behavior (search for error logs, exception traces)
- Performance issues (search APM traces for latency, slow queries, timeouts)
- Intermittent or hard-to-reproduce issues (search for frequency patterns, affected users)
- Verifying whether a reported issue is still occurring or has been resolved
- Understanding blast radius (how many users, requests, or services are affected)
- Scoping priority (active alerts or high error volume should escalate urgency)
- Any issue where "what's actually happening in production?" would sharpen your understanding

**Investigation patterns:**
1. **Start with logs:** Search for error messages, service names, or endpoint paths related to the issue. Filter by environment (production) and time window.
2. **Move to APM traces:** Look at trace waterfalls for the affected endpoints to understand latency distribution, error rates, and downstream calls.
3. **Check monitors and dashboards:** See if there are active alerts or recent anomalies for the affected service.
4. **Correlate with code:** When you find a slow trace or error, map it back to the specific code path — this bridges observability findings with your code review.

**Recording findings for the Resolver issue:**
Always document your Datadog investigation in the Observability & Data Findings section of the implementation plan. Include: what you searched for, why, what you found, and how it informs the issue's scope or priority. Teammates reading the issue should be able to understand the production context without re-running the investigation themselves.

## Prisma MCP (Remote — Production Database)
Use for database schema understanding and data exploration during the research phase. This playbook uses the **remote Prisma MCP server only**, connected to the production Prisma Postgres database. There is no local server configured.

**Configuration:**
```json
{
  "mcpServers": {
    "Prisma-Remote": {
      "url": "https://mcp.prisma.io/mcp"
    }
  }
}
```

**Tools permitted in this playbook (read-only research against production):**
- `IntrospectSchemaTool`: Introspect the schema of the production Prisma Postgres database. Use to understand current models, relations, indexes, and constraints as they exist in the live database. Requires the database ID.
- `Prisma-Studio`: Open Prisma Studio to visually explore production data, verify table relationships, inspect row counts, and understand data shape. Useful when the issue involves data-layer behavior that needs verification.

**IMPORTANT: This connects to the production database. All interactions must be strictly read-only. Never create, update, or delete records through Studio or any other tool.**

**When to reach for Prisma (beyond schema changes):**
- The issue describes data that looks wrong, missing, or duplicated
- You need to verify assumptions about data shape or volume before proposing an approach
- A bug might be caused by unexpected data states (nulls, orphaned records, constraint violations)
- You want to validate that foreign keys, indexes, or constraints are in place before proposing schema changes
- The issue involves a query that might perform differently at production data scale

**Recording findings for the Resolver issue:**
Always document your Prisma investigation in the Observability & Data Findings section of the implementation plan. Include: which models you inspected, why, what you found, and how it informs the issue. Teammates should be able to understand the data-layer context from your notes.

**Additional research patterns (no MCP tool required):**
- Review the `schema.prisma` file directly in the repo for model definitions, enums, and relation annotations
- Review `prisma/migrations/` directory for migration history and naming conventions
- Trace Prisma Client usage in application code: `findMany`, `findUnique`, `include`, `select`, nested writes, transactions, raw SQL, and middleware

## Advice and Pointers
- Keep all activity event messages extremely brief and terse - write like a human, not an AI. No fluff, no verbose explanations. Just the essential information
- **For the Observability & Data Findings section specifically:** be thorough but concise. State your reasoning in 1-2 sentences, list findings as terse bullet points, and state the impact on scoping in 1-2 sentences. The goal is that a teammate can skim the activity event and immediately understand what production signals shaped the plan.
- When fetching issue details, review the full activity event history and any existing scoping report for additional context
- If the issue has related issues (same repo, similar labels), note them in your summary as they may affect the implementation scope
- Focus on gathering information, not making implementation decisions - leave options open for the implementer
- Prioritize understanding the "why" behind the issue, not just the "what"
- **Use Datadog and Prisma proactively.** Don't wait for the issue to explicitly say "check logs" or "look at the database." If production signals could clarify the issue, go look.
- **Always update the confidence field** on the scoping report. This directly controls whether the issue is auto-dispatched to Devin or queued for human review — getting this right is critical.

## Forbidden Actions
- Do not start any implementation or code changes
- Do not create branches or PRs
- Do not skip the smart friend consultation phase
- Do not send any messages to the user other than the specified messages at the end of each phase or if the user messages you
- Do not make assumptions about implementation approach without researching the codebase first
- Do not remove or override existing issue fields (priority, labels, assignee) without explicit instructions
- **Do not run `migrate-dev`, `migrate-deploy`, `db push`, `db seed`, or any write/destructive Prisma CLI operations. The Prisma MCP connects to the production database — all access must be strictly read-only. Do not create, update, or delete any records through Studio or any other tool.**
