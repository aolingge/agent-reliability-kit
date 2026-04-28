# Agent Reliability Kit vs Generic Linters

Generic linters check code style, syntax, and language-specific rules.

Agent Reliability Kit checks whether a repository is safe and understandable enough for AI-assisted development.

| Surface | Generic linter | Agent Reliability Kit |
| --- | --- | --- |
| Code syntax/style | Strong | Not the focus |
| Agent instructions | No | Yes |
| Verification commands | No | Yes |
| README replayability | No | Yes |
| GitHub Actions risk | Sometimes | Yes |
| Secret-like agent config | Sometimes | Yes |
| MCP allowlist | No | Yes |
| n8n workflow safety | No | Yes |
| Team audit report | No | Yes |
| Local cost report | No | Yes |

## Message For Launch

This is not another JavaScript linter. It is a release-readiness and agent-readiness scanner for teams using Codex, Claude Code, Cursor, Gemini CLI, MCP, and local automation.
