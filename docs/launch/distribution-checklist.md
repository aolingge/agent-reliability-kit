# Distribution Checklist

Use this only after local verification passes.

## Must Be Ready

- `npm run check` passes
- `npm run smoke` passes
- README quick start works from a clean clone
- demo command shows a real finding in under 30 seconds
- no real secrets in screenshots, GIFs, reports, fixtures, or issues
- release notes mention local-only safety boundaries

## Launch Channels

### Show HN

Title:

```text
Show HN: Agent Reliability Kit - local checks for AI-agent-ready repos
```

Post:

```text
I built a local-first CLI for teams using Codex, Claude Code, Cursor, MCP, and n8n.

It scans repo instructions, verification commands, README replayability, secret hygiene, GitHub Actions risk, MCP allowlists, n8n workflow exports, and local AI cost traces.

The goal is not to replace language linters. It is to answer: "Is this repo safe and clear enough to hand to an AI coding agent?"

No account, no telemetry, no cloud required.
```

### Reddit

Target communities:

- `r/ClaudeAI`
- `r/cursor`
- `r/selfhosted`
- `r/devops`
- `r/n8n`
- `r/opensource`

Angle:

```text
I made a local scanner for AI-agent repo risk: MCP allowlists, n8n workflow safety, GitHub Actions permissions, secret-like values, and scan history.
```

### MCP Directories / Awesome Lists

Submit the MCP registry angle:

```text
Agent Reliability Kit helps teams review MCP config files against a private allowlist with trust score, permissions, approved commands/URLs, and risk owner metadata.
```

### Product Hunt

Use after GitHub README, docs homepage, and demo asset are polished.

Tagline:

```text
Local reliability checks for AI-agent-assisted codebases.
```

## Follow-Up Metrics

- GitHub stars
- npm downloads
- CLI runs from issue comments
- opened issues with real repo samples
- discussions asking for team policy/dashboard
- requests for GitHub Action or hosted reporting
