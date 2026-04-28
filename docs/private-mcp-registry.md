# Private MCP Registry

`mcp-registry` checks committed or passed MCP config files against a private allowlist.

```bash
ark mcp-registry . \
  --registry .agent-reliability/mcp-registry.json \
  --config .mcp.json
```

It writes:

- `.agent-reliability/mcp-registry-report.md`
- `.agent-reliability/mcp-registry-report.json`

## Registry Format

```json
{
  "servers": [
    {
      "name": "filesystem",
      "approved": true,
      "trustScore": 90,
      "permissions": ["filesystem"],
      "allowedCommands": ["node"],
      "riskOwner": "platform",
      "riskReason": "Read-only local examples."
    },
    {
      "name": "browser",
      "approved": false,
      "trustScore": 45,
      "permissions": ["browser", "network"],
      "allowedUrls": ["https://approved.example/mcp"]
    }
  ]
}
```

## Checks

- missing private registry
- MCP server not allowlisted
- disabled server still used in config
- low trust score
- command not in `allowedCommands`
- remote URL not in `allowedUrls`
- risky permissions without `riskOwner` and `riskReason`
- token-like values pasted into MCP config

This is the base for a hosted team registry later.
