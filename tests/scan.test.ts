import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/core/scan.js";
import { initProject } from "../src/init/initProject.js";
import { formatMarkdown } from "../src/report/markdown.js";
import { renderReport } from "../src/report/write.js";
import type { Finding, ReportFormat } from "../src/types.js";

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

  it("redacts and reports synthetic token-like values across report formats", () => {
    const report = scanRepository(path.join(fixtures, "secret-risk"));
    expect(report.summary.critical).toBeGreaterThan(0);
    const secretFinding = report.findings.find((finding) => finding.id === "secrets.token-like-value");
    expect(secretFinding?.evidence).toContain("[redacted]");
    expect(secretFinding?.evidence).not.toContain(syntheticSecret);

    const formats: ReportFormat[] = ["text", "markdown", "json", "html", "sarif", "annotations"];
    for (const format of formats) {
      const output = renderReport(report, format);
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
