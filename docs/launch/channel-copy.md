# Channel Copy

## Short Launch Post

I built Agent Reliability Kit, a local-first scanner for repositories that use AI coding agents.

It checks the boring surfaces that often decide whether agents succeed or make a mess: repo instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness.

Links:

- Repo: <PUBLIC_REPO_URL>
- npm: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

If you maintain a repo where Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Copilot, or MCP tools touch code, I would love feedback on confusing findings, missing checks, and install friction.

## X / Threads

AI coding agents do better when the repo gives them a reliable operating surface.

Agent Reliability Kit scans that surface locally:

- agent instructions
- build/test/lint commands
- README replayability
- secret hygiene
- GitHub Actions safety
- MCP/tooling risk

<PUBLIC_REPO_URL>

## LinkedIn

I am preparing Agent Reliability Kit, a local-first CLI for maintainers who use AI coding agents in real repositories.

The goal is simple: before an agent opens a PR, runs tools, or follows repo instructions, check whether the repository gives it a safe and repeatable path.

The scanner looks at agent instruction files, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness. It writes Markdown, JSON, HTML, and SARIF-style outputs so the report can be used locally or in CI.

Links:

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

I am especially interested in feedback from maintainers using Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot coding workflows, or MCP-based local toolchains.

## GitHub Release / Discussion Draft

Agent Reliability Kit is a local-first CLI for checking whether a repository is ready for AI-agent-assisted development.

It scans:

- agent instructions such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, and Copilot instructions;
- repeatable verification commands such as test, build, lint, typecheck, and check scripts;
- README quality, including install path, quick start, license, contribution path, and visual proof;
- secret hygiene, with token-like evidence redacted in reports;
- GitHub Actions safety, including permissions, validation commands, risky triggers, and pipe-to-shell patterns;
- AI tooling surfaces such as MCP command configs and prompt-injection-like instruction files.

Quick start after public package availability:

```bash
npx agent-reliability-kit scan .
```

Until then, the repository can be run from source:

```bash
npm install
npm run build
node dist/cli.js scan . --out .agent-reliability --format markdown,json,html
```

Links:

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Documentation: <DOCS_URL>

Please avoid sharing reports that contain private source paths, private URLs, raw logs, cookies, browser profiles, or real secrets.

## Hacker News / Reddit-Style Post

Title:

Agent Reliability Kit: local-first repo readiness checks for AI coding agents

Body:

I built Agent Reliability Kit because many agent failures come from repository surfaces rather than model behavior: missing instructions, unclear verification commands, unsafe CI defaults, README steps nobody has replayed, and accidental secret exposure.

The CLI scans a repo locally and reports on agent instructions, commands, README quality, secrets, GitHub Actions safety, MCP/tooling risk, and release readiness. It does not call agent tools or require their credentials.

Links:

- <PUBLIC_REPO_URL>
- <NPM_PACKAGE_URL>
- <DOCS_URL>

I would value feedback from maintainers using AI agents in real repos, especially on false positives, unclear next actions, and checks that should be added.

## Maintainer Outreach DM

Hi. I am preparing Agent Reliability Kit, a local-first CLI that checks whether a repo is ready for AI-agent-assisted development.

It scans the surfaces that commonly affect Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Copilot, and MCP workflows: repo instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, and tooling risk.

Would you be open to running it on a non-sensitive repo and telling me where the findings are confusing or incomplete?

Links:

- Repo: <PUBLIC_REPO_URL>
- npm: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

## Product Hunt-Style Tagline Options

- Verify and harden AI-agent-assisted codebases in one command.
- Local-first readiness checks for repos that use AI coding agents.
- Find the repo gaps that make AI agents fail before they open a PR.
- A maintainer-friendly scanner for agent instructions, commands, CI, secrets, and docs.
