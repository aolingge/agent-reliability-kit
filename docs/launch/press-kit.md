# Press Kit

## Product Name

Agent Reliability Kit

## One-Liner

Agent Reliability Kit is a local-first CLI that checks whether a repository is ready for AI-agent-assisted development.

## Short Description

Agent Reliability Kit scans the repository surfaces that often make AI coding agents succeed or fail: agent instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness. It writes maintainer-friendly reports without calling agent tools or requiring their credentials.

## Long Description

AI coding agents are most useful when a repository gives them a clear and trustworthy operating surface. Agent Reliability Kit helps maintainers inspect that surface before inviting agents, contributors, or CI to act on the codebase.

The CLI checks instruction files, common verification commands, README replayability, token-like evidence, GitHub Actions workflow safety, MCP and local AI tooling risk, and release-readiness signals. Reports are designed for maintainers and CI workflows, with Markdown, JSON, HTML, and automation-friendly outputs.

Agent Reliability Kit is agent-neutral. It is designed to be useful around Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot coding workflows, and MCP-based local toolchains. It does not call those tools, does not require their credentials, and keeps scans local by default.

## Boilerplate

Agent Reliability Kit helps maintainers verify, harden, and ship AI-agent-assisted codebases. The project focuses on local-first repository checks for instructions, commands, documentation, secret hygiene, CI safety, AI tooling risk, and release readiness.

## Key Messages

- AI agent reliability starts with the repository surface, not only the model or prompt.
- Maintainers need repeatable checks for instructions, commands, CI, docs, secrets, and tooling risk.
- The scanner is local-first and does not require agent credentials.
- Reports are built for both humans and automation.
- The product is agent-neutral and can support mixed-tool workflows.

## Feature Summary

- Scans agent instruction files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, and Copilot instructions.
- Detects common verification commands including test, build, lint, typecheck, and check scripts.
- Reviews README readiness signals such as install path, quick start, visual proof, license, and contribution path.
- Flags token-like evidence with redacted report output.
- Reviews GitHub Actions for validation commands, explicit permissions, risky triggers, and pipe-to-shell patterns.
- Checks AI tooling surfaces such as MCP command configs and prompt-injection-like instruction files.
- Writes Markdown, JSON, HTML, and automation-friendly outputs.

## Links

- Public repo: <PUBLIC_REPO_URL>
- npm package: <NPM_PACKAGE_URL>
- Documentation: <DOCS_URL>

## Suggested Headlines

- Agent Reliability Kit Checks Whether Repositories Are Ready for AI Coding Agents
- A Local-First Scanner for AI-Agent-Assisted Codebases
- Agent Reliability Kit Turns Repo Hygiene Into Actionable AI Agent Readiness Reports
- Before the Agent Opens a PR, Check the Repo

## Suggested Pull Quote

> AI coding agents need more than prompts. They need repos with clear instructions, repeatable commands, safe CI, and private-data boundaries.

## FAQ

### Is Agent Reliability Kit an AI agent?

No. It is a CLI scanner for repository readiness. It does not generate code, call AI models, or operate agent tools.

### Does it send source code to a hosted service?

The scanner is designed to run locally and write local reports. Maintainers choose what to share.

### Does it require Codex, Claude Code, Cursor, Gemini CLI, OpenCode, Copilot, or MCP credentials?

No. It checks repository files and configuration surfaces that affect those workflows. It does not log in to those tools.

### Is it a security scanner?

It includes secret hygiene and CI safety checks, but it should be described as a repository readiness scanner for AI-agent-assisted development. It does not replace dedicated security review, SAST, dependency scanning, or human code review.

### Is it published?

Use current launch status wording. Before the public repository and npm package are live, describe it as pre-release and link only to available pages. Once available, use <PUBLIC_REPO_URL>, <NPM_PACKAGE_URL>, and <DOCS_URL>.

## Media Notes

- Use screenshots that show synthetic or public sample repositories.
- Review reports before sharing them publicly.
- Do not include secrets, cookies, private logs, private URLs, browser profiles, or customer code in screenshots.
- Avoid unsupported claims about adoption, security certification, or benchmark performance.
