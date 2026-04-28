export interface TemplateFile {
  path: string;
  content: string;
}

export const INIT_TEMPLATES: TemplateFile[] = [
  {
    path: ".agent-reliability/config.json",
    content: `{
  "minScore": 80,
  "formats": ["markdown", "json", "html"],
  "ignore": []
}
`
  },
  {
    path: "SECURITY.md",
    content: `# Security Policy

Please do not open public issues for suspected vulnerabilities or leaked credentials.

Report security concerns privately to the maintainer. Include the affected version, impact, reproduction steps, and any safe proof of concept. Do not include real secrets in screenshots, logs, or examples.
`
  },
  {
    path: ".github/pull_request_template.md",
    content: `## Summary

-

## Verification

- [ ] Tests or smoke checks ran locally
- [ ] Docs updated when behavior changed
- [ ] No secrets, tokens, cookies, or private logs included

## Agent Notes

- Tool used:
- Risk level:
`
  },
  {
    path: ".github/ISSUE_TEMPLATE/bug_report.yml",
    content: `name: Bug report
description: Report a reproducible problem
title: "[Bug]: "
labels: ["bug", "needs-triage"]
body:
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: What happened?
    validations:
      required: true
  - type: textarea
    id: reproduce
    attributes:
      label: Reproduction
      description: Minimal steps or repository shape that reproduces the issue.
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs
      description: Paste only redacted logs. Never include secrets.
`
  },
  {
    path: ".github/workflows/agent-reliability.yml",
    content: `name: agent reliability

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run check
`
  }
];
