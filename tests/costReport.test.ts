import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildCostReport } from "../src/cost/costReport.js";
import { runCli } from "../src/cli.js";

function fixture(name: string, content: string): { root: string; tracePath: string } {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ark-cost-parsing-"));
  fs.writeFileSync(path.join(root, name), content, "utf8");
  return { root, tracePath: name };
}

describe("cost trace parsing", () => {
  it("summarizes a large valid event array without argument-list limits", () => {
    const input = fixture("trace.json", JSON.stringify({ events: Array.from({ length: 150_000 }, () => ({ inputTokens: 1 })) }));
    const report = buildCostReport({ ...input, outDir: ".reports" });
    expect(report.total.calls).toBe(150_000);
    expect(report.total.inputTokens).toBe(150_000);
    expect(report.status).toBe("pass");
  });

  it("counts nested snake_case usage and preserves the explicit total", () => {
    const input = fixture("trace.json", JSON.stringify({
      provider: "synthetic-provider", model: "synthetic-model",
      usage: { input_tokens: 100, output_tokens: 20, total_tokens: 150 }, costUsd: 0.25
    }));
    const report = buildCostReport({ ...input, outDir: ".reports" });
    expect(report.total).toMatchObject({ calls: 1, inputTokens: 100, outputTokens: 20, totalTokens: 150, costUsd: 0.25 });
    expect(report.status).toBe("pass");
  });

  it("reads multiple records from an uppercase JSONL extension", () => {
    const input = fixture("trace.JSONL", '{"inputTokens":10,"costUsd":0.1}\n{"inputTokens":20,"costUsd":0.2}\n');
    const report = buildCostReport({ ...input, outDir: ".reports" });
    expect(report.total.calls).toBe(2);
    expect(report.total.inputTokens).toBe(30);
    expect(report.total.costUsd).toBeCloseTo(0.3);
    expect(report.status).toBe("pass");
  });

  it("accepts a UTF-8 BOM in a JSON export", () => {
    const input = fixture("trace.json", '\uFEFF{"inputTokens":12,"costUsd":0.2}');
    const report = buildCostReport({ ...input, outDir: ".reports" });
    expect(report.total.inputTokens).toBe(12);
    expect(report.status).toBe("pass");
  });

  it("warns on partial parsing without exposing the malformed record", () => {
    const input = fixture("trace.jsonl", '{"inputTokens":10,"costUsd":0.1}\nsynthetic-private-invalid-record\n');
    const report = buildCostReport({ ...input, outDir: ".reports", budgetUsd: 1 });
    expect(report.total.calls).toBe(1);
    expect(report.status).toBe("warn");
    expect(report.alerts.join(" ")).toContain("incomplete");
    expect(JSON.stringify(report)).not.toContain("synthetic-private-invalid-record");
    const stdout: string[] = [];
    const stderr: string[] = [];
    const code = runCli(["cost-report", input.root, "--trace", input.tracePath, "--budget-usd", "1", "--out", ".reports"], {
      cwd: input.root, stdout: (value = "") => stdout.push(value), stderr: (value = "") => stderr.push(value)
    });
    expect(code).toBe(1);
    expect(stdout.join(" ")).toContain("incomplete");
    expect(stderr).toEqual([]);
  });
});
