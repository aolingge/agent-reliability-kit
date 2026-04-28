import type { Report } from "../types.js";

export function formatSarif(report: Report): object {
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
            rules: report.findings.map((finding) => ({
              id: finding.id,
              name: finding.title,
              shortDescription: { text: finding.title },
              fullDescription: { text: finding.why },
              help: { text: finding.next }
            }))
          }
        },
        results: report.findings.map((finding) => ({
          ruleId: finding.id,
          level: sarifLevel(finding.severity),
          message: { text: `${finding.title}. ${finding.next}` },
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

function sarifLevel(severity: string): "error" | "warning" | "note" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium" || severity === "low") return "warning";
  return "note";
}

