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
{"provider":"synthetic-provider","model":"synthetic-model","usage":{"input_tokens":1000,"output_tokens":500,"total_tokens":1500},"costUsd":0.25}
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

Token fields can use camelCase or the shown snake_case names, at the event root or inside `usage`. Existing `prompt_tokens`/`completion_tokens` aliases remain supported. An explicit total takes precedence over the input/output sum. The tool summarizes supplied cost fields; it does not infer prices or cost from token counts.

JSON/JSONL file extensions are case-insensitive, and a UTF-8 BOM at the start of an export is accepted. Empty JSONL lines are ignored. If a JSON document or nonempty JSONL line has invalid syntax, valid records are still summarized, but an alert marks the totals as potentially incomplete and `cost-report` returns 1 even if the parsed cost is below budget. The invalid input text is not copied into reports. Repair the trace and rerun before treating the totals as complete. This syntax check does not certify arbitrary event schemas or provider billing data.

This is a local cost guard, not a provider billing source of truth. It is designed for agent run traces, budget alerts, and "which model burned the most tokens?" debugging.
