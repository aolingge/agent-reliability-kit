# Team Audit Layer

`team-audit` is the local MVP for the future paid team layer. It does not require a server and it does not send network requests.

```bash
ark team-audit . --out .agent-reliability/team
```

It writes:

- `.agent-reliability/team/team-audit.md`
- `.agent-reliability/team/team-audit.json`
- `.agent-reliability/team/history/*.json`
- `.agent-reliability/team/slack-payload.json`

## Policy

Create `.agent-reliability/team-policy.json`:

```json
{
  "minScore": 85,
  "maxCritical": 0,
  "maxHigh": 0,
  "requiredFiles": ["AGENTS.md", "SECURITY.md", "README.md"],
  "requireMcpRegistry": true,
  "slackChannel": "#agent-reliability"
}
```

## Slack Alerts

The command writes a Slack payload file only. It never calls a webhook.

Teams can wire the generated `slack-payload.json` into their own approved notification workflow.

## Commercial Path

This local report maps cleanly to a paid team product:

- scan history across repositories
- org-level policy packs
- private registry enforcement
- audit exports for security reviews
- Slack/email/webhook integrations
- team dashboards and trend charts
