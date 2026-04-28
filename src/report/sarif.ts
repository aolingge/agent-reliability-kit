import type { Report } from "../types.js";

export function formatSarif(report: Report): object {
  const rules = Array.from(new Map(report.findings.map((finding) => [
    finding.id,
    {
      id: finding.id,
      name: finding.title,
      shortDescription: { text: finding.title },
      fullDescription: { text: finding.why },
      help: { text: finding.next },
      properties: {
        scanner: finding.scanner,
        severity: finding.severity
      }
    }
  ])).values());

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: report.tool.name,
            version: report.tool.version,
            informationUri: "https://github.com/aolingge/agent-reliability-kit",
            rules
          }
        },
        results: report.findings.map((finding) => ({
          ruleId: finding.id,
          level: sarifLevel(finding.severity),
          message: { text: messageText(finding) },
          locations: finding.file
            ? [
                {
                  physicalLocation: {
                    artifactLocation: { uri: finding.file },
                    region: { startLine: finding.line ?? 1 }
                  }
                }
              ]
            : []
        }))
      }
    ]
  };
}

function messageText(finding: Report["findings"][number]): string {
  const location = finding.file ? `${finding.file}${finding.line ? `:${finding.line}` : ""}` : "repository";
  return [
    finding.title,
    `Severity: ${finding.severity}`,
    `File: ${location}`,
    `Reason: ${finding.why}`,
    `Next action: ${finding.next}`,
    finding.evidence ? `Evidence: ${finding.evidence}` : undefined
  ].filter(Boolean).join(". ");
}

function sarifLevel(severity: string): "error" | "warning" | "note" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium" || severity === "low") return "warning";
  return "note";
}
