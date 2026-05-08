import { findFiles, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

interface RunbookSignal {
  id: string;
  pattern: RegExp;
}

const signals: RunbookSignal[] = [
  { id: "debug", pattern: /debug|troubleshoot|logs?|incident|排障|调试|日志/i },
  { id: "verify", pattern: /verify|test|health|smoke|check|验证|测试|健康/i },
  { id: "rollback", pattern: /rollback|revert|restore|backout|回滚|恢复/i },
  { id: "report", pattern: /report|summary|evidence|handoff|汇报|总结|证据/i }
];

export function scanRunbook(context: ScanContext): ScannerResult {
  const candidateFiles = findFiles(context.files, /(^|\/)(RUNBOOK|runbook|operations|troubleshooting)\.md$|(^|\/)docs\/(runbook|operations|troubleshooting)\.md$|(^|\/)(README|AGENTS)\.md$/i);
  const signalHits = new Map<string, string[]>();
  const checkedFiles: string[] = [];

  for (const file of candidateFiles) {
    const text = readTextFile(file);
    if (!text) continue;
    checkedFiles.push(file.relativePath);
    for (const signal of signals) {
      if (signal.pattern.test(text)) {
        const files = signalHits.get(signal.id) ?? [];
        files.push(file.relativePath);
        signalHits.set(signal.id, files);
      }
    }
  }

  const missing = signals.filter((signal) => !signalHits.has(signal.id)).map((signal) => signal.id);
  const findings: Finding[] = [];

  if (missing.length > 1) {
    findings.push({
      id: "runbook.missing-operational-steps",
      title: "Runbook lacks operational recovery steps",
      severity: "medium",
      scanner: "runbook",
      file: bestRunbookTarget(checkedFiles),
      why: "AI-assisted maintenance needs clear debugging, verification, rollback, and reporting instructions before changes are trusted.",
      next: `Add a RUNBOOK.md or docs/runbook.md section covering: ${missing.join(", ")}.`
    });
  }

  return {
    findings,
    facts: {
      runbookFiles: checkedFiles,
      runbookSignals: Object.fromEntries([...signalHits.entries()].map(([signal, files]) => [signal, [...new Set(files)]]))
    }
  };
}

function bestRunbookTarget(files: string[]): string | undefined {
  return files.find((file) => /(^|\/)(RUNBOOK|runbook|operations|troubleshooting)\.md$/i.test(file))
    ?? files.find((file) => file.toLowerCase() === "agents.md")
    ?? files.find((file) => file.toLowerCase() === "readme.md")
    ?? files[0];
}
