import { findFiles, lineNumber, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

export function scanGithubActions(context: ScanContext): ScannerResult {
  const workflows = findFiles(context.files, /^\.github\/workflows\/.*\.ya?ml$/i);
  const findings: Finding[] = [];

  if (workflows.length === 0) {
    findings.push({
      id: "ci.missing",
      title: "No GitHub Actions workflow",
      severity: "medium",
      scanner: "github-actions",
      why: "A public product repository should verify pull requests automatically.",
      next: "Add a workflow that runs install, lint, typecheck, tests, and build."
    });
    return { findings, facts: { workflows: [] } };
  }

  let hasValidation = false;
  let hasPermissions = false;
  for (const workflow of workflows) {
    const text = readTextFile(workflow) ?? "";
    const lower = text.toLowerCase();
    if (/(npm run check|npm test|pnpm test|pytest|cargo test|go test|mvn test|gradle test)/.test(lower)) hasValidation = true;
    if (/permissions\s*:/.test(lower)) hasPermissions = true;
    const pullRequestTargetMatch = /(?:^|\n)\s*(?:-\s*)?pull_request_target\s*:|(?:^|\n)\s*on\s*:\s*(?:\[[^\]]*\bpull_request_target\b[^\]]*\]|\{[^}]*\bpull_request_target\b[^}]*\}|\bpull_request_target\b)/i.exec(text);
    if (pullRequestTargetMatch) {
      findings.push({
        id: "ci.pull-request-target",
        title: "Workflow uses pull_request_target",
        severity: "high",
        scanner: "github-actions",
        file: workflow.relativePath,
        line: lineNumber(text, pullRequestTargetMatch.index),
        why: "pull_request_target can expose elevated permissions to untrusted contribution paths.",
        next: "Use pull_request unless this workflow is explicitly hardened and documented."
      });
    }
    const broadPermissionMatch = /permissions\s*:\s*write-all|permissions\s*:\s*\{[^}]*\b(?:actions|checks|contents|deployments|issues|packages|pages|pull-requests|security-events|statuses)\s*:\s*write\b[^}]*\}|^\s+(?:actions|checks|contents|deployments|issues|packages|pages|pull-requests|security-events|statuses)\s*:\s*write\b/im.exec(text);
    if (broadPermissionMatch) {
      findings.push({
        id: "ci.permissions-too-broad",
        title: "Workflow grants write permissions",
        severity: "medium",
        scanner: "github-actions",
        file: workflow.relativePath,
        line: lineNumber(text, broadPermissionMatch.index),
        why: "Public repository validation jobs usually need read-only token permissions.",
        next: "Use `permissions: contents: read` by default and grant write scopes only to documented release jobs."
      });
    }
    const workflowRunMatch = /workflow_run\s*:/.exec(lower);
    if (workflowRunMatch) {
      findings.push({
        id: "ci.workflow-run-trigger",
        title: "Workflow uses workflow_run",
        severity: "medium",
        scanner: "github-actions",
        file: workflow.relativePath,
        line: lineNumber(text, workflowRunMatch.index),
        why: "workflow_run can chain privileged workflows from earlier workflow output.",
        next: "Document why this trigger is needed and keep token permissions minimal."
      });
    }
    const pipeToShellMatch = /\b(?:curl|wget|iwr|invoke-webrequest)\b[^\n|;]*\|\s*(?:sh|bash|pwsh|powershell)\b/i.exec(text);
    if (pipeToShellMatch) {
      findings.push({
        id: "ci.pipe-to-shell",
        title: "Workflow pipes remote content into a shell",
        severity: "high",
        scanner: "github-actions",
        file: workflow.relativePath,
        line: lineNumber(text, pipeToShellMatch.index),
        why: "Remote script execution in CI can become a supply-chain risk.",
        next: "Pin actions and dependencies, download scripts separately, and verify checksums."
      });
    }
  }

  if (!hasValidation) {
    findings.push({
      id: "ci.no-validation-command",
      title: "CI does not run a recognizable validation command",
      severity: "medium",
      scanner: "github-actions",
      file: workflows[0]?.relativePath,
      why: "A workflow without tests, build, or typecheck gives maintainers false confidence.",
      next: "Run the repository's full verification command in CI."
    });
  }

  if (!hasPermissions) {
    findings.push({
      id: "ci.no-permissions",
      title: "CI permissions are not explicitly minimized",
      severity: "low",
      scanner: "github-actions",
      file: workflows[0]?.relativePath,
      why: "Explicit read-only permissions reduce blast radius for public pull requests.",
      next: "Add `permissions: contents: read` by default and expand only where required."
    });
  }

  return {
    findings,
    facts: {
      workflows: workflows.map((workflow) => workflow.relativePath)
    }
  };
}
