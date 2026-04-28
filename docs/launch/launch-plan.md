# Agent Reliability Kit Launch Plan

## Positioning

Agent Reliability Kit helps maintainers verify, harden, and ship AI-agent-assisted codebases before inviting agents, contributors, or CI to touch the repo.

Core promise:

> Scan the repository surfaces that most often make AI coding agents fail: instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness.

Audience:

- maintainers using Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot coding workflows, or MCP-based local tools;
- open-source project owners who want contributors and AI agents to follow the same repo rules;
- engineering teams that need local-first reports before adopting agent-assisted development.

Non-claims:

- Do not claim the package is already public until the public repo and npm package exist.
- Do not claim adoption metrics, benchmark wins, security certification, or production usage without evidence.
- Do not imply the scanner calls agent tools or reads credentials. It scans repository files locally.

Required public links:

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Documentation: <DOCS_URL>

## Launch Goals

1. Explain the problem clearly: AI agents need reliable repo surfaces, not just better prompts.
2. Give maintainers a copy-paste quick start that works once the public package is available.
3. Invite careful feedback before broader distribution.
4. Keep trust high by being explicit about pre-release status, local-first scanning, and private-data safety.

## Launch Readiness Checklist

- Public repository created and visible at <PUBLIC_REPO_URL>.
- npm package published or package page available at <NPM_PACKAGE_URL>.
- Documentation page available at <DOCS_URL>.
- README has current install instructions and does not contain dead public links.
- `npm run check` passes.
- `npm run smoke` passes.
- Release dry run passes without publishing.
- Demo scan output is reviewed for redaction and private-data safety.
- Launch copy has no unsupported metrics or "already adopted by" claims.

## Recommended Launch Sequence

### Phase 1: Soft Announcement

Publish to channels where careful maintainer feedback is likely:

- personal GitHub release notes or repository discussion;
- a short X/LinkedIn post;
- one relevant developer community thread;
- direct messages to a small number of trusted maintainers.

Message angle:

> I built a local-first scanner for the repo surfaces that make AI coding agents succeed or fail.

Success criteria:

- people understand the category within one minute;
- at least a few maintainers run it on non-sensitive repositories;
- feedback identifies confusing findings, missing stacks, or install friction.

### Phase 2: Maintainer-Focused Launch

Publish the fuller launch post and demo once the first feedback pass is addressed.

Message angle:

> Before letting AI agents work in a repo, check whether the repo is ready for them.

Recommended assets:

- one screenshot or short clip of the HTML report;
- a terminal demo using a fixture or public sample repo;
- a short list of checks: instructions, commands, README, secrets, GitHub Actions, MCP/tooling risk.

### Phase 3: Ecosystem Outreach

Share targeted examples for tool-specific audiences without making the product tool-specific.

Examples:

- "For Codex / Claude Code / Cursor users: are your repo instructions and verification commands agent-readable?"
- "For MCP users: do your tool configs make permissions and command risk visible?"
- "For open-source maintainers: can contributors run the same checks before opening a PR?"

## Launch Post Outline

1. Problem: AI coding agents fail when repos lack reliable operating surfaces.
2. Product: Agent Reliability Kit scans those surfaces locally and writes shareable reports.
3. What it checks: agent instructions, commands, README, secrets, Actions, AI tooling.
4. Safety: local-first, no credentials required, redacted evidence.
5. Quick start: link to <PUBLIC_REPO_URL>, <NPM_PACKAGE_URL>, and <DOCS_URL>.
6. Ask: run it on a non-sensitive repo and share confusing findings or missing checks.

## Copy Guardrails

Use:

- "pre-release" when public availability is not complete;
- "local-first";
- "designed for";
- "scans repository surfaces";
- "helps maintainers";
- "redacts token-like evidence";
- "agent-neutral."

Avoid:

- "battle-tested";
- "trusted by";
- "secure your AI stack";
- "prevents all secret leaks";
- "guarantees safe agents";
- "available on npm" before <NPM_PACKAGE_URL> is live;
- "open-source on GitHub" before <PUBLIC_REPO_URL> is live.
