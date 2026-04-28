#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { scanRepository, VERSION } from "./core/scan.js";
import { initProject } from "./init/initProject.js";
import { renderReport, writeReports } from "./report/write.js";
import type { ReportFormat, ScanOptions } from "./types.js";

const VALID_FORMATS = new Set<ReportFormat>(["text", "markdown", "json", "html", "sarif", "annotations"]);
const COMMANDS = new Set(["scan", "doctor", "init", "help", "version"]);
const OPTION_NAMES = new Set(["--out", "--format", "--min-score", "--stdout", "--force", "--help", "-h", "--version", "-v"]);

interface ParsedArgs {
  command: "scan" | "doctor" | "init" | "help" | "version";
  path: string;
  outDir: string;
  formats: ReportFormat[];
  minScore: number;
  stdout: boolean;
  force: boolean;
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
  agent-reliability-kit --help
  agent-reliability-kit --version

Aliases:
  ark scan .
  ark doctor .
  ark init .

Commands:
  scan      Write local reliability reports and print a concise summary
  doctor    Print the highest-priority fixes without writing report files
  init      Add safe starter community and CI files without overwriting by default

Options:
  --out DIR        scan only; default .agent-reliability inside the requested repository
  --format LIST    scan only; comma-separated: text, markdown, json, html, sarif, annotations
  --min-score N    scan only; fail when score is below N, default 80, range 0-100
  --stdout         scan only; print the first requested format to stdout instead of text
  --force          init only; overwrite existing starter files
  -h, --help       show help
  -v, --version    print version

Formats:
  text, markdown, json, html, sarif, annotations

Safety:
  Local-only by default. scan writes under the requested repository unless --out explicitly points elsewhere.
`);
}

function runScan(options: ScanOptions, io: CliIo): number {
  const report = scanRepository(options.root);
  const outDir = path.resolve(options.root, options.outDir);
  const written = writeReports(report, outDir, options.formats);
  const printable = options.stdout ? options.formats[0] ?? "text" : "text";
  io.stdout(renderReport(report, printable));
  if (written.length > 0) {
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
    return 0;
  } catch (error) {
    io.stderr(`agent-reliability-kit: ${(error as Error).message}`);
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runCli(process.argv.slice(2)));
}
