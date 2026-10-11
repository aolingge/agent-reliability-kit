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

The resolved output directory is excluded from source discovery, including custom destinations, so repeated runs do not back up their own generated files. Output must not be the source repository root or its ancestor, including directory aliases. Paths are flattened using `__` for compatibility; if two source paths would produce the same backup filename, the command stops before writing any backup files. Names are compared without case on every platform, including the reserved `README.md` and `backup-report.json`, so backups remain portable to case-insensitive filesystems. This also rejects otherwise distinct names differing only in case on a case-sensitive filesystem. Choose distinct source filenames and retry. Previously generated files for the same source may still be refreshed on later runs; unrelated stale files are not deleted.

The command writes:

- redacted workflow JSON files
- `README.md`
- `backup-report.json`

It does not call the n8n API. Export workflows locally first, then run the backup command over the exported folder or repository.
