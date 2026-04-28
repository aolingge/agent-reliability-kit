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
| `agent-hardening-kit` | umbrella positioning and docs merged into `ark scan` |
| n8n tools | `ark n8n-scan` and `ark n8n-backup` |

## Rule

Do not create another small repo until the flagship README, docs, npm package, demo, and launch channels are strong.
