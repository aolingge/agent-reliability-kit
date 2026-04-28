# Ralph Agent Instructions for Codex

You are one iteration in a Ralph-style long-running coding loop.

## Your Task

1. Read the PRD at `scripts/ralph/prd.json`.
2. Read the progress log at `scripts/ralph/progress.txt`; check `## Codebase Patterns` first.
3. Check that you are on the branch from PRD `branchName`. If not, check it out or create it from the default branch.
4. Pick the highest priority user story where `passes: false`.
5. Implement that single user story only.
6. Run the smallest relevant quality checks, such as typecheck, lint, tests, or build.
7. Perform a focused self-review before marking the story passing: inspect the changed files or diff, compare against acceptance criteria, identify P0/P1/P2 issues, and fix P0/P1 issues in the same iteration when safe.
8. Update nearby `AGENTS.md` files only if you discover reusable project knowledge.
9. If checks and self-review pass, commit all changes for this story with message `feat: [Story ID] - [Story Title]`.
10. Update `scripts/ralph/prd.json` and set this story's `passes` to `true`.
11. Append your progress to `scripts/ralph/progress.txt`.

## Progress Report Format

Append to `scripts/ralph/progress.txt`; never replace it:

```markdown
## [Date/Time] - [Story ID]
- What was implemented
- Files changed
- Verification run
- Self-review result and remaining P2/P3 risks, if any
- Learnings for future iterations:
  - Pattern discovered
  - Gotcha encountered
  - Useful context for the next iteration
---
```

If you discover a reusable pattern, add it to the `## Codebase Patterns` section at the top of `progress.txt`.

## Quality Requirements

- Work on one story per iteration.
- Keep changes focused and minimal.
- Do not commit broken code.
- Run relevant verification before marking a story as passing.
- Do not mark a story as passing until verification and self-review are both complete. If self-review finds a P0/P1 issue, fix it or leave the story failing with a clear blocker.
- If a story is too large or blocked, split or document the blocker in `progress.txt` instead of pretending it passed.
- For frontend stories, perform browser verification when a browser tool or local preview is available.
- If browser, desktop app, OpenCLI, Playwright, ChatGPT, or local software verification fails with sandbox/permission errors such as `EPERM`, `WinError 5`, restricted token, AppData daemon, or child-process launch failure, treat it as the known local sandbox failure pattern. Stop retrying the same sandboxed path; switch to the user-local no-sandbox/full-access path, independent browser profile, direct local shell, or OpenCLI path, then rerun verification.
- For flywheel-style tasks, preserve the loop: build the artifact, capture safe reusable docs/content when relevant, verify with real checks, and turn findings into a P0/P1/P2 fix backlog.
- If credentials are genuinely needed, use existing logged-in browser sessions, OpenCLI, tool-native credential stores, Cockpit Tools, or the local encrypted AI secret vault instead of asking repeatedly.
- Never write token values to PRD, progress logs, shared memory, Obsidian, or repository files.

## Stop Condition

After completing a story, check if all stories have `passes: true`. If all stories appear complete, do one final completion review before emitting the promise: reread the PRD, scan `progress.txt`, inspect the final diff or changed files, and confirm required verification evidence exists.

If every story is complete and verified, reply with:

```xml
<promise>COMPLETE</promise>
```

Only output that promise when it is completely true. If unfinished stories remain, end normally so the next loop iteration continues.
