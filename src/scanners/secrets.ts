import { lineNumber, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const SECRET_PATTERNS = [
  { name: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g },
  { name: "OpenAI key", pattern: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: "AWS access key", pattern: /AKIA[0-9A-Z]{16}/g },
  { name: "Generic assignment", pattern: /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{18,}/gi }
];

function isClearlyFake(value: string): boolean {
  return /(example|fake|dummy|placeholder|test-only|xxxx|0000|1234)/i.test(value);
}

function redact(value: string): string {
  if (value.length <= 8) return "[redacted]";
  return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
}

export function scanSecrets(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];

  for (const file of context.files) {
    const name = file.relativePath.toLowerCase();
    if (/^\.env(\.|$)/.test(name) && !name.endsWith(".example")) {
      findings.push({
        id: "secrets.tracked-env",
        title: "Tracked .env-style file",
        severity: "critical",
        scanner: "secrets",
        file: file.relativePath,
        why: "Environment files often contain real credentials and should stay local.",
        next: "Remove this file from version control, rotate any real values, and commit only .env.example."
      });
    }

    const text = readTextFile(file);
    if (!text) continue;
    for (const secret of SECRET_PATTERNS) {
      for (const match of text.matchAll(secret.pattern)) {
        const value = match[0];
        if (isClearlyFake(value)) continue;
        findings.push({
          id: "secrets.token-like-value",
          title: `Possible ${secret.name}`,
          severity: "critical",
          scanner: "secrets",
          file: file.relativePath,
          line: lineNumber(text, match.index ?? 0),
          evidence: redact(value),
          why: "Public repositories must not expose token-like values, even in docs or fixtures.",
          next: "Remove the value, rotate it if real, and replace examples with obvious placeholders."
        });
      }
    }
  }

  return {
    findings,
    facts: {
      secretPatternsChecked: SECRET_PATTERNS.map((pattern) => pattern.name)
    }
  };
}

