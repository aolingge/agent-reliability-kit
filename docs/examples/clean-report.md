# Example Clean Report

This is a safe example of the Markdown report shape for a repository with no findings. It uses the public `tests/fixtures/clean-node` fixture and contains no secrets, private logs, cookies, browser profiles, or private URLs.

## Reproduction

```bash
npm install
npm run build
node dist/cli.js scan tests/fixtures/clean-node --out .tmp/clean-report --format markdown,json,html --min-score 90
```

The command writes:

- `tests/fixtures/clean-node/.tmp/clean-report/report.md`
- `tests/fixtures/clean-node/.tmp/clean-report/report.json`
- `tests/fixtures/clean-node/.tmp/clean-report/report.html`

## Representative Markdown Output

```markdown
# Agent Reliability Report

Generated: 2026-04-28T00:00:00.000Z

Repository: `clean-node`

Score: **100/100**

Grade: **A**

## Summary

- Critical: 0
- High: 0
- Medium: 0
- Low: 0
- Info: 0

## What The Scanner Saw

- Agent instruction files: `AGENTS.md`
- Detected commands: `npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`, `npm run check`
- GitHub Actions workflows: `.github/workflows/ci.yml`

## Findings

No findings across checked surfaces. Review project-specific risks before release.
```

## Sharing Guidance

Clean reports are useful in pull requests, release notes, and CI summaries. Keep shared examples reproducible from public fixtures, and replace any repository-specific paths with safe, relative paths before posting them.
