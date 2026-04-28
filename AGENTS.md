# Agent Instructions

This repository is a public TypeScript CLI project. Keep changes small, testable, and safe to publish.

## Commands

- Install: `npm install`
- Build: `npm run build`
- Typecheck: `npm run typecheck`
- Test: `npm test`
- Lint: `npm run lint`
- Full verification: `npm run check`
- Smoke test after build: `npm run smoke`

## Safety

- Never commit secrets, tokens, cookies, browser profiles, private paths, or raw private logs.
- Fixtures may contain fake token-looking strings only when they are obviously synthetic and used to test redaction.
- Do not publish to npm, create GitHub releases, or push remote branches unless the user explicitly asks.
- Do not enable OMX project configuration in this workspace.

## Style

- Code and public docs are written in English.
- Keep CLI output concise, actionable, and friendly for GitHub Actions logs.
- Reports must include severity, file path, reason, and next action.

