# Backlog

This backlog tracks public repository governance work that is safe to discuss in issues, PRs, and release planning. Do not add secrets, private logs, cookies, browser profiles, private URLs, or account-specific evidence here.

## Current Governance Queue

- Review Dependabot PR #6 for `@types/node` patch updates. Current required check `verify` is passing, but merging remains a maintainer action.
- Keep issue #5 open as the public v0.1.0 feedback collection point until launch feedback has been triaged into concrete issues.
- Keep main branch protection active with required PR review, stale review dismissal, strict status checks, and the `verify` required check.

## Launch Hygiene

- Before any new release, run `npm run check`, `npm run smoke`, and a secret/privacy scan over the changed files.
- Keep README and launch materials aligned with the npm latest version and GitHub Pages documentation URL.
- Avoid adoption, benchmark, security certification, or production-use claims unless there is current public evidence.

## Later

- Add a short Dependabot review checklist for patch, minor, and major dependency updates.
- Add a release checklist that links launch copy, distribution notes, smoke output, and npm package metadata.
