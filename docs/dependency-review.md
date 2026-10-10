# Dependency and Action review

Review the proposed head, not a previous commit's successful run. Dependency installation and verification are preparation; they do not grant permission to merge, publish a package or change repository protection.

## Classify the proposal

| Change | Review focus | Merge gate |
| --- | --- | --- |
| npm patch | Manifest/lock agreement, resolved package and transitive changes, supported runtime | A low-risk Dependabot patch may use auto-merge only when current protection and required checks are active and repository rules permit it. |
| npm minor | New APIs, transitive changes, runtime/engine requirements, relevant behavior | Apply current maintainer rules; a minor label alone does not establish compatibility. |
| npm major | Migration notes, changed defaults, supported Node versions, build and CLI behavior | Maintainer review is required. |
| GitHub Action | Official source/ref, runner runtime, permissions, triggers, token use and output/artifact scope | Maintainer review is required, even when the application Node version is unchanged. |

For grouped updates, assess every package rather than treating the group as one version bump. Development type packages can expose APIs absent from an older supported runtime; a passing typecheck alone does not prove runtime compatibility.

## Prepare evidence

1. Check out the exact proposal in isolation and preserve current main fixes and unrelated work. Inspect the manifest/lock diff and release or migration notes from the upstream project.
2. Run `npm ci`, `npm run check` and `npm run smoke`. For a runtime-sensitive change, exercise the minimum supported Node version as well as the current development version.
3. Run `npm audit` and distinguish actionable findings from unsupported-platform skips or network failures. Zero audit findings do not replace behavior tests or code review.
4. Recheck GitHub CI on the exact final head, current mergeability, required checks and review requirements. A later edit invalidates evidence that covered only the old head.
5. Record versions, commands, results and remaining limits in the PR. Keep private paths, credentials and raw private logs out of shared evidence.

Do not dispatch an issue-writing digest, release workflow or privileged job just to obtain a green badge. Inspect existing workflow triggers before deciding which verification is appropriate.

For a separately authorized release, continue with [release readiness](release-readiness.md) and the [distribution checklist](launch/distribution-checklist.md). This guide does not create or modify auto-merge, branch protection or workflow configuration.
