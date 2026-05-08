import fs from "node:fs";
import path from "node:path";
import { listRepoFiles, resolveRoot } from "./files.js";
import { scoreFindings, sortFindings } from "./scoring.js";
import { scanAgentInstructions } from "../scanners/agentInstructions.js";
import { scanAiAgentRisk } from "../scanners/aiAgentRisk.js";
import { scanCommands } from "../scanners/commands.js";
import { scanGithubActions } from "../scanners/githubActions.js";
import { scanN8nWorkflows } from "../scanners/n8n.js";
import { scanReadme } from "../scanners/readme.js";
import { scanReleaseReadiness } from "../scanners/releaseReadiness.js";
import { scanRunbook } from "../scanners/runbook.js";
import { scanSecrets } from "../scanners/secrets.js";
import type { Report, ScanContext, ScannerResult } from "../types.js";

export const VERSION = "0.1.0";

const scanners = [
  scanAgentInstructions,
  scanCommands,
  scanRunbook,
  scanReadme,
  scanReleaseReadiness,
  scanSecrets,
  scanGithubActions,
  scanAiAgentRisk,
  scanN8nWorkflows
];

export function scanRepository(inputRoot: string): Report {
  const root = resolveRoot(inputRoot);
  const config = readConfig(root);
  const context: ScanContext = {
    root,
    files: listRepoFiles(root).filter((file) => !isIgnored(file.relativePath, config.ignore)),
    now: new Date().toISOString()
  };

  const results: ScannerResult[] = scanners.map((scanner) => scanner(context));
  const findings = sortFindings(results.flatMap((result) => result.findings));
  const facts = Object.assign({}, ...results.map((result) => result.facts ?? {}));
  const scored = scoreFindings(findings);

  return {
    tool: {
      name: "agent-reliability-kit",
      version: VERSION
    },
    root,
    generatedAt: context.now,
    score: scored.score,
    grade: scored.grade,
    summary: scored.summary,
    facts,
    findings
  };
}

interface ReliabilityConfig {
  ignore: string[];
}

function readConfig(root: string): ReliabilityConfig {
  const configPath = path.join(root, "agent-reliability.config.json");
  if (!fs.existsSync(configPath)) return { ignore: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as Partial<ReliabilityConfig>;
    return {
      ignore: Array.isArray(parsed.ignore) ? parsed.ignore.map(String) : []
    };
  } catch {
    return { ignore: [] };
  }
}

function isIgnored(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const normalized = pattern.replaceAll("\\", "/");
    if (normalized.endsWith("/**")) {
      return relativePath.startsWith(normalized.slice(0, -3));
    }
    if (normalized.includes("*")) {
      const escaped = normalized.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
      return new RegExp(`^${escaped}$`).test(relativePath);
    }
    return relativePath === normalized || relativePath.startsWith(`${normalized}/`);
  });
}
