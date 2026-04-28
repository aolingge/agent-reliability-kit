# Example Problem Report

This example shows the style of findings Agent Reliability Kit produces.

## Findings

### [P0 critical] Possible OpenAI key

- Rule: `secrets.token-like-value`
- Location: `config.txt:1`
- Evidence: `sk-l...[redacted]...6789`
- Why it matters: public repositories must not expose token-like values.
- Next action: remove the value, rotate it if real, and replace examples with obvious placeholders.

### [P1 high] Workflow uses pull_request_target

- Rule: `ci.pull-request-target`
- Location: `.github/workflows/danger.yml`
- Why it matters: this trigger can expose elevated permissions to untrusted pull request paths.
- Next action: use `pull_request` unless the workflow is explicitly hardened and documented.

