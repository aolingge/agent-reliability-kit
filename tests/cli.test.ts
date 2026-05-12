import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

const fixtures = path.join(import.meta.dirname, "fixtures");

function createFixtureCopy(name: string): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ark-cli-"));
  const repo = path.join(tempRoot, name);
  fs.cpSync(path.join(fixtures, name), repo, { recursive: true });
  return repo;
}

function createCapture(cwd = process.cwd()) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: (message = "") => stdout.push(message),
      stderr: (message = "") => stderr.push(message),
      cwd
    },
    stdout,
    stderr
  };
}

describe("runCli", () => {
  it("prints complete help for commands, options, defaults, aliases, and safety", () => {
    const capture = createCapture();
    const code = runCli(["--help"], capture.io);
    const output = capture.stdout.join("\n");

    expect(code).toBe(0);
    expect(output).toContain("agent-reliability-kit scan [path]");
    expect(output).toContain("agent-reliability-kit doctor [path]");
    expect(output).toContain("agent-reliability-kit init [path] [--force]");
    expect(output).toContain("agent-reliability-kit prompt-lint FILE");
    expect(output).toContain("agent-reliability-kit text-audit FILE_OR_DIR");
    expect(output).toContain("ark scan .");
    expect(output).toContain("ark prompt-lint review.prompt.yml");
    expect(output).toContain("ark text-audit AGENTS.md");
    expect(output).toContain("--out DIR");
    expect(output).toContain("default .agent-reliability");
    expect(output).toContain("--stdout");
    expect(output).toContain("--version");
    expect(output).toContain("Local-only by default");
  });

  it.each([
    [["scan", "--unknown"], "Unknown option: --unknown"],
    [["scan", "--min-score", "abc"], "--min-score must be a number from 0 to 100"],
    [["scan", "--format", "xml"], "Unknown format: xml"],
    [["scan", "--out"], "--out requires a value"]
  ])("returns exit code 2 for invalid arguments: %j", (argv, expectedMessage) => {
    const capture = createCapture();
    const code = runCli(argv, capture.io);

    expect(code).toBe(2);
    expect(capture.stderr.join("\n")).toContain(expectedMessage);
  });

  it("returns exit code 2 for missing target paths", () => {
    const capture = createCapture();
    const missingPath = path.join(os.tmpdir(), `ark-missing-${Date.now()}`);
    const code = runCli(["scan", missingPath], capture.io);

    expect(code).toBe(2);
    expect(capture.stderr.join("\n")).toContain("Path does not exist");
  });

  it("writes default scan reports inside the requested repository", () => {
    const repo = createFixtureCopy("clean-node");
    const capture = createCapture();
    const code = runCli(["scan", repo, "--min-score", "0"], capture.io);

    expect(code).toBe(0);
    expect(fs.existsSync(path.join(repo, ".agent-reliability", "report.md"))).toBe(true);
    expect(fs.existsSync(path.join(repo, ".agent-reliability", "report.json"))).toBe(true);
    expect(fs.existsSync(path.join(repo, ".agent-reliability", "report.html"))).toBe(true);
  });

  it("prints finding severity, file, reason, and next action in text output", () => {
    const repo = createFixtureCopy("missing-commands");
    const capture = createCapture();
    runCli(["scan", repo, "--format", "text", "--stdout", "--min-score", "0"], capture.io);
    const output = capture.stdout.join("\n");

    expect(output).toContain("MED");
    expect(output).toContain("File:");
    expect(output).toContain("Reason:");
    expect(output).toContain("Next:");
  });

  it.each(["json", "sarif"])("keeps %s stdout machine-readable", (format) => {
    const repo = createFixtureCopy("clean-node");
    const capture = createCapture();
    const code = runCli(["scan", repo, "--format", format, "--stdout", "--min-score", "0"], capture.io);
    const output = capture.stdout.join("\n");

    expect(code).toBe(0);
    expect(() => JSON.parse(output)).not.toThrow();
    expect(output).not.toContain("Written reports:");
  });

  it("writes team audit history and a dry-run Slack payload", () => {
    const repo = createFixtureCopy("clean-node");
    fs.mkdirSync(path.join(repo, ".agent-reliability"), { recursive: true });
    fs.writeFileSync(path.join(repo, ".agent-reliability", "team-policy.json"), JSON.stringify({
      minScore: 80,
      maxCritical: 0,
      maxHigh: 0,
      requiredFiles: ["README.md", "AGENTS.md"],
      requireMcpRegistry: false,
      slackChannel: "#agent-reliability"
    }, null, 2), "utf8");
    const capture = createCapture();
    const code = runCli(["team-audit", repo, "--out", ".agent-reliability/team"], capture.io);

    expect(code).toBe(0);
    expect(fs.existsSync(path.join(repo, ".agent-reliability", "team", "team-audit.json"))).toBe(true);
    expect(fs.existsSync(path.join(repo, ".agent-reliability", "team", "slack-payload.json"))).toBe(true);
    expect(fs.readdirSync(path.join(repo, ".agent-reliability", "team", "history")).some((file) => file.endsWith(".json"))).toBe(true);
  });

  it("checks MCP configs against a private registry", () => {
    const repo = createFixtureCopy("mcp-registry");
    const capture = createCapture();
    const code = runCli(["mcp-registry", repo, "--out", ".agent-reliability/mcp-audit"], capture.io);
    const report = JSON.parse(fs.readFileSync(path.join(repo, ".agent-reliability", "mcp-audit", "mcp-registry-report.json"), "utf8")) as {
      status: string;
      findings: Array<{ id: string }>;
    };

    expect(code).toBe(1);
    expect(report.status).toBe("fail");
    expect(report.findings.map((finding) => finding.id)).toContain("mcp.server.disabled");
    expect(report.findings.map((finding) => finding.id)).toContain("mcp.server.not-allowlisted");
    expect(report.findings.map((finding) => finding.id)).toContain("mcp.url.not-approved");
  });

  it("writes n8n-only reports and redacted workflow backups", () => {
    const repo = createFixtureCopy("n8n-risk");
    const scanCapture = createCapture();
    const scanCode = runCli(["n8n-scan", repo, "--out", ".agent-reliability/n8n", "--format", "json", "--stdout", "--min-score", "0"], scanCapture.io);
    const scanReport = JSON.parse(scanCapture.stdout.join("\n")) as { findings: Array<{ scanner: string; id: string }> };

    expect(scanCode).toBe(1);
    expect(scanReport.findings.every((finding) => finding.scanner === "n8n-safety")).toBe(true);
    expect(scanReport.findings.map((finding) => finding.id)).toContain("n8n.command-execution-node");

    const backupCapture = createCapture();
    const backupCode = runCli(["n8n-backup", repo, "--backup-dir", ".agent-reliability/n8n-backup"], backupCapture.io);
    const backupFile = path.join(repo, ".agent-reliability", "n8n-backup", "workflows__risky.json");

    expect(backupCode).toBe(0);
    expect(fs.existsSync(backupFile)).toBe(true);
    expect(fs.readFileSync(backupFile, "utf8")).toContain("[redacted]");
  });

  it("summarizes AI trace costs and fails over budget", () => {
    const repo = createFixtureCopy("cost-trace");
    const capture = createCapture();
    const code = runCli(["cost-report", repo, "--budget-usd", "0.50", "--out", ".agent-reliability/cost"], capture.io);
    const report = JSON.parse(fs.readFileSync(path.join(repo, ".agent-reliability", "cost", "cost-report.json"), "utf8")) as {
      status: string;
      total: { costUsd: number; totalTokens: number };
      byModel: Array<{ provider: string }>;
    };

    expect(code).toBe(1);
    expect(report.status).toBe("warn");
    expect(report.total.costUsd).toBe(1);
    expect(report.total.totalTokens).toBe(4500);
    expect(report.byModel.map((bucket) => bucket.provider)).toContain("openai");
  });

  it("scores prompt YAML files through the consolidated prompt-lint command", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-prompt-lint-"));
    const promptFile = path.join(temp, "review.prompt.yml");
    fs.writeFileSync(promptFile, [
      "name: pr-review",
      "description: Review a pull request for bugs and missing tests.",
      "model: gpt-5.2",
      "inputs:",
      "  diff:",
      "    description: Pull request diff",
      "prompt: |",
      "  Review the diff and report actionable issues.",
      "tests:",
      "  - name: flags missing test",
      "    expected: Mentions missing coverage."
    ].join("\n"), "utf8");

    const capture = createCapture();
    const code = runCli(["prompt-lint", promptFile, "--format", "json", "--min-score", "80"], capture.io);
    const report = JSON.parse(capture.stdout.join("\n")) as { score: number; results: Array<{ check: string; status: string }> };

    expect(code).toBe(0);
    expect(report.score).toBe(100);
    expect(report.results.find((result) => result.check === "prompt-body")?.status).toBe("PASS");
  });

  it("runs consolidated text-audit profiles from retired small CLI tools", () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ark-text-audit-"));
    const agentsFile = path.join(temp, "AGENTS.md");
    fs.writeFileSync(agentsFile, [
      "# AGENTS.md",
      "Purpose: AI coding agent instructions for Codex and Claude.",
      "Read order: AGENTS.md, README, package.json.",
      "Run `npm test` and `npm run build` before finishing.",
      "Do not edit secrets, cookies, tokens, or private logs.",
      "Check git status before committing.",
      "Project layout: src, tests, docs.",
      "Report verified evidence."
    ].join("\n"), "utf8");

    const capture = createCapture();
    const code = runCli(["text-audit", agentsFile, "--profile", "agents-md", "--format", "json", "--min-score", "80"], capture.io);
    const report = JSON.parse(capture.stdout.join("\n")) as { score: number; sourceRepo: string; results: Array<{ check: string; status: string }> };

    expect(code).toBe(0);
    expect(report.sourceRepo).toBe("agents-md-doctor");
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.results.find((result) => result.check === "purpose")?.status).toBe("PASS");
  });
});
