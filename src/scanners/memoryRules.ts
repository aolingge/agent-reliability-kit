import { readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const memoryRulePath = /(^|\/)(?:\.codex\/.*|.*(?:memory|rules|policy|instructions).*)\.(?:md|txt|json|ya?ml)$/i;

const requiredSignals = [
  {
    id: "trigger",
    label: "trigger",
    pattern: /trigger|when|condition|applies to|scope|条件|触发|适用|范围/i
  },
  {
    id: "behavior",
    label: "behavior",
    pattern: /behavior|must|should|do |default|require|行为|必须|应该|默认|要求/i
  },
  {
    id: "exception",
    label: "exception",
    pattern: /exception|unless|except|do not|never|blocked|例外|除非|不要|禁止|阻塞/i
  },
  {
    id: "secret-boundary",
    label: "secret boundary",
    pattern: /secret|token|cookie|credential|password|private key|browser profile|密钥|凭据|密码|私钥/i
  }
];

export function scanMemoryRules(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const checkedFiles: string[] = [];

  for (const file of context.files) {
    if (!memoryRulePath.test(file.relativePath)) continue;
    const text = readTextFile(file);
    if (!text) continue;
    checkedFiles.push(file.relativePath);

    const missing = requiredSignals.filter((signal) => !signal.pattern.test(text));
    if (missing.length < 2) continue;

    findings.push({
      id: "memory-rules.incomplete-contract",
      title: "Memory or rule file lacks a complete operating contract",
      severity: "low",
      scanner: "memory-rules",
      file: file.relativePath,
      evidence: `Missing: ${missing.map((signal) => signal.label).join(", ")}`,
      why: "Reusable agent memory is safer when it states when the rule applies, what to do, exceptions, and what sensitive material must stay out.",
      next: "Normalize this rule into trigger, behavior, exception, destination or owner, and secret-handling boundaries."
    });
  }

  return {
    findings,
    facts: {
      memoryRuleFiles: checkedFiles
    }
  };
}
