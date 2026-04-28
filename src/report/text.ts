import type { Finding, Report } from "../types.js";

const ICONS = {
  critical: "CRIT",
  high: "HIGH",
  medium: "MED",
  low: "LOW",
  info: "INFO"
} as const;

export function formatText(report: Report): string {
  const lines = [
    `Agent Reliability Kit ${report.tool.version}`,
    `Score ${report.score}/100 grade ${report.grade} | findings ${report.summary.total}`,
    ""
  ];

  if (report.findings.length === 0) {
    lines.push("No findings. This repository is agent-ready.");
    return lines.join("\n");
  }

  for (const finding of report.findings.slice(0, 20)) {
    lines.push(`${ICONS[finding.severity]} ${finding.id}`);
    lines.push(`  ${finding.title}`);
    lines.push(`  File: ${location(finding)}`);
    lines.push(`  Reason: ${finding.why}`);
    lines.push(`  Next: ${finding.next}`);
  }

  if (report.findings.length > 20) {
    lines.push(`... ${report.findings.length - 20} more findings omitted from text output.`);
  }

  return lines.join("\n");
}

function location(finding: Finding): string {
  if (!finding.file) return "repository";
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}
