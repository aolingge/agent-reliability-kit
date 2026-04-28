import fs from "node:fs";
import path from "node:path";
import { scanRepository } from "../core/scan.js";
import type { Report } from "../types.js";

export interface TeamAuditOptions {
  root: string;
  policyPath?: string;
  outDir: string;
  slackPayloadPath?: string;
}

interface TeamPolicy {
  minScore: number;
  maxCritical: number;
  maxHigh: number;
  requiredFiles: string[];
  requireMcpRegistry: boolean;
  slackChannel?: string;
}

interface HistoryItem {
  generatedAt: string;
  score: number;
  critical: number;
  high: number;
}

export interface TeamAuditReport {
  generatedAt: string;
  root: string;
  status: "pass" | "fail";
  policyPath: string;
  policy: TeamPolicy;
  current: HistoryItem;
  history: HistoryItem[];
  checks: Array<{
    name: string;
    passed: boolean;
    detail: string;
  }>;
  slackPayload: SlackPayload;
}

interface SlackPayload {
  text: string;
  channel?: string;
  blocks: Array<{
    type: "section";
    text: {
      type: "mrkdwn";
      text: string;
    };
  }>;
}

const DEFAULT_POLICY: TeamPolicy = {
  minScore: 85,
  maxCritical: 0,
  maxHigh: 0,
  requiredFiles: ["AGENTS.md", "SECURITY.md", "README.md"],
  requireMcpRegistry: false
};

export function runTeamAudit(options: TeamAuditOptions): TeamAuditReport {
  const root = path.resolve(options.root);
  const outDir = path.resolve(root, options.outDir);
  const policyPath = path.resolve(root, options.policyPath ?? ".agent-reliability/team-policy.json");
  const policy = readPolicy(policyPath);
  const report = scanRepository(root);

  fs.mkdirSync(outDir, { recursive: true });
  const historyDir = path.join(outDir, "history");
  fs.mkdirSync(historyDir, { recursive: true });
  const historyFile = path.join(historyDir, `${safeTimestamp(report.generatedAt)}.json`);
  fs.writeFileSync(historyFile, JSON.stringify(report, null, 2), "utf8");

  const current = toHistoryItem(report);
  const history = readHistory(historyDir);
  const checks = [
    {
      name: "Minimum reliability score",
      passed: report.score >= policy.minScore,
      detail: `${report.score}/100 >= ${policy.minScore}/100`
    },
    {
      name: "Critical finding budget",
      passed: report.summary.critical <= policy.maxCritical,
      detail: `${report.summary.critical} critical <= ${policy.maxCritical}`
    },
    {
      name: "High finding budget",
      passed: report.summary.high <= policy.maxHigh,
      detail: `${report.summary.high} high <= ${policy.maxHigh}`
    },
    ...policy.requiredFiles.map((relativePath) => ({
      name: `Required file ${relativePath}`,
      passed: fs.existsSync(path.join(root, relativePath)),
      detail: fs.existsSync(path.join(root, relativePath)) ? "present" : "missing"
    })),
    {
      name: "Private MCP registry",
      passed: !policy.requireMcpRegistry || fs.existsSync(path.join(root, ".agent-reliability", "mcp-registry.json")),
      detail: policy.requireMcpRegistry ? ".agent-reliability/mcp-registry.json required" : "not required by policy"
    }
  ];
  const status = checks.every((check) => check.passed) ? "pass" : "fail";
  const slackPayload = buildSlackPayload(status, policy, current, checks);
  const audit: TeamAuditReport = {
    generatedAt: new Date().toISOString(),
    root,
    status,
    policyPath: path.relative(root, policyPath).replaceAll("\\", "/"),
    policy,
    current,
    history,
    checks,
    slackPayload
  };

  fs.writeFileSync(path.join(outDir, "team-audit.json"), JSON.stringify(audit, null, 2), "utf8");
  fs.writeFileSync(path.join(outDir, "team-audit.md"), formatTeamAuditMarkdown(audit), "utf8");
  const slackPath = path.resolve(root, options.slackPayloadPath ?? path.join(options.outDir, "slack-payload.json"));
  fs.mkdirSync(path.dirname(slackPath), { recursive: true });
  fs.writeFileSync(slackPath, JSON.stringify(slackPayload, null, 2), "utf8");
  return audit;
}

