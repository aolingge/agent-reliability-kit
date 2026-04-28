import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepository } from "../src/core/scan.js";
import { initProject } from "../src/init/initProject.js";
import { formatMarkdown } from "../src/report/markdown.js";

const fixtures = path.join(import.meta.dirname, "fixtures");

describe("scanRepository", () => {
  it("scores a clean repository highly", () => {
    const report = scanRepository(path.join(fixtures, "clean-node"));
    expect(report.score).toBeGreaterThanOrEqual(90);
    expect(report.summary.critical).toBe(0);
    expect(report.facts.detectedCommands).toContain("npm run check");
  });

  it("redacts and reports token-like values", () => {
    const report = scanRepository(path.join(fixtures, "secret-risk"));
    expect(report.summary.critical).toBeGreaterThan(0);
    const secretFinding = report.findings.find((finding) => finding.id === "secrets.token-like-value");
    expect(secretFinding?.evidence).toContain("[redacted]");
    expect(secretFinding?.evidence).not.toContain("liveValueForScannerDetectionOnly");
  });

  it("detects unsafe GitHub Actions patterns", () => {
    const report = scanRepository(path.join(fixtures, "unsafe-action"));
    expect(report.findings.map((finding) => finding.id)).toContain("ci.pull-request-target");
    expect(report.findings.map((finding) => finding.id)).toContain("ci.pipe-to-shell");
  });

  it("renders Markdown reports", () => {
    const report = scanRepository(path.join(fixtures, "conflicting-agent-rules"));
    const markdown = formatMarkdown(report);
    expect(markdown).toContain("Agent Reliability Report");
    expect(markdown).toContain("Findings");
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
