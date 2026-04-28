# Product Hunt Draft

Use this only after users can try the project from a public URL and install path.

## Product Name

Agent Reliability Kit

## Tagline Options

- Verify and harden AI-agent-assisted codebases in one command.
- Local-first readiness checks for repos that use AI coding agents.
- Find the repo gaps that make AI agents fail before they open a PR.

## Description

Agent Reliability Kit is a local-first CLI that checks whether a repository is ready for AI-agent-assisted development. It scans repo instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness.

## Topics

- Developer Tools
- Open Source
- Artificial Intelligence
- GitHub
- Security

## Thumbnail

Use `../../assets/product-hunt-thumbnail.png`.

## Gallery Ideas

1. Social preview: `../../assets/social-preview.png`
2. HTML report screenshot from a synthetic fixture
3. Terminal output screenshot from `ark scan .`
4. Markdown report screenshot with redacted sample findings

## First Comment Draft

Hi Product Hunt. I built Agent Reliability Kit because AI coding agents usually fail on ordinary repository surfaces before they fail on exotic model problems.

If the repo has unclear agent instructions, missing verification commands, unsafe CI defaults, README steps nobody can replay, or accidental secret-like values in files, an agent has less room to do careful work.

Agent Reliability Kit scans those surfaces locally and writes Markdown, JSON, HTML, and SARIF-style reports. It does not call agent tools, does not require their credentials, and does not upload source code.

The first version focuses on:

- `AGENTS.md`, Claude, Gemini, Codex, and Copilot instruction files
- test, build, lint, typecheck, and check commands
- README replayability
- token-like evidence with redacted output
- GitHub Actions permissions and risky shell patterns
- MCP and local AI tooling surfaces
- release-readiness signals

The project is agent-neutral and designed around workflows that use Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot coding flows, and MCP-based local tools.

I would love feedback on false positives, confusing next actions, missing stacks, and install friction.

Links:

- Repo: <PUBLIC_REPO_URL>
- npm: <NPM_PACKAGE_URL>
- Docs: <DOCS_URL>

## Reply Guardrail

Do not paste this first comment unchanged. Rewrite it in the maintainer's own voice before posting, and remove any link that is not live.
