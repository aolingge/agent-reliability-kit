import { findFiles, hasFile, readRootText, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const REQUIRED_PACKAGE_FIELDS = ["name", "version", "description", "license"] as const;
const EXPECTED_REPORT_OUTPUTS = ["report.md", "report.json", "report.html"] as const;
const RELEASE_NOTE_SIGNALS = [
  { id: "changes", label: "changes", pattern: /changed|added|fixed|removed|security|breaking|改动|新增|修复|移除/i },
  { id: "verification", label: "verification", pattern: /test|build|lint|typecheck|verified|verification|验证|测试|检查|构建/i },
  { id: "version", label: "version", pattern: /\bv?\d+\.\d+\.\d+\b|version|release|版本/i },
  { id: "targets", label: "publication targets", pattern: /github|gitee|npm|pypi|release|tag|pages|docker|镜像|发布|标签/i }
] as const;

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

  const releaseNoteFiles = findFiles(context.files, /(^|\/)(?:CHANGELOG|RELEASE|RELEASE_NOTES|release-notes)\.md$|(^|\/)docs\/.*release.*\.md$/i);
  for (const file of releaseNoteFiles) {
    const text = readTextFile(file);
    if (!text) continue;
    const missing = RELEASE_NOTE_SIGNALS.filter((signal) => !signal.pattern.test(text));
    if (missing.length < 2) continue;
    findings.push({
      id: "release.note-missing-proof",
      title: "Release note lacks proof signals",
      severity: "low",
      scanner: "release-readiness",
      file: file.relativePath,
      evidence: `Missing: ${missing.map((signal) => signal.label).join(", ")}`,
      why: "Release notes should prove what changed, how it was verified, and where the result was published.",
      next: "Add changes, verification commands or results, a version or release identifier, and target surfaces such as GitHub, npm, or release tags."
    });
  }

  return {
    findings,
    facts: {
      packageName,
      packageVersion,
      documentedReportOutputs: readme
        ? EXPECTED_REPORT_OUTPUTS.filter((output) => readme.toLowerCase().includes(output))
        : [],
      releaseNoteFiles: releaseNoteFiles.map((file) => file.relativePath)
    }
  };
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
