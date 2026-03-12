# Implement Feature

## Overview
You are implementing a fix or feature based on a completed scoping report. All context — the issue details, scoping report summary, root cause hypothesis, implementation plan, affected files, and open questions — is provided in the session prompt. Use that context to implement the changes and create a pull request.

You do NOT need to fetch ticket details, update ticket status, or call any external APIs. Resolver (the issue management app) will poll your session, detect completion, and handle all status updates automatically.

## What's Provided
- Issue title, description, repository, and priority
- Scoping report: summary, root cause, implementation plan, affected files
- Open questions (use your best judgment to resolve these)

## Implementation Phase

1. **Understand the plan**: Read the implementation plan and scoping report provided in the prompt carefully. Make sure you understand the full scope before writing code.
2. **Research the codebase**: Use the Devin MCP to deepen your understanding if needed:
   - Use `ask_question` to clarify architecture or patterns in the repo
   - Use `read_wiki_contents` to understand how systems connect
3. **Investigate the code**: Before making changes:
   - Find all affected files listed in the scoping report
   - Trace data flow and control flow through the affected systems
   - Use the LSP (goto_definition, goto_references, hover_symbol) to verify types and function signatures
   - Understand existing patterns and architectural constraints
4. **Create a feature branch** following the repository's branching conventions
5. **Implement the changes** according to the implementation plan:
   - Follow existing code patterns and conventions in the repo
   - Ensure all callers/callees of modified code are properly updated
   - Write clean, well-tested code
6. **Write or update tests** to cover the new functionality where applicable
7. **Run lint checks** and fix any issues
8. **Run tests locally** if possible to verify the implementation works correctly
9. **Commit changes** with clear, descriptive commit messages
10. **Push the branch and create a pull request** with a clear description of the changes

## Self-Review Phase

1. Use `ask_smart_friend` to conduct a thorough code review of your PR diff. **Important**: The smart friend only sees the context you provide. You must include:
   - The original issue requirements (from the prompt)
   - The implementation plan (from the prompt)
   - The complete PR diff
   - Any relevant code context needed to understand the changes

   Ask whether you fully fulfilled the intent and followed engineering best practices.
2. If issues are found: fix them, push updates, and repeat the review
3. Wait for CI checks to complete (if available) and ensure they pass
4. For code review bots (coderabbit, graphite, devin-ai-integration): view their actual comments since CI jobs for these always show as "passed" but may still report issues
5. Address all legitimate feedback, push changes, and wait for CI to pass again

## Verification Checklist
- All affected files from the scoping report have been addressed
- All callers/callees have been updated
- Code follows existing patterns: reuses existing code, follows naming conventions, cleans up unused code
- Tests have been written or updated for new functionality
- Lint checks pass
- PR has been created with a clear description
- Self-review via `ask_smart_friend` has been completed

## Devin MCP
Use for codebase understanding during implementation:
- `read_wiki_structure`: Get documentation topics. Parameter: `repoName`
- `read_wiki_contents`: View documentation. Parameter: `repoName`
- `ask_question`: Ask about a repo. Parameters: `repoName` and `question`

IMPORTANT: There is also a deepwiki MCP that is similar. DO NOT USE IT. Only use the Devin MCP for private repo access.

## Advice
- Follow the implementation plan from the scoping report — it was carefully researched
- Use your best judgment on open questions rather than blocking
- Keep commits atomic and well-described
- Don't take shortcuts or propose oversimplified fixes
- Don't introduce dead code or unnecessary abstractions

## Forbidden Actions
- Do not call any external APIs, webhooks, or ticket management systems
- Do not push directly to the main branch
- Do not skip the self-review phase
- Do not make changes outside the scope of the implementation plan without good reason
