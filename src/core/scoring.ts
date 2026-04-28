import type { Finding, Report } from "../types.js";

const WEIGHTS = {
  critical: 25,
  high: 14,
  medium: 8,
  low: 4,
  info: 0
} as const;

export function scoreFindings(findings: Finding[]): Pick<Report, "score" | "grade" | "summary"> {
  const summary = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
    total: findings.length
  };

  let penalty = 0;
  for (const finding of findings) {
    summary[finding.severity] += 1;
    penalty += WEIGHTS[finding.severity];
  }

  const score = Math.max(0, 100 - penalty);
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";
  return { score, grade, summary };
}

export function sortFindings(findings: Finding[]): Finding[] {
  const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  return [...findings].sort((a, b) => {
    const severityDelta = order[a.severity] - order[b.severity];
    if (severityDelta !== 0) return severityDelta;
    return `${a.file ?? ""}:${a.line ?? 0}:${a.id}`.localeCompare(`${b.file ?? ""}:${b.line ?? 0}:${b.id}`);
  });
}

