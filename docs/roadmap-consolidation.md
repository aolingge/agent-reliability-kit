# Product Consolidation Roadmap

Agent Reliability Kit is the umbrella product.

The smaller tools should either become subcommands, rule packs, or SEO entry points that point back here.

## Current Umbrella Commands

```text
ark scan
ark doctor
ark init
ark team-audit
ark mcp-registry
ark n8n-scan
ark n8n-backup
ark cost-report
```

## Migration Targets

| Existing repo | Target in Agent Reliability Kit |
| --- | --- |
| `agent-secret-guard` | `ark scan` secret rules, later `ark secrets scan` |
| `mcp-config-doctor` | `ark mcp-registry` and future `ark mcp doctor` |
| `ai-pr-risk-labeler` | future `ark pr verify` |
| `agent-run-trace-pack` | `ark cost-report` and future `ark trace run` |
| `agent-runbook-check` | `ark scan` runbook scanner |
| `agent-hardening-kit` | umbrella positioning and docs merged into `ark scan` |
| `prompt-yaml-lint` | `ark prompt-lint` |
| n8n tools | `ark n8n-scan` and `ark n8n-backup` |

## Integrated Scanner Rules

These small-tool capabilities now run inside `ark scan`:

| Source tool | Integrated scanner | What moved |
| --- | --- | --- |
| `agent-shell-safety-check` | `shell-safety` | Unguarded destructive or publishing commands in docs and scripts. |
| `agent-memory-audit` | `memory-rules` | Trigger, behavior, exception, and secret-boundary signals in memory/rule files. |
| `repo-release-proof` | `release-readiness` | Release note proof signals: changes, verification, version, and publication targets. |

## Rule

Do not create another small repo until the flagship README, docs, npm package, demo, and launch channels are strong.
