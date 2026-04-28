# Release Readiness

This checklist keeps release preparation repeatable without performing a publish. It covers the low-risk checks maintainers can run before tagging, creating a GitHub release, or publishing to npm.

## Current Community Surface

- `README.md` includes install, quick start, report outputs, security expectations, contribution link, roadmap, and license.
- `CONTRIBUTING.md` asks contributors to run `npm run check`, keep changes focused, and avoid secrets or private logs.
- `SECURITY.md` directs vulnerability reports away from public issues and explains safe proof-of-concept expectations.
- `.github/pull_request_template.md` asks for verification and private-data safety confirmation.
- `.github/ISSUE_TEMPLATE/bug_report.yml` requests reproducible, redacted bug reports.
- `.github/dependabot.yml` keeps npm development dependencies and GitHub Actions updates visible through pull requests.

## CI Baseline

The default CI workflow runs on pull requests and pushes to `main` with read-only repository permissions:

```bash
npm ci
npm run check
npm run smoke
```

`npm run check` is the broad gate: lint, typecheck, tests, and build. `npm run smoke` exercises the built CLI against the clean fixture and writes Markdown, JSON, and HTML reports under `.tmp/smoke`.

## Local Release Dry Run

Run these commands before any manual release step:

```bash
npm run check
npm run smoke
node scripts/release-dry-run.mjs
```

The dry-run script wraps `npm pack --json --dry-run`, parses the package file list, and fails if required public artifacts are missing from the tarball preview. It does not publish to npm, create tags, create GitHub releases, push branches, or read credentials.

## Package Contract

The npm package preview should include at least:

- `package.json`
- `README.md`
- `LICENSE`
- `dist/cli.js`
- `docs/release-readiness.md`
- `docs/examples/clean-report.md`

The package should not include `.env` files, cookies, browser profiles, private logs, local scan output, or credential material. The current `files` allowlist in `package.json` limits the package to `dist`, `docs`, `assets`, `README.md`, and `LICENSE`.

The current repository is in pre-release local mode. Do not add public GitHub, issue tracker, CI badge, or npm links until the public remote exists; dead links reduce launch trust. Add `repository`, `bugs`, and `homepage` metadata in the same commit that creates the public release surface.

## Manual Release Boundary

These steps stay manual and are intentionally outside the dry-run script:

- choose and commit the version bump,
- update release notes or changelog material,
- create the Git tag,
- create the GitHub release,
- run `npm publish` with the maintainer's own authenticated npm session.

If any dry-run or CI check fails, fix that failure before continuing to manual release actions.
