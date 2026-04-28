# Release Readiness

This checklist keeps release preparation and follow-up releases repeatable. It covers the low-risk checks maintainers can run before tagging, creating a GitHub release, or publishing another npm version.

## Current Community Surface

- `README.md` includes install, quick start, report outputs, security expectations, contribution link, roadmap, and license.
- `CONTRIBUTING.md` asks contributors to run `npm run check`, keep changes focused, and avoid secrets or private logs.
- `SECURITY.md` directs vulnerability reports away from public issues and explains safe proof-of-concept expectations.
- `.github/pull_request_template.md` asks for verification and private-data safety confirmation.
- `.github/ISSUE_TEMPLATE/bug_report.yml` requests reproducible, redacted bug reports.
- `.github/ISSUE_TEMPLATE/scanner_feedback.yml` routes false positives, missing checks, unsupported stacks, and wording feedback into a launch-friendly issue flow.
- `.github/dependabot.yml` keeps npm development dependencies and GitHub Actions updates visible through pull requests.
- `docs/launch/` contains launch copy, a demo script, press kit, community response templates, and channel rules.
- `assets/social-preview.png` and `assets/product-hunt-thumbnail.png` are ready for GitHub social preview and square launch surfaces.

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

If a later optional integration needs credentials, reuse an existing logged-in browser session, OpenCLI, a tool-native credential store, Cockpit Tools, or the local encrypted AI secret vault. Do not ask contributors to paste credentials into issue templates, progress logs, docs, repository files, or dry-run output.

## Launch Surface Dry Run

Before posting publicly, replace launch placeholders only after the matching public URLs exist:

- `<PUBLIC_REPO_URL>`
- `<NPM_PACKAGE_URL>`
- `<DOCS_URL>`

Then review:

- `docs/launch/launch-plan.md`
- `docs/launch/channel-copy.md`
- `docs/launch/demo-script.md`
- `docs/launch/press-kit.md`
- `docs/launch/community-responses.md`
- `docs/launch/channel-rules.md`
- `docs/launch/product-hunt.md`
- `docs/launch/devto-article.md`
- `docs/launch/live-links.md`

For GitHub, set a concise repository description, upload `assets/social-preview.png` as the social preview, and add focused topics such as `ai-agent`, `coding-agents`, `codex`, `claude-code`, `cursor`, `gemini-cli`, `mcp`, `developer-tools`, `ci`, `sarif`, `security`, `typescript`, and `cli`.

## Package Contract

The npm package preview should include at least:

- `package.json`
- `README.md`
- `LICENSE`
- `dist/cli.js`
- `docs/release-readiness.md`
- `docs/examples/clean-report.md`

The package should not include `.env` files, cookies, browser profiles, private logs, local scan output, or credential material. The current `files` allowlist in `package.json` limits the package to `dist`, `docs`, `assets`, `README.md`, and `LICENSE`.

The current repository is prepared for public npm distribution: the public GitHub repository, documentation URL, and npm package page are live. Keep install claims tied to the live package page and re-run the local release checks before publishing any follow-up version.

## Manual Release Boundary

These steps stay manual and are intentionally outside the dry-run script:

- choose and commit the version bump,
- update release notes or changelog material,
- create the Git tag,
- create the GitHub release,
- run `npm publish` with the maintainer's own authenticated npm session.

If any dry-run or CI check fails, fix that failure before continuing to manual release actions.
