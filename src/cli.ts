#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { buildCostReport, formatCostMarkdown, writeCostReport } from "./cost/costReport.js";
import { scanRepository, VERSION } from "./core/scan.js";
import { scoreFindings } from "./core/scoring.js";
import { initProject } from "./init/initProject.js";
import { runMcpRegistryAudit, writeMcpRegistryReport } from "./mcp/registry.js";
import { backupN8nWorkflows } from "./n8n/backup.js";
import { renderReport, writeReports } from "./report/write.js";
import { runTeamAudit } from "./team/teamAudit.js";
import type { Report, ReportFormat, ScanOptions } from "./types.js";

const VALID_FORMATS = new Set<ReportFormat>(["text", "markdown", "json", "html", "sarif", "annotations"]);
const COMMANDS = new Set(["scan", "doctor", "init", "team-audit", "mcp-registry", "n8n-scan", "n8n-backup", "cost-report", "help", "version"]);
const OPTION_NAMES = new Set([
  "--out",
  "--format",
  "--min-score",
  "--stdout",
  "--force",
  "--policy",
  "--slack-payload",
  "--registry",
  "--config",
  "--backup-dir",
  "--trace",
  "--budget-usd",
  "--help",
  "-h",
  "--version",
  "-v"
]);

interface ParsedArgs {
  command: "scan" | "doctor" | "init" | "team-audit" | "mcp-registry" | "n8n-scan" | "n8n-backup" | "cost-report" | "help" | "version";
  path: string;
  outDir: string;
  formats: ReportFormat[];
  minScore: number;
  stdout: boolean;
  force: boolean;
  policyPath?: string;
  slackPayloadPath?: string;
  registryPath?: string;
  configPath?: string;
  backupDir?: string;
  tracePath?: string;
  budgetUsd?: number;
  usedOptions: Set<string>;
}

interface CliIo {
  stdout: (message?: string) => void;
  stderr: (message?: string) => void;
  cwd: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    command: "scan",
    path: ".",
    outDir: ".agent-reliability",
    formats: ["markdown", "json", "html"],
    minScore: 80,
    stdout: false,
    force: false,
    usedOptions: new Set<string>()
  };

  if (argv[0] === "--help" || argv[0] === "-h") return { ...args, command: "help" };
  if (argv[0] === "--version" || argv[0] === "-v") return { ...args, command: "version" };
  if (argv[0] && COMMANDS.has(argv[0])) {
    args.command = argv.shift() as ParsedArgs["command"];
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--out") {
      args.usedOptions.add(item);
      args.outDir = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--format") {
      args.usedOptions.add(item);
      args.formats = parseFormats(takeOptionValue(argv, index, item));
      index += 1;
    } else if (item === "--min-score") {
      args.usedOptions.add(item);
      args.minScore = Number(takeOptionValue(argv, index, item, true));
      index += 1;
    } else if (item === "--stdout") {
      args.usedOptions.add(item);
      args.stdout = true;
    } else if (item === "--force") {
      args.usedOptions.add(item);
      args.force = true;
    } else if (item === "--policy") {
      args.usedOptions.add(item);
      args.policyPath = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--slack-payload") {
      args.usedOptions.add(item);
      args.slackPayloadPath = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--registry") {
      args.usedOptions.add(item);
      args.registryPath = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--config") {
      args.usedOptions.add(item);
      args.configPath = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--backup-dir") {
      args.usedOptions.add(item);
      args.backupDir = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--trace") {
      args.usedOptions.add(item);
      args.tracePath = takeOptionValue(argv, index, item);
      index += 1;
    } else if (item === "--budget-usd") {
      args.usedOptions.add(item);
      args.budgetUsd = Number(takeOptionValue(argv, index, item, true));
      index += 1;
    } else if (item === "--help" || item === "-h") {
      args.command = "help";
    } else if (item === "--version" || item === "-v") {
      args.command = "version";
    } else if (!item.startsWith("-")) {
      args.path = item;
    } else {
      throw new Error(`Unknown option: ${item}`);
    }
  }

  if (!Number.isFinite(args.minScore) || args.minScore < 0 || args.minScore > 100) {
    throw new Error("--min-score must be a number from 0 to 100");
  }
  if (args.budgetUsd !== undefined && (!Number.isFinite(args.budgetUsd) || args.budgetUsd < 0)) {
    throw new Error("--budget-usd must be a non-negative number");
  }

  validateCommandOptions(args);

  return args;
}

function takeOptionValue(argv: string[], index: number, option: string, allowDashValue = false): string {
  const value = argv[index + 1];
  if (value === undefined || value === "" || (!allowDashValue && value.startsWith("-")) || (allowDashValue && isOptionToken(value))) {
    throw new Error(`${option} requires a value`);
  }
  return value;
}

function isOptionToken(value: string): boolean {
  return OPTION_NAMES.has(value) || value.startsWith("--");
}

