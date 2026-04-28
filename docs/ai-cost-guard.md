# AI Cost Guard

`cost-report` summarizes local JSON or JSONL trace files from coding-agent runs.

```bash
ark cost-report . \
  --trace .agent-reliability/traces \
  --budget-usd 10 \
  --out .agent-reliability/cost
```

It writes:

- `.agent-reliability/cost/cost-report.md`
- `.agent-reliability/cost/cost-report.json`

## Supported Event Shapes

JSONL:

```json
{"provider":"openai","model":"gpt-5.2","inputTokens":1000,"outputTokens":500,"costUsd":0.25}
{"provider":"anthropic","model":"claude-sonnet","usage":{"prompt_tokens":2000,"completion_tokens":1000},"cost_usd":0.75}
```

JSON:

```json
{
  "events": [
    {
      "provider": "openai",
      "model": "gpt-5.2",
      "inputTokens": 1000,
      "outputTokens": 500,
      "costUsd": 0.25
    }
  ]
}
```

## Scope

This is a local cost guard, not a provider billing source of truth. It is designed for agent run traces, budget alerts, and "which model burned the most tokens?" debugging.
