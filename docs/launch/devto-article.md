---
title: Checking whether a repository is ready for AI coding agents
published: false
description: A local-first approach to scanning the repo surfaces that shape AI-agent-assisted development.
tags: opensource, ai, cli, devtools
canonical_url: <DOCS_URL>
---

AI coding agents do not work inside a vacuum. They work inside repositories.

That means their output depends on ordinary project surfaces: instructions, install steps, test commands, CI defaults, contribution rules, local tooling configuration, and private-data boundaries. When those surfaces are unclear, the agent has to guess. When they are missing, a maintainer has to clean up the mess later.

I built Agent Reliability Kit to make those surfaces visible before an agent opens a PR or a maintainer trusts a generated change.

## What it does

Agent Reliability Kit is a local-first CLI scanner for AI-agent-assisted codebases. It checks:

- agent instruction files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, and Copilot instructions;
- repeatable verification commands such as test, build, lint, typecheck, and check scripts;
- README readiness signals such as install path, quick start, license, contribution path, and visual proof;
- token-like evidence, with redacted output in reports;
- GitHub Actions permissions, validation commands, risky triggers, and pipe-to-shell patterns;
- MCP and local AI tooling surfaces;
- release-readiness signals.

It writes Markdown, JSON, HTML, and SARIF-style outputs so the result can be read by maintainers or used by automation.

## Why local-first matters

The scanner is designed to run on the machine where the repository already lives. It does not call Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot, or any MCP server. It does not need their credentials.

That boundary is important because scan output can include project structure, file paths, and findings that should be reviewed before sharing. Public examples should use synthetic fixtures or public repositories, and reports should never include real secrets, cookies, private URLs, raw logs, browser profiles, or sensitive source details.

## Quick start

```bash
npx agent-reliability-kit scan .
```

From source when contributing:

```bash
npm install
npm run build
node dist/cli.js scan . --out .agent-reliability --format markdown,json,html
```

The scan writes local reports such as:

```text
.agent-reliability/report.md
.agent-reliability/report.json
.agent-reliability/report.html
```

## What I want feedback on

The highest-value feedback is specific:

- false positives;
- unclear next actions;
- missing stacks or repository patterns;
- confusing report wording;
- install friction;
- CI integration gaps.

Links:

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Documentation: <DOCS_URL>

Before publishing this article, replace the placeholders with the live links in `docs/launch/live-links.md`.
