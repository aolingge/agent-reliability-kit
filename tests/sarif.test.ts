import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { formatPromptLintReport } from "../src/prompt/promptYamlLint.js";
import { renderReport } from "../src/report/write.js";
import { formatTextAuditReport } from "../src/text/textAudit.js";
import type { Report } from "../src/types.js";

function firstUri(serialized: string): string {
  return JSON.parse(serialized).runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri as string;
}

const renderers = {
  scan(file: string): string {
    const report: Report = {
      tool: { name: "synthetic", version: "0.0.0" }, root: "/synthetic", generatedAt: "2026-01-01T00:00:00Z",
      score: 80, grade: "B", summary: { critical: 0, high: 0, medium: 1, low: 0, info: 0, total: 1 }, facts: {},
      findings: [{ id: "synthetic.rule", title: "Synthetic finding", severity: "medium", file, line: 7,
        why: "Synthetic reason", next: "Review synthetic fixture", scanner: "synthetic" }]
    };
    return renderReport(report, "sarif");
  },
  prompt(file: string): string {
    return formatPromptLintReport({ file, score: 0, results: [{ status: "FAIL", check: "synthetic", message: "Synthetic", weight: 1 }] }, "sarif");
  },
  text(file: string): string {
    return formatTextAuditReport({ tool: "agent-reliability-kit text-audit", profile: "synthetic", sourceRepo: "synthetic",
      target: file, title: "Synthetic", score: 0, passed: 0, total: 1, redacted: "Synthetic",
      results: [{ status: "WARN", check: "synthetic", message: "Synthetic" }] }, "sarif");
  }
};

describe.each(Object.entries(renderers))("%s SARIF file locations", (_name, render) => {
  it("preserves ordinary repository-relative paths", () => {
    expect(firstUri(render(".github/workflows/ci.yml"))).toBe(".github/workflows/ci.yml");
  });
  it("roundtrips Unicode and URI delimiters as literal filename characters", () => {
    const file = "docs/资料 #50%25/review?.yml";
    const uri = firstUri(render(file));
    expect(uri).toBe("docs/%E8%B5%84%E6%96%99%20%2350%2525/review%3F.yml");
    const resolved = new URL(uri, "file:///synthetic/");
    expect(resolved.search).toBe("");
    expect(resolved.hash).toBe("");
    expect(decodeURIComponent(resolved.pathname)).toBe("/synthetic/" + file);
  });
  it("keeps a first-segment colon from becoming a URI scheme", () => {
    const resolved = new URL(firstUri(render("report:version.yml")), "file:///synthetic/");
    expect(resolved.protocol).toBe("file:");
    expect(decodeURIComponent(resolved.pathname)).toBe("/synthetic/report:version.yml");
  });
  it("roundtrips native absolute paths through file URIs", () => {
    const file = path.join(os.tmpdir(), "synthetic 资料 #50%25.yml");
    const uri = firstUri(render(file));
    expect(new URL(uri).protocol).toBe("file:");
    expect(fileURLToPath(uri)).toBe(file);
  });
});

describe("SARIF CLI locations", () => {
  it.each(["prompt-lint", "text-audit"])("serializes an actual %s input filename without changing its identity", (command) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "ark-sarif-"));
    const file = path.join(root, "synthetic 资料 #50%25.yml");
    fs.writeFileSync(file, "# Synthetic incomplete fixture\n", "utf8");
    const stdout: string[] = [];
    const stderr: string[] = [];
    const profile = command === "text-audit" ? ["--profile", "agents-md"] : [];
    const code = runCli([command, file, ...profile, "--format", "sarif", "--min-score", "0"], {
      cwd: root, stdout: (message = "") => stdout.push(message), stderr: (message = "") => stderr.push(message)
    });
    expect(stderr).toEqual([]);
    expect(code).toBe(0);
    expect(fileURLToPath(firstUri(stdout.join("\n")))).toBe(file);
  });
});
