import { hasFile, readRootText } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

export function scanReadme(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const readme = readRootText(context.root, "README.md");

  if (!readme) {
    findings.push({
      id: "readme.missing",
      title: "README.md is missing",
      severity: "high",
      scanner: "readme",
      why: "GitHub visitors decide whether to trust a project from the README first screen.",
      next: "Add a README with tagline, install, quick start, screenshot, examples, license, and contribution path."
    });
    return { findings, facts: { readme: false } };
  }

  const lower = readme.toLowerCase();
  const checks = [
    {
      ok: /(npm|pnpm|yarn|uvx|pipx|docker|cargo)\s+/.test(lower),
      id: "readme.no-install",
      title: "README lacks an install command",
      next: "Put the fastest install path in the first screen."
    },
    {
      ok: /(quick start|usage|getting started|try it)/.test(lower),
      id: "readme.no-quickstart",
      title: "README lacks a quick start",
      next: "Add a copy-paste command and expected output."
    },
    {
      ok: /(!\[|<img|assets\/|screenshot|demo|preview)/.test(lower),
      id: "readme.no-visual-proof",
      title: "README lacks visual proof",
      next: "Add a screenshot, report preview, terminal demo, or product diagram."
    },
    {
      ok: /(license|mit|apache-2\.0)/.test(lower) && hasFile(context.files, "LICENSE"),
      id: "readme.no-license-path",
      title: "README does not clearly expose the license",
      next: "Add a License section and keep a LICENSE file at the repository root."
    },
    {
      ok: /(contributing|good first issue|pull request|community)/.test(lower),
      id: "readme.no-contribution-path",
      title: "README lacks a contributor path",
      next: "Link to CONTRIBUTING.md and label beginner-friendly work."
    }
  ];

  for (const check of checks) {
    if (check.ok) continue;
    findings.push({
      id: check.id,
      title: check.title,
      severity: "low",
      scanner: "readme",
      file: "README.md",
      why: "A polished open-source product should make trust and first use obvious.",
      next: check.next
    });
  }

  return {
    findings,
    facts: {
      readme: true,
      readmeLength: readme.length
    }
  };
}