function validateCommandOptions(args: ParsedArgs): void {
  const allowed = {
    scan: new Set(["--out", "--format", "--min-score", "--stdout"]),
    doctor: new Set<string>(),
    init: new Set(["--force"]),
    "team-audit": new Set(["--policy", "--out", "--slack-payload"]),
    "mcp-registry": new Set(["--registry", "--config", "--out"]),
    "n8n-scan": new Set(["--out", "--format", "--min-score", "--stdout"]),
    "n8n-backup": new Set(["--backup-dir"]),
    "cost-report": new Set(["--trace", "--budget-usd", "--out"]),
    help: new Set<string>(),
    version: new Set<string>()
  }[args.command];

  for (const option of args.usedOptions) {
    if (!allowed.has(option)) {
      throw new Error(`${option} is not supported by ${args.command}`);
    }
  }
}

function parseFormats(input: string): ReportFormat[] {
  const formats = input.split(",").map((format) => format.trim()).filter(Boolean) as ReportFormat[];
  if (formats.length === 0) {
    throw new Error(`--format must include at least one of: ${Array.from(VALID_FORMATS).join(", ")}`);
  }
  for (const format of formats) {
    if (!VALID_FORMATS.has(format)) throw new Error(`Unknown format: ${format}`);
  }
  return formats;
}

function printHelp(write: CliIo["stdout"] = console.log): void {
  write(`agent-reliability-kit v${VERSION}

Usage:
  agent-reliability-kit scan [path] [--out DIR] [--format LIST] [--min-score N] [--stdout]
  agent-reliability-kit doctor [path]
  agent-reliability-kit init [path] [--force]
  agent-reliability-kit team-audit [path] [--policy FILE] [--out DIR] [--slack-payload FILE]
  agent-reliability-kit mcp-registry [path] [--registry FILE] [--config FILE] [--out DIR]
  agent-reliability-kit n8n-scan [path] [--out DIR] [--format LIST] [--stdout]
  agent-reliability-kit n8n-backup [path] [--backup-dir DIR]
  agent-reliability-kit cost-report [path] [--trace FILE_OR_DIR] [--budget-usd N] [--out DIR]
  agent-reliability-kit --help
  agent-reliability-kit --version

Aliases:
  ark scan .
  ark doctor .
  ark init .
  ark team-audit .
  ark mcp-registry .
  ark n8n-scan .
  ark cost-report . --budget-usd 10

Commands:
  scan      Write local reliability reports and print a concise summary
  doctor    Print the highest-priority fixes without writing report files
  init      Add safe starter community and CI files without overwriting by default
  team-audit     Write scan history, policy audit, audit report, and dry-run Slack payload
  mcp-registry   Check MCP configs against a private registry/allowlist
  n8n-scan       Run the n8n safety scanner and write n8n-only reports
  n8n-backup     Write redacted, Git-friendly backups of n8n workflow JSON
  cost-report    Summarize local AI trace token/cost events and budget alerts

Options:
  --out DIR        scan only; default .agent-reliability inside the requested repository
  --format LIST    scan only; comma-separated: text, markdown, json, html, sarif, annotations
  --min-score N    scan only; fail when score is below N, default 80, range 0-100
  --stdout         scan only; print the first requested format to stdout instead of text
  --force          init only; overwrite existing starter files
  --policy FILE    team-audit only; default .agent-reliability/team-policy.json
  --slack-payload FILE  team-audit only; write a Slack payload without sending it
  --registry FILE  mcp-registry only; default .agent-reliability/mcp-registry.json
  --config FILE    mcp-registry only; explicit MCP config file
  --backup-dir DIR n8n-backup only; default .agent-reliability/n8n-backup
  --trace FILE_OR_DIR   cost-report only; default .agent-reliability/traces
  --budget-usd N   cost-report only; warn when parsed cost exceeds this budget
  -h, --help       show help
  -v, --version    print version

Formats:
  text, markdown, json, html, sarif, annotations

Safety:
  Local-only by default. Commands write reports and dry-run payloads only; they never send Slack webhooks, publish packages, or push releases.
`);
}

function runScan(options: ScanOptions, io: CliIo): number {
  const report = scanRepository(options.root);
  const outDir = path.resolve(options.root, options.outDir);
  const written = writeReports(report, outDir, options.formats);
  const printable = options.stdout ? options.formats[0] ?? "text" : "text";
  io.stdout(renderReport(report, printable));
  if (!options.stdout && written.length > 0) {
    io.stdout("");
    io.stdout("Written reports:");
    for (const file of written) io.stdout(`- ${path.relative(io.cwd, file).replaceAll("\\", "/")}`);
  }
  return report.score >= options.minScore && report.summary.critical === 0 ? 0 : 1;
}

