import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/core/scan.js";
import { initProject } from "../src/init/initProject.js";
import { formatMarkdown } from "../src/report/markdown.js";
import { renderReport } from "../src/report/write.js";
import type { Finding, Report, ReportFormat } from "../src/types.js";

const fixtures = path.join(import.meta.dirname, "fixtures");
const syntheticSecret = "sk-scannerDetectionOnlyValueZYXWVUTSRQPONML";

describe("scanRepository", () => {
  it("scores a clean repository highly", () => {
    const report = scanRepository(path.join(fixtures, "clean-node"));
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.summary.critical).toBe(0);
    expect(report.facts.detectedCommands).toContain("npm run check");
    expect(report.findings.filter((finding) => finding.id.startsWith("readme.") || finding.id.startsWith("release.")).map((finding) => finding.id)).toEqual([]);
  });

  it("detects conflicting agent instruction guidance", () => {
    const report = scanRepository(path.join(fixtures, "conflicting-agent-rules"));
    expect(report.findings.map((finding) => finding.id)).toContain("agents.possible-command-conflict");
  });

  it("detects repositories without verification commands", () => {
    const report = scanRepository(path.join(fixtures, "missing-commands"));
    expect(report.findings.map((finding) => finding.id)).toContain("commands.none-detected");
    expect(report.findings.map((finding) => finding.id)).toContain("release.package-json.missing");
  });

  it("detects missing operational runbook steps", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-runbook-risk-"));
    fs.writeFileSync(path.join(temp, "README.md"), "# Runbook Risk\n\nRun `npm test` to verify changes.\n", "utf8");
    fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
      name: "runbook-risk",
      version: "1.0.0",
      license: "MIT",
      scripts: {
        test: "node -e \"console.log('ok')\"",
        build: "node -e \"console.log('ok')\""
      }
    }, null, 2), "utf8");

    const report = scanRepository(temp);
    const finding = report.findings.find((item) => item.id === "runbook.missing-operational-steps");

    expect(finding?.scanner).toBe("runbook");
    expect(finding?.next).toContain("debug");
    expect(finding?.next).toContain("rollback");
    expect(finding?.next).toContain("report");
  });

  it("detects unguarded destructive shell commands", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-shell-safety-"));
    fs.writeFileSync(path.join(temp, "README.md"), "# Shell Safety\n\nRun `rm -rf dist` before packaging.\n", "utf8");
    fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
      name: "shell-safety",
      version: "1.0.0",
      description: "fixture",
      license: "MIT",
      scripts: {
        test: "node -e \"console.log('ok')\"",
        build: "node -e \"console.log('ok')\""
      }
    }, null, 2), "utf8");

    const report = scanRepository(temp);
    const finding = report.findings.find((item) => item.id === "shell-safety.rm-rf.unguarded");

    expect(finding?.scanner).toBe("shell-safety");
    expect(finding?.file).toBe("README.md");
    expect(finding?.next).toContain("dry-run");
  });

  it("checks memory rule files for reusable rule structure", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-memory-rules-"));
    fs.writeFileSync(path.join(temp, "shared-memory.md"), "# Shared Memory\n\nAlways run the check.\n", "utf8");
    fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
      name: "memory-rules",
      version: "1.0.0",
      description: "fixture",
      license: "MIT",
      scripts: {
        test: "node -e \"console.log('ok')\"",
        build: "node -e \"console.log('ok')\""
      }
    }, null, 2), "utf8");

    const report = scanRepository(temp);
    const finding = report.findings.find((item) => item.id === "memory-rules.incomplete-contract");

    expect(finding?.scanner).toBe("memory-rules");
    expect(finding?.evidence).toContain("trigger");
    expect(finding?.evidence).toContain("secret boundary");
  });

  it("checks release notes for change and verification proof", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-release-note-"));
    fs.writeFileSync(path.join(temp, "CHANGELOG.md"), "# Changelog\n\nInitial public note.\n", "utf8");
    fs.writeFileSync(path.join(temp, "README.md"), "# Release Note Fixture\n\nInstall with npm.\n\nRun tests.\n\nLicense: MIT.\n\nContributing welcome.\n\nreport.md report.json report.html\n", "utf8");
    fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
      name: "release-note-fixture",
      version: "1.0.0",
      description: "fixture",
      license: "MIT",
      scripts: {
        test: "node -e \"console.log('ok')\"",
        build: "node -e \"console.log('ok')\""
      }
    }, null, 2), "utf8");

    const report = scanRepository(temp);
    const finding = report.findings.find((item) => item.id === "release.note-missing-proof");

    expect(finding?.scanner).toBe("release-readiness");
    expect(finding?.file).toBe("CHANGELOG.md");
    expect(finding?.evidence).toContain("changes");
    expect(finding?.evidence).toContain("verification");
  });

  it("redacts and reports synthetic token-like values across report formats", () => {
    const report = scanRepository(path.join(fixtures, "secret-risk"));
    expect(report.summary.critical).toBeGreaterThan(0);
    const secretFinding = report.findings.find((finding) => finding.id === "secrets.token-like-value");
    expect(secretFinding?.evidence).toContain("[redacted]");
    expect(secretFinding?.evidence).not.toContain(syntheticSecret);

    const formats: ReportFormat[] = ["text", "markdown", "json", "html", "sarif", "annotations"];
    for (const format of formats) {
      const output = renderReport(report, format);
      expect(output).toContain("[redacted]");
      expect(output).not.toContain(syntheticSecret);
    }
  });

  it("detects unsafe GitHub Actions patterns", () => {
    const report = scanRepository(path.join(fixtures, "unsafe-action"));
    const ids = report.findings.map((finding) => finding.id);
    expect(ids).toContain("ci.pull-request-target");
    expect(ids).toContain("ci.pipe-to-shell");
    expect(ids).toContain("ci.permissions-too-broad");
    expect(ids).toContain("ci.no-validation-command");
  });

  it("detects risky n8n workflow exports", () => {
    const report = scanRepository(path.join(fixtures, "n8n-risk"));
    const ids = report.findings.map((finding) => finding.id);
    expect(ids).toContain("n8n.public-webhook");
    expect(ids).toContain("n8n.command-execution-node");
    expect(ids).toContain("n8n.risky-code-node");
    expect(ids).toContain("n8n.secret-like-value");
    expect(report.facts.n8nWorkflowFiles).toEqual(["workflows/risky.json"]);
  });

  it("detects inline unsafe GitHub Actions syntax", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-inline-action-"));
    fs.mkdirSync(path.join(temp, ".github", "workflows"), { recursive: true });
    fs.writeFileSync(path.join(temp, "README.md"), "# Inline Action Fixture\n", "utf8");
    fs.writeFileSync(path.join(temp, "package.json"), JSON.stringify({
      name: "inline-action-fixture",
      version: "1.0.0",
      description: "fixture",
      license: "MIT",
      scripts: {
        check: "node -e \"console.log('ok')\"",
        test: "node -e \"console.log('ok')\""
      }
    }, null, 2), "utf8");
    fs.writeFileSync(path.join(temp, ".github", "workflows", "inline.yml"), [
      "name: inline-danger",
      "on: [pull_request_target]",
      "permissions: { contents: write }",
      "jobs:",
      "  test:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: npm run check",
      ""
    ].join("\n"), "utf8");

    const report = scanRepository(temp);
    const ids = report.findings.map((finding) => finding.id);
    expect(ids).toContain("ci.pull-request-target");
    expect(ids).toContain("ci.permissions-too-broad");
  });

  it("checks README and release-readiness signals", () => {
    const report = scanRepository(path.join(fixtures, "missing-commands"));
    const ids = report.findings.map((finding) => finding.id);
    expect(ids).toContain("readme.no-install");
    expect(ids).toContain("readme.no-license-path");
    expect(ids).toContain("readme.no-contribution-path");
    expect(ids).toContain("release.package-json.missing");
  });

  it("renders Markdown reports", () => {
    const report = scanRepository(path.join(fixtures, "conflicting-agent-rules"));
    const markdown = formatMarkdown(report);
    expect(markdown).toContain("Agent Reliability Report");
    expect(markdown).toContain("Findings");
  });

  it("renders every finding with severity, location, reason, and next action in human formats", () => {
    const report = scanRepository(path.join(fixtures, "unsafe-action"));
    const outputs = {
      text: renderReport(report, "text"),
      markdown: renderReport(report, "markdown"),
      annotations: renderReport(report, "annotations")
    };

    for (const finding of report.findings) {
      for (const output of [outputs.text, outputs.markdown]) {
        expect(output).toContain(finding.severity);
        expect(output).toContain(location(finding));
        expect(output).toContain(finding.why);
        expect(output).toContain(finding.next);
      }

      expect(outputs.annotations).toContain(escapeAnnotation(finding.severity));
      expect(outputs.annotations).toContain(escapeAnnotation(location(finding)));
      expect(outputs.annotations).toContain(escapeAnnotation(finding.why));
      expect(outputs.annotations).toContain(escapeAnnotation(finding.next));
    }
  });

  it("renders parseable SARIF with stable unique rule ids and locations", () => {
    const report = fixtureReport([
      {
        id: "ci.no-validation-command",
        title: "No validation command",
        severity: "medium",
        scanner: "github-actions",
        file: ".github/workflows/ci.yml",
        line: 12,
        why: "CI should prove the repository still builds and tests.",
        next: "Add npm run check or an equivalent validation command."
      },
      {
        id: "ci.no-validation-command",
        title: "No validation command",
        severity: "medium",
        scanner: "github-actions",
        file: ".github/workflows/release.yml",
        line: 8,
        why: "CI should prove the repository still builds and tests.",
        next: "Add npm run check or an equivalent validation command."
      }
    ]);

    const sarif = JSON.parse(renderReport(report, "sarif")) as {
      runs: Array<{
        tool: { driver: { rules: Array<{ id: string }> } };
        results: Array<{ ruleId: string; locations: Array<{ physicalLocation: { artifactLocation: { uri: string } } }> }>;
      }>;
    };

    expect(sarif.runs[0]?.tool.driver.rules.map((rule) => rule.id)).toEqual(["ci.no-validation-command"]);
    expect(sarif.runs[0]?.results).toHaveLength(2);
    expect(sarif.runs[0]?.results[0]?.ruleId).toBe("ci.no-validation-command");
    expect(sarif.runs[0]?.results[0]?.locations[0]?.physicalLocation.artifactLocation.uri).toBe(".github/workflows/ci.yml");
  });

  it("returns actionable finding metadata", () => {
    const report = scanRepository(path.join(fixtures, "unsafe-action"));
    for (const finding of report.findings) {
      expectCompleteFinding(finding);
    }
  });
});

