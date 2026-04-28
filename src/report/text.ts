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

  for (const finding of report.findings) {
    lines.push(`${ICONS[finding.severity]} ${finding.id}`);
    lines.push(`  ${finding.title}`);
    lines.push(`  Severity: ${finding.severity}`);
    lines.push(`  File: ${location(finding)}`);
    lines.push(`  Reason: ${finding.why}`);
    lines.push(`  Next: ${finding.next}`);
    if (finding.evidence) lines.push(`  Evidence: ${finding.evidence}`);
  }

  return lines.join("\n");
}

function location(finding: Finding): string {
  if (!finding.file) return "repository";
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}
