import type { Finding, Report } from "../types.js";

export function formatAnnotations(report: Report): string {
  return report.findings
    .map((finding) => {
      const level = finding.severity === "critical" || finding.severity === "high" ? "error" : "warning";
      const properties = [
        finding.file ? `file=${escapeAnnotation(finding.file)}` : undefined,
        finding.line ? `line=${finding.line}` : undefined,
        `title=${escapeAnnotation(finding.id)}`
      ].filter(Boolean);
      const message = [
        finding.title,
        `Severity: ${finding.severity}`,
        `File: ${location(finding)}`,
        `Reason: ${finding.why}`,
        `Next action: ${finding.next}`,
        finding.evidence ? `Evidence: ${finding.evidence}` : undefined
      ].filter(Boolean).join(". ");
      return `::${level} ${properties.join(",")}::${escapeAnnotation(message)}`;
    })
    .join("\n");
}

function location(finding: Finding): string {
  if (!finding.file) return "repository";
  return finding.line ? `${finding.file}:${finding.line}` : finding.file;
}

function escapeAnnotation(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(",", "%2C").replaceAll(":", "%3A");
}
