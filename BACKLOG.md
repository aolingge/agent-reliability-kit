# Backlog

This backlog tracks public repository governance work that is safe to discuss in issues, PRs, and release planning. Do not add secrets, private logs, cookies, browser profiles, private URLs, or account-specific evidence here.

## Current Governance Queue

- Review current dependency proposals using the [dependency review guide](docs/dependency-review.md); recheck exact-head CI rather than relying on old PR numbers or green checks.
- Triage public feedback into reproducible findings, expected behavior and focused fixes before changing issue state.
- Recheck branch protection and required checks before a merge; record the current state instead of treating this backlog as a live configuration report.

## Launch Hygiene

- Before any new release, run `npm run check`, `npm run smoke`, and a secret/privacy scan over the changed files.
- Keep README and launch materials aligned with the npm latest version and GitHub Pages documentation URL.
- Avoid adoption, benchmark, security certification, or production-use claims unless there is current public evidence.

## Later

- Keep the dependency guide aligned with runtime engines, Action runner requirements and current maintainer rules.
- Use the existing [release readiness](docs/release-readiness.md) and [distribution checklist](docs/launch/distribution-checklist.md); verify package metadata and links before a separately authorized release.
