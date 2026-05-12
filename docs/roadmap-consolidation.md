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
ark prompt-lint
ark text-audit
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
| single-file repo/PR/task text checkers | `ark text-audit --profile <name>` |

## Integrated Scanner Rules

These small-tool capabilities now run inside `ark scan`:

| Source tool | Integrated scanner | What moved |
| --- | --- | --- |
| `agent-shell-safety-check` | `shell-safety` | Unguarded destructive or publishing commands in docs and scripts. |
| `agent-memory-audit` | `memory-rules` | Trigger, behavior, exception, and secret-boundary signals in memory/rule files. |
| `repo-release-proof` | `release-readiness` | Release note proof signals: changes, verification, version, and publication targets. |

## Integrated Text Audit Profiles

These small CLI repositories now have compatibility profiles in `ark text-audit`:

| Source tool | Profile |
| --- | --- |
| `agent-ci-doctor` | `agent-ci` |
| `ci-command-harvest` | `ci-command` |
| `agents-md-doctor` | `agents-md` |
| `agent-context-budget` | `context-budget` |
| `agent-context-diff` | `context-diff` |
| `agent-env-redactor` | `env-redactor` |
| `agent-log-triage` | `log-triage` |
| `agent-permission-audit` | `permission-audit` |
| `agent-pr-brief` | `pr-brief` |
| `agent-runbook-check` | `runbook` |
| `agent-task-scope` | `task-scope` |
| `agent-tool-risk-score` | `tool-risk` |
| `agent-windows-path-doctor` | `windows-path` |
| `agentignore-check` | `agentignore` |
| `ai-changelog-guard` | `changelog` |
| `ai-pr-risk-labeler` | `pr-risk` |
| `mcp-readme-score` | `mcp-readme` |
| `release-mirror-check` | `release-mirror` |
| `repo-agent-health` | `repo-health` |
| `repo-context-pack` | `repo-context` |
| `repo-onboarding-check` | `onboarding` |
| `skill-md-lint` | `skill-md` |

## Rule

Do not create another small repo until the flagship README, docs, npm package, demo, and launch channels are strong.
