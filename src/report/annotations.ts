import type { Report } from "../types.js";

export function formatAnnotations(report: Report): string {
  return report.findings
    .map((finding) => {
      const level = finding.severity === "critical" || finding.severity === "high" ? "error" : "warning";
      const file = finding.file ? ` file=${escapeAnnotation(finding.file)},` : "";
      const line = finding.line ? `line=${finding.line},` : "";
      return `::${level}${file}${line}title=${escapeAnnotation(finding.id)}::${escapeAnnotation(`${finding.title}. ${finding.next}`)}`;
    })
    .join("\n");
}

function escapeAnnotation(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(",", "%2C").replaceAll(":", "%3A");
}

