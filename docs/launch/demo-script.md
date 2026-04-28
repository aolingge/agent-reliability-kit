# Demo Script

## Demo Goal

Show that Agent Reliability Kit turns repo readiness signals into an actionable report without calling AI tools, sending source code to a service, or requiring credentials.

## Setup

Use a public sample repository, a disposable fixture, or the included local fixtures. Do not demo against private source code unless the recording will remain private.

Required links for the final demo description:

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

## 3-Minute Demo

### 0:00 - Problem

Narration:

> AI coding agents usually fail on ordinary repo hygiene: unclear instructions, missing verification commands, unsafe CI defaults, README steps that cannot be replayed, and secret-like values in files or logs. Agent Reliability Kit checks those surfaces before you rely on an agent.

Show:

- a repository root;
- files such as `README.md`, `AGENTS.md`, `.github/workflows`, and `package.json`.

### 0:30 - Run the Scan

When the package is publicly available:

```bash
npx agent-reliability-kit scan . --out .agent-reliability --format markdown,json,html
```

From source during pre-release:

```bash
npm install
npm run build
node dist/cli.js scan . --out .agent-reliability --format markdown,json,html
```

Narration:

> The scan runs locally. It does not call Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Copilot, or any MCP server. It reads repository files and writes reports.

### 1:00 - Explain the Result

Show:

- terminal summary;
- `.agent-reliability/report.md`;
- `.agent-reliability/report.html`;
- optional `.agent-reliability/report.json`.

Narration:

> The report groups findings by severity and gives maintainers a concrete next action. The goal is not to replace code review. The goal is to make agent readiness visible and repeatable.

### 1:40 - Walk Through Checks

Narration:

> Agent Reliability Kit checks instruction files like `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, and Copilot instructions. It looks for verification commands, README replayability, token-like evidence, GitHub Actions permissions and risky shell patterns, plus MCP and local AI tooling risk.

Show one finding from each relevant category:

- missing or conflicting instructions;
- missing `test`, `build`, `lint`, `typecheck`, or `check` command;
- README missing quick start or contribution path;
- redacted token-like evidence;
- GitHub Actions workflow without explicit permissions;
- risky tool configuration or instruction surface.

### 2:30 - CI / Maintainer Workflow

Narration:

> The same scan can be used before a PR, inside CI, or as a release-readiness check. Markdown is easy for humans, JSON and SARIF-style outputs are useful for automation, and HTML works well for a launch page or maintainer review.

Example:

```bash
agent-reliability-kit scan . --min-score 85 --format markdown,json,html
```

### 2:55 - Close

Narration:

> If you maintain a repo that uses AI coding agents, try Agent Reliability Kit on a non-sensitive repository and tell us which findings are useful, confusing, or missing.

End card:

- Repo: <PUBLIC_REPO_URL>
- npm: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

## 30-Second Demo

Narration:

> Before letting AI agents work in a repo, check whether the repo is ready for them. Agent Reliability Kit scans agent instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness. It runs locally and writes Markdown, JSON, and HTML reports.

Command:

```bash
npx agent-reliability-kit scan .
```

Links:

- <PUBLIC_REPO_URL>
- <NPM_PACKAGE_URL>
- <DOCS_URL>

## Demo Safety Notes

- Use synthetic fixtures or public repositories.
- Do not show real secrets, cookies, browser profiles, private URLs, private logs, or customer code.
- Review generated reports before sharing screenshots.
- Use pre-release wording until the public repo and npm page are live.
- Avoid unsupported claims such as adoption numbers, security guarantees, or benchmark results.
