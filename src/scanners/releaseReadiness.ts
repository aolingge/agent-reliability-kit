import { hasFile, readRootText } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const REQUIRED_PACKAGE_FIELDS = ["name", "version", "description", "license"] as const;
const EXPECTED_REPORT_OUTPUTS = ["report.md", "report.json", "report.html"] as const;

export function scanReleaseReadiness(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const packageJsonText = readRootText(context.root, "package.json");
  const readme = readRootText(context.root, "README.md");
  let packageName: unknown;
  let packageVersion: unknown;

  if (!packageJsonText) {
    findings.push({
      id: "release.package-json.missing",
      title: "Package metadata is missing",
      severity: "medium",
      scanner: "release-readiness",
      why: "A publishable Node CLI needs package metadata so users and automation can identify it.",
      next: "Add package.json with name, version, description, license, and repository metadata."
    });
  } else {
    try {
      const parsed = JSON.parse(packageJsonText) as Record<string, unknown>;
      packageName = parsed.name;
      packageVersion = parsed.version;
      const missing: string[] = REQUIRED_PACKAGE_FIELDS.filter((field) => !hasNonEmptyString(parsed[field]));
      if (missing.length > 0) {
        findings.push({
          id: "release.package-metadata-incomplete",
          title: "Package metadata is incomplete",
          severity: "low",
          scanner: "release-readiness",
          file: "package.json",
          evidence: `Missing: ${missing.join(", ")}`,
          why: "Package metadata is the trust surface shown by npm, GitHub, and downstream automation.",
          next: "Fill in the missing package metadata before preparing a release."
        });
      }
    } catch {
      findings.push({
        id: "release.package-json.invalid",
        title: "Package metadata is not valid JSON",
        severity: "high",
        scanner: "release-readiness",
        file: "package.json",
        why: "Invalid package metadata blocks install, pack, and publish dry-run checks.",
        next: "Fix package.json syntax before preparing release artifacts."
      });
    }
  }

  if (readme && hasFile(context.files, "package.json")) {
    const lower = readme.toLowerCase();
    const missingOutputs = EXPECTED_REPORT_OUTPUTS.filter((output) => !lower.includes(output));
    if (missingOutputs.length > 0) {
      findings.push({
        id: "release.readme-output-contract",
        title: "README does not document expected report outputs",
        severity: "low",
        scanner: "release-readiness",
        file: "README.md",
        evidence: `Missing: ${missingOutputs.join(", ")}`,
        why: "Users need to know which local files the scan writes before they add the CLI to CI or release checks.",
        next: "Document the Markdown, JSON, and HTML report paths produced by the quick start."
      });
    }
  }

  return {
    findings,
    facts: {
      packageName,
      packageVersion,
      documentedReportOutputs: readme
        ? EXPECTED_REPORT_OUTPUTS.filter((output) => readme.toLowerCase().includes(output))
        : []
    }
  };
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
