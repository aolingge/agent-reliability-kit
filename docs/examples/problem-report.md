# Example Problem Report Template

Use this template when opening an issue or sharing a scanner failure. Keep it reproducible and redacted: do not include real secrets, private logs, cookies, browser profiles, or private URLs.

## Reproduction

```bash
npm install
npm run build
node dist/cli.js scan tests/fixtures/secret-risk --out .tmp/example-report --format markdown,json,html --min-score 0
```

This fixture intentionally returns exit code 1 after writing reports because it contains a synthetic critical finding.

Repository shape:

```text
example-repo/
  AGENTS.md
  package.json
  config.txt
```

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

## Expected Behavior

The report should keep every finding actionable while redacting token-like evidence. If a fixture needs a token-shaped value, use an obvious synthetic placeholder and never paste a real credential.