function runDoctor(root: string, io: CliIo): number {
  const report = scanRepository(root);
  io.stdout(renderReport({ ...report, findings: report.findings.slice(0, 8) }, "text"));
  if (report.findings.length === 0) return 0;
  io.stdout("");
  io.stdout("Doctor order:");
  for (const [index, finding] of report.findings.slice(0, 8).entries()) {
    io.stdout(`${index + 1}. ${finding.title} -> ${finding.next}`);
  }
  return report.summary.critical > 0 ? 1 : 0;
}

function runN8nScan(options: ScanOptions, io: CliIo): number {
  const report = scanRepository(options.root);
  const findings = report.findings.filter((finding) => finding.scanner === "n8n-safety");
  const scored = scoreFindings(findings);
  const n8nReport: Report = {
    ...report,
    findings,
    score: scored.score,
    grade: scored.grade,
    summary: scored.summary
  };
  const outDir = path.resolve(options.root, options.outDir);
  const written = writeReports(n8nReport, outDir, options.formats);
  const printable = options.stdout ? options.formats[0] ?? "text" : "text";
  io.stdout(renderReport(n8nReport, printable));
  if (!options.stdout && written.length > 0) {
    io.stdout("");
    io.stdout("Written n8n reports:");
    for (const file of written) io.stdout(`- ${path.relative(io.cwd, file).replaceAll("\\", "/")}`);
  }
  return n8nReport.score >= options.minScore && n8nReport.summary.critical === 0 ? 0 : 1;
}

function runInit(root: string, force: boolean, io: CliIo): number {
  const result = initProject(root, force);
  io.stdout("Created:");
  for (const file of result.created) io.stdout(`- ${file}`);
  if (result.skipped.length > 0) {
    io.stdout("Skipped existing files:");
    for (const file of result.skipped) io.stdout(`- ${file}`);
  }
  return 0;
}

export function runCli(argv: string[], io: CliIo = { stdout: console.log, stderr: console.error, cwd: process.cwd() }): number {
  try {
    const args = parseArgs([...argv]);
    const root = path.resolve(io.cwd, args.path);
    if (args.command === "help") {
      printHelp(io.stdout);
      return 0;
    }
    if (args.command === "version") {
      io.stdout(VERSION);
      return 0;
    }
    if (args.command === "scan") {
      return runScan({
        root,
        outDir: args.outDir,
        formats: args.formats,
        minScore: args.minScore,
        stdout: args.stdout
      }, io);
    }
    if (args.command === "doctor") return runDoctor(root, io);
    if (args.command === "init") return runInit(root, args.force, io);
    if (args.command === "team-audit") {
      const audit = runTeamAudit({
        root,
        policyPath: args.policyPath,
        outDir: args.outDir,
        slackPayloadPath: args.slackPayloadPath
      });
      io.stdout(`Team audit ${audit.status.toUpperCase()}: score ${audit.current.score}/100, ${audit.current.critical} critical, ${audit.current.high} high`);
      io.stdout(`Reports written under ${path.relative(io.cwd, path.resolve(root, args.outDir)).replaceAll("\\", "/")}`);
      return audit.status === "pass" ? 0 : 1;
    }
    if (args.command === "mcp-registry") {
      const report = runMcpRegistryAudit({
        root,
        registryPath: args.registryPath,
        configPath: args.configPath,
        outDir: args.outDir
      });
      const written = writeMcpRegistryReport(report, path.resolve(root, args.outDir));
      io.stdout(`MCP registry audit ${report.status.toUpperCase()}: ${report.findings.length} findings`);
      for (const file of written) io.stdout(`- ${path.relative(io.cwd, file).replaceAll("\\", "/")}`);
      return report.status === "pass" ? 0 : 1;
    }
    if (args.command === "n8n-scan") {
      return runN8nScan({
        root,
        outDir: args.outDir,
        formats: args.formats,
        minScore: args.minScore,
        stdout: args.stdout
      }, io);
    }
    if (args.command === "n8n-backup") {
      const backup = backupN8nWorkflows({
        root,
        backupDir: args.backupDir ?? ".agent-reliability/n8n-backup"
      });
      io.stdout(`Backed up ${backup.files.length} n8n workflow file(s) to ${backup.backupDir}`);
      return 0;
    }
    if (args.command === "cost-report") {
      const report = buildCostReport({
        root,
        tracePath: args.tracePath,
        budgetUsd: args.budgetUsd,
        outDir: args.outDir
      });
      const written = writeCostReport(report, path.resolve(root, args.outDir));
      io.stdout(formatCostMarkdown(report));
      io.stdout("");
      io.stdout("Written cost reports:");
      for (const file of written) io.stdout(`- ${path.relative(io.cwd, file).replaceAll("\\", "/")}`);
      return report.status === "pass" ? 0 : 1;
    }
    return 0;
  } catch (error) {
    io.stderr(`agent-reliability-kit: ${(error as Error).message}`);
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runCli(process.argv.slice(2)));
}
