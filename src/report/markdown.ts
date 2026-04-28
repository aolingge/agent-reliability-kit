import path from "node:path";
import type { Finding, Report } from "../types.js";

export function formatMarkdown(report: Report): string {
  const facts = report.facts;
  const commands = Array.isArray(facts.detectedCommands) ? facts.detectedCommands : [];
  const workflows = Array.isArray(facts.workflows) ? facts.workflows : [];

  const lines = [
    "# Agent Reliability Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Repository: ${inlineCode(path.basename(report.root))}`,
    "",
    `Score: **${report.score}/100**`,
    "",
    `Grade: **${report.grade}**`,
    "",
    "## Summary",
    "",
    `- Critical: ${report.summary.critical}`,
    `- High: ${report.summary.high}`,
    `- Medium: ${report.summary.medium}`,
    `- Low: ${report.summary.low}`,
    `- Info: ${report.summary.info}`,
    "",
    "## What The Scanner Saw",
    "",
    `- Agent instruction files: ${formatList(facts.agentInstructionFiles)}`,
    `- Detected commands: ${formatList(commands)}`,
    `- GitHub Actions workflows: ${formatList(workflows)}`,
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("## Findings", "", "No findings across checked surfaces. Review project-specific risks before release.");
    return lines.join("\n");
  }

  lines.push("## Findings", "");
  for (const finding of report.findings) {
    lines.push(`### ${badge(finding.severity)} ${finding.title}`);
    lines.push("");
    lines.push(`- Severity: ${inlineCode(finding.severity)}`);
    lines.push(`- Rule: ${inlineCode(finding.id)}`);
    lines.push(`- Scanner: ${inlineCode(finding.scanner)}`);
    lines.push(`- Location: ${inlineCode(location(finding))}`);
    if (finding.evidence) lines.push(`- Evidence: ${inlineCode(finding.evidence)}`);
    lines.push(`- Why it matters: ${finding.why}`);
    lines.push(`- Next action: ${finding.next}`);
    lines.push("");
  }

  return lines.join("\n");
}

function formatList(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "none";
  return value.map((item) => inlineCode(String(item))).join(", ");
}

function badge(severity: Finding["severity"]): string {
  return {
    critical: "[P0 critical]",
    high: "[P1 high]",
    medium: "[P2 medium]",
    low: "[P3 low]",
    info: "[info]"
  }[severity];
}

function location(finding: Finding): string {
  if (!finding.file) return "repository";
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}

function inlineCode(value: string): string {
  return `\`${value.replaceAll("`", "\\`")}\``;
}
