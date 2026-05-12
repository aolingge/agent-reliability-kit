import { lineNumber, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const candidatePath = /\.(md|mdx|txt|json|ya?ml|sh|ps1|bat|cmd)$/i;

const riskyCommands: Array<{ id: string; title: string; pattern: RegExp }> = [
  { id: "rm-rf", title: "Recursive delete command needs an explicit safety guard", pattern: /\brm\s+-[a-z]*r[a-z]*f\b/i },
  { id: "git-reset-hard", title: "Hard reset command needs an explicit safety guard", pattern: /\bgit\s+reset\s+--hard\b/i },
  { id: "git-clean-force", title: "Force clean command needs an explicit safety guard", pattern: /\bgit\s+clean\s+-[a-z]*f/i },
  { id: "powershell-recursive-delete", title: "Recursive PowerShell delete needs an explicit safety guard", pattern: /\bRemove-Item\b[^\n\r]*(?:-Recurse|-Force)/i },
  { id: "database-drop", title: "Database drop command needs an explicit safety guard", pattern: /\bdrop\s+(?:database|table|schema)\b/i },
  { id: "publish-or-release", title: "Publishing command needs an explicit safety guard", pattern: /\b(?:npm\s+publish|gh\s+release\s+create|twine\s+upload)\b/i }
];

const guardPattern = /dry[- ]?run|--dry-run|-WhatIf|confirm|confirmation|approval|ask before|manual review|explicit authorization|protected branch|read every script|do not run|review before|确认|授权|批准|人工|先检查/i;

export function scanShellSafety(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const riskyFiles: string[] = [];

  for (const file of context.files) {
    if (!candidatePath.test(file.relativePath)) continue;
    const text = readTextFile(file);
    if (!text) continue;

    const hasGuard = guardPattern.test(text);
    for (const command of riskyCommands) {
      const match = command.pattern.exec(text);
      if (!match) continue;
      riskyFiles.push(file.relativePath);
      if (hasGuard) continue;

      findings.push({
        id: `shell-safety.${command.id}.unguarded`,
        title: command.title,
        severity: "medium",
        scanner: "shell-safety",
        file: file.relativePath,
        line: lineNumber(text, match.index),
        evidence: match[0],
        why: "Destructive or publishing commands are high-risk when coding agents or contributors can replay them without a confirmation path.",
        next: "Add a dry-run, explicit confirmation, manual approval, or rollback note next to this command."
      });
    }
  }

  return {
    findings: findings.slice(0, 20),
    facts: {
      shellSafetyRiskFiles: [...new Set(riskyFiles)]
    }
  };
}
