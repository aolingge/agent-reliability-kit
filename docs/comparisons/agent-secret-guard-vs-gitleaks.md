# agent-secret-guard vs gitleaks

Use both when possible.

`gitleaks` is a strong general-purpose secret scanner. `agent-secret-guard` and Agent Reliability Kit focus on the agent-era surfaces around those secrets.

| Need | gitleaks | Agent Reliability Kit / agent-secret-guard |
| --- | --- | --- |
| Generic secret detection | Strong | Focused, lightweight |
| AI-agent config context | Limited | Built in |
| MCP config risk | Limited | Built in |
| Local automation notes | Limited | Built in |
| GitHub Actions permission hints | Limited | Built in |
| Redacted reports for agent handoff | Limited | Built in |
| Team policy and audit package | External | Local MVP |

## Positioning

If a team already runs `gitleaks`, Agent Reliability Kit should sit next to it:

```bash
gitleaks detect
ark scan .
ark mcp-registry .
ark team-audit .
```

The product angle is not "replace every scanner." It is "catch the AI-agent and MCP operational risks that generic scanners do not explain well."
