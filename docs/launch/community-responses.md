# Community Responses

## What is this?

Agent Reliability Kit is a local-first CLI that checks whether a repository is ready for AI-agent-assisted development. It scans repo instructions, verification commands, README quality, secret hygiene, GitHub Actions safety, MCP/tooling risk, and release readiness.

Links:

- [Public repository](https://github.com/aolingge/agent-reliability-kit)
- [npm package](https://www.npmjs.com/package/agent-reliability-kit)
- [Documentation](https://aolingge.github.io/agent-reliability-kit/)

## Is this another AI coding agent?

No. It is a repository readiness scanner. It does not generate code, call models, operate tools, or require agent credentials.

## Which agents does it support?

It is agent-neutral. The checks are designed around surfaces that commonly affect Codex, Claude Code, Cursor, Gemini CLI, OpenCode, GitHub Copilot coding workflows, and MCP-based local toolchains.

## Does it upload my code?

The scanner is designed to run locally and write local reports. You choose what to share. Do not share reports that contain real secrets, private URLs, private logs, cookies, browser profiles, or sensitive source details.

## Is it a security tool?

It includes secret hygiene and CI safety checks, but the safer framing is repository readiness for AI-agent-assisted development. Use it alongside dedicated security scanners, dependency checks, and human review.

## Why not just write a better `AGENTS.md`?

A good `AGENTS.md` helps, but agents also depend on working commands, clear README instructions, safe CI defaults, private-data boundaries, and tooling configuration. Agent Reliability Kit checks that broader surface.

## Does this guarantee an AI agent will behave safely?

No. It makes repo readiness issues visible and repeatable. It does not guarantee model behavior, replace review, or prevent every unsafe action.

## Can I use it in CI?

Yes, that is one intended workflow. The CLI writes human-readable and machine-readable outputs so maintainers can use it before PRs, in CI, or during release preparation.

Example using the public package:

```bash
npx agent-reliability-kit scan . --min-score 85
```

## Why does it flag my README?

AI-assisted contributors need install and verification steps they can replay. README findings are meant to catch missing quick starts, unclear install paths, missing license or contribution links, and other signals that slow down maintainers and agents.

## Why does it care about GitHub Actions permissions?

CI is often the path from an AI-assisted change to a trusted result. Explicit permissions and clear validation commands reduce ambiguity and make workflow risk easier to review.

## Why does it look at MCP or tool configs?

MCP and local toolchains can expand what an agent can do. The scanner looks for configuration surfaces that should be visible to maintainers before an agent uses them.

## Is the npm package available?

Yes. The package is available on [npm](https://www.npmjs.com/package/agent-reliability-kit). Check the registry version before quoting a version number; installation instructions are in the [README](../../README.md#quick-start).

## Is the GitHub repo public?

Yes. The source, public fixtures and contributor instructions are in the [GitHub repository](https://github.com/aolingge/agent-reliability-kit). These response examples are drafts for maintainers to adapt; no message is sent automatically.

## How should I report a false positive?

Open an issue or discussion with:

- tool version or commit;
- operating system;
- the finding category;
- a minimal redacted example;
- what result you expected.

Do not include real secrets, private logs, private URLs, cookies, browser profiles, or sensitive source code.

## How should I suggest a new check?

Describe the agent failure mode, the file or config surface involved, and the next action a maintainer should take. Checks are more useful when they produce a concrete fix instead of a vague warning.

## Can this scan private repos?

It can run locally on repositories you have access to, but be careful with report sharing. Review generated reports before posting screenshots or issue attachments.

## How is this different from linting?

Linters usually check code style or language rules. Agent Reliability Kit checks repo operating surfaces: instructions, commands, docs, CI, secret hygiene, and AI tooling configuration.

## Short Reply Templates

### Thanks

Thanks for taking a look. The highest-value feedback right now is false positives, confusing next actions, missing stacks, and install friction.

### Private Data Reminder

Please remove any real secrets, private URLs, raw logs, cookies, browser profiles, or sensitive source details before sharing scan output.

### Scope Clarification

This is not trying to replace code review or security scanning. It is meant to make AI-agent repo readiness visible and repeatable.

### Availability Clarification

The public repo, docs, and npm package are live. I am still avoiding adoption claims, benchmark claims, and guarantees unless there is evidence.