describe("initProject", () => {
  it("creates starter files without overwriting existing files", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-init-"));
    fs.mkdirSync(path.join(temp, ".github"), { recursive: true });
    fs.writeFileSync(path.join(temp, "SECURITY.md"), "custom\n", "utf8");
    const result = initProject(temp);
    expect(result.created).toContain(".agent-reliability/config.json");
    expect(result.skipped).toContain("SECURITY.md");
    expect(fs.readFileSync(path.join(temp, "SECURITY.md"), "utf8")).toBe("custom\n");
  });

  it("overwrites existing starter files when force is true", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-init-force-"));
    fs.writeFileSync(path.join(temp, "SECURITY.md"), "custom\n", "utf8");
    const result = initProject(temp, true);

    expect(result.created).toContain("SECURITY.md");
    expect(result.skipped).not.toContain("SECURITY.md");
    expect(fs.readFileSync(path.join(temp, "SECURITY.md"), "utf8")).toContain("# Security Policy");
  });
});

function expectCompleteFinding(finding: Finding): void {
  expect(finding.id).toBeTruthy();
  expect(finding.title).toBeTruthy();
  expect(finding.severity).toMatch(/^(critical|high|medium|low|info)$/);
  expect(finding.scanner).toBeTruthy();
  expect(finding.why).toBeTruthy();
  expect(finding.next).toBeTruthy();
  if (finding.file) expect(finding.file.trim()).toBe(finding.file);
}

function location(finding: Finding): string {
  if (!finding.file) return "repository";
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}

function escapeAnnotation(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(",", "%2C").replaceAll(":", "%3A");
}

function fixtureReport(findings: Finding[]): Report {
  return {
    tool: {
      name: "agent-reliability-kit",
      version: "0.1.0"
    },
    root: "fixture",
    generatedAt: "2026-04-28T00:00:00.000Z",
    score: 80,
    grade: "B",
    summary: {
      critical: 0,
      high: 0,
      medium: findings.length,
      low: 0,
      info: 0,
      total: findings.length
    },
    facts: {},
    findings
  };
}