export function formatTeamAuditMarkdown(report: TeamAuditReport): string {
  const lines = [
    "# Team Audit Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: **${report.status.toUpperCase()}**`,
    `Policy: \`${report.policyPath}\``,
    "",
    "## Current Scan",
    "",
    `- Score: ${report.current.score}/100`,
    `- Critical: ${report.current.critical}`,
    `- High: ${report.current.high}`,
    "",
    "## Policy Checks",
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |"
  ];
  for (const check of report.checks) {
    lines.push(`| ${check.name} | ${check.passed ? "pass" : "fail"} | ${check.detail} |`);
  }
  lines.push("", "## Scan History", "");
  if (report.history.length === 0) {
    lines.push("No scan history yet.");
  } else {
    lines.push("| Generated | Score | Critical | High |", "| --- | ---: | ---: | ---: |");
    for (const item of report.history.slice(-10)) {
      lines.push(`| ${item.generatedAt} | ${item.score} | ${item.critical} | ${item.high} |`);
    }
  }
  lines.push("", "## Slack Payload", "", "A dry-run Slack payload was written locally. No webhook is called by this command.");
  return lines.join("\n");
}

function readPolicy(policyPath: string): TeamPolicy {
  if (!fs.existsSync(policyPath)) return DEFAULT_POLICY;
  try {
    const parsed = JSON.parse(fs.readFileSync(policyPath, "utf8")) as Partial<TeamPolicy>;
    return {
      minScore: numberOr(parsed.minScore, DEFAULT_POLICY.minScore),
      maxCritical: numberOr(parsed.maxCritical, DEFAULT_POLICY.maxCritical),
      maxHigh: numberOr(parsed.maxHigh, DEFAULT_POLICY.maxHigh),
      requiredFiles: Array.isArray(parsed.requiredFiles) ? parsed.requiredFiles.map(String) : DEFAULT_POLICY.requiredFiles,
      requireMcpRegistry: typeof parsed.requireMcpRegistry === "boolean" ? parsed.requireMcpRegistry : DEFAULT_POLICY.requireMcpRegistry,
      slackChannel: typeof parsed.slackChannel === "string" ? parsed.slackChannel : undefined
    };
  } catch {
    return DEFAULT_POLICY;
  }
}

function readHistory(historyDir: string): HistoryItem[] {
  if (!fs.existsSync(historyDir)) return [];
  return fs.readdirSync(historyDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(historyDir, file))
    .map(readHistoryFile)
    .filter((item): item is HistoryItem => item !== null)
    .sort((left, right) => left.generatedAt.localeCompare(right.generatedAt));
}

function readHistoryFile(file: string): HistoryItem | null {
  try {
    return toHistoryItem(JSON.parse(fs.readFileSync(file, "utf8")) as Report);
  } catch {
    return null;
  }
}

function toHistoryItem(report: Report): HistoryItem {
  return {
    generatedAt: report.generatedAt,
    score: report.score,
    critical: report.summary.critical,
    high: report.summary.high
  };
}

function buildSlackPayload(status: "pass" | "fail", policy: TeamPolicy, current: HistoryItem, checks: TeamAuditReport["checks"]): SlackPayload {
  const failed = checks.filter((check) => !check.passed);
  return {
    text: `Agent Reliability team audit ${status.toUpperCase()}: score ${current.score}/100, ${current.critical} critical, ${current.high} high.`,
    channel: policy.slackChannel,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Agent Reliability team audit:* ${status.toUpperCase()}\nScore: ${current.score}/100\nCritical: ${current.critical}\nHigh: ${current.high}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: failed.length === 0 ? "No failed policy checks." : `Failed checks:\n${failed.map((check) => `- ${check.name}: ${check.detail}`).join("\n")}`
        }
      }
    ]
  };
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeTimestamp(value: string): string {
  return value.replace(/[:.]/g, "-");
}
