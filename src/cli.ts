#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { scanRepository, VERSION } from "./core/scan.js";
import { initProject } from "./init/initProject.js";
import { renderReport, writeReports } from "./report/write.js";
import type { ReportFormat, ScanOptions } from "./types.js";

const VALID_FORMATS = new Set<ReportFormat>(["text", "markdown", "json", "html", "sarif", "annotations"]);

interface ParsedArgs {
  command: "scan" | "doctor" | "init" | "help" | "version";
  path: string;
  outDir: string;
  formats: ReportFormat[];
  minScore: number;
  stdout: boolean;
  force: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    command: "scan",
    path: ".",
    outDir: ".agent-reliability",
    formats: ["markdown", "json", "html"],
    minScore: 80,
    stdout: false,
    force: false
  };

  if (argv[0] === "--help" || argv[0] === "-h") return { ...args, command: "help" };
  if (argv[0] === "--version" || argv[0] === "-v") return { ...args, command: "version" };
  if (argv[0] === "scan" || argv[0] === "doctor" || argv[0] === "init") {
    args.command = argv.shift() as ParsedArgs["command"];
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === "--out") args.outDir = argv[++index] ?? args.outDir;
    else if (item === "--format") args.formats = parseFormats(argv[++index] ?? "");
    else if (item === "--min-score") args.minScore = Number(argv[++index] ?? args.minScore);
    else if (item === "--stdout") args.stdout = true;
    else if (item === "--force") args.force = true;
    else if (item === "--help" || item === "-h") args.command = "help";
    else if (item === "--version" || item === "-v") args.command = "version";
    else if (!item.startsWith("-")) args.path = item;
    else throw new Error(`Unknown option: ${item}`);
  }

  if (!Number.isFinite(args.minScore) || args.minScore < 0 || args.minScore > 100) {
    throw new Error("--min-score must be a number from 0 to 100");
  }

  return args;
}

function parseFormats(input: string): ReportFormat[] {
  const formats = input.split(",").map((format) => format.trim()).filter(Boolean) as ReportFormat[];
  for (const format of formats) {
    if (!VALID_FORMATS.has(format)) throw new Error(`Unknown format: ${format}`);
  }
  return formats.length > 0 ? formats : ["markdown", "json", "html"];
}

function printHelp(): void {
  console.log(`agent-reliability-kit v${VERSION}

Usage:
  agent-reliability-kit scan [path] [--out DIR] [--format markdown,json,html] [--min-score 80]
  agent-reliability-kit doctor [path]
  agent-reliability-kit init [path] [--force]

Aliases:
  ark scan .

Commands:
  scan      Write local reliability reports and print a concise summary
  doctor    Print the highest-priority fixes without writing report files
  init      Add safe starter community and CI files without overwriting by default

Formats:
  text, markdown, json, html, sarif, annotations
`);
}

function runScan(options: ScanOptions): number {
  const report = scanRepository(options.root);
  const outDir = path.resolve(options.root, options.outDir);
  const written = writeReports(report, outDir, options.formats);
  const printable = options.stdout ? options.formats[0] ?? "text" : "text";
  console.log(renderReport(report, printable));
  if (written.length > 0) {
    console.log("");
    console.log("Written reports:");
    for (const file of written) console.log(`- ${path.relative(process.cwd(), file).replaceAll("\\", "/")}`);
  }
  return report.score >= options.minScore && report.summary.critical === 0 ? 0 : 1;
}

function runDoctor(root: string): number {
  const report = scanRepository(root);
  console.log(renderReport({ ...report, findings: report.findings.slice(0, 8) }, "text"));
  if (report.findings.length === 0) return 0;
  console.log("");
  console.log("Doctor order:");
  for (const [index, finding] of report.findings.slice(0, 8).entries()) {
    console.log(`${index + 1}. ${finding.title} -> ${finding.next}`);
  }
  return report.summary.critical > 0 ? 1 : 0;
}

function runInit(root: string, force: boolean): number {
  const result = initProject(root, force);
  console.log("Created:");
  for (const file of result.created) console.log(`- ${file}`);
  if (result.skipped.length > 0) {
    console.log("Skipped existing files:");
    for (const file of result.skipped) console.log(`- ${file}`);
  }
  return 0;
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help") {
    printHelp();
    process.exit(0);
  }
  if (args.command === "version") {
    console.log(VERSION);
    process.exit(0);
  }
  if (args.command === "scan") {
    process.exit(runScan({
      root: args.path,
      outDir: args.outDir,
      formats: args.formats,
      minScore: args.minScore,
      stdout: args.stdout
    }));
  }
  if (args.command === "doctor") process.exit(runDoctor(args.path));
  if (args.command === "init") process.exit(runInit(args.path, args.force));
} catch (error) {
  console.error(`agent-reliability-kit: ${(error as Error).message}`);
  process.exit(2);
}

