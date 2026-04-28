# n8n Safety And Backup

Agent Reliability Kit now checks n8n workflow exports in the default `scan` command and also exposes n8n-focused commands.

```bash
ark n8n-scan . --out .agent-reliability/n8n --format markdown,json,html
ark n8n-backup . --backup-dir .agent-reliability/n8n-backup
```

## Safety Checks

- public webhook nodes without explicit authentication
- command execution nodes
- code/function nodes that use risky runtime APIs
- token-like values in workflow JSON

## Backup Behavior

`n8n-backup` writes formatted workflow JSON into a Git-friendly directory and redacts token-like values first.

The command writes:

- redacted workflow JSON files
- `README.md`
- `backup-report.json`

It does not call the n8n API. Export workflows locally first, then run the backup command over the exported folder or repository.
