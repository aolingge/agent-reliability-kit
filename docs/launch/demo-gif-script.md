# Demo GIF Script

Record this flow after `npm run build`.

Use a clean terminal with no private paths, no real repository names, and no credentials visible.

```bash
npm run build
ark scan tests/fixtures/n8n-risk --format text --stdout --min-score 0
ark mcp-registry tests/fixtures/mcp-registry --out .tmp/demo-mcp
ark cost-report tests/fixtures/cost-trace --budget-usd 0.50 --out .tmp/demo-cost
```

Storyboard:

1. Start on the README hero.
2. Run `ark scan tests/fixtures/n8n-risk --format text --stdout --min-score 0`.
3. Show the critical n8n command execution finding.
4. Run `ark mcp-registry tests/fixtures/mcp-registry --out .tmp/demo-mcp`.
5. Show disabled/unallowlisted MCP server findings.
6. Run `ark cost-report tests/fixtures/cost-trace --budget-usd 0.50 --out .tmp/demo-cost`.
7. Show the budget alert and generated report paths.

Recommended caption:

```text
One local CLI for agent-era repo risk: secrets, MCP allowlists, n8n workflow safety, team audit, and AI cost guard.
```

Never record real configs, browser profiles, Slack webhooks, private repo paths, or token values.
