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
    expect(output).toContain("ark scan .");
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
});
