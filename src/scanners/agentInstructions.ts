import { findFiles, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

const AGENT_FILE_PATTERN = /(^|\/)(AGENTS\.md|CLAUDE\.md|GEMINI\.md|CODEX\.md|\.agents\.md|copilot-instructions\.md)$/i;

export function scanAgentInstructions(context: ScanContext): ScannerResult {
  const agentFiles = findFiles(context.files, AGENT_FILE_PATTERN);
  const findings: Finding[] = [];

  if (agentFiles.length === 0) {
    findings.push({
      id: "agents.missing",
      title: "No agent instruction file",
      severity: "high",
      scanner: "agent-instructions",
      why: "AI coding agents need explicit repository rules for commands, safety, and verification.",
      next: "Add AGENTS.md with build/test commands, secret handling rules, and boundaries for risky actions."
    });
    return { findings, facts: { agentInstructionFiles: [] } };
  }

  const commandClaims: string[] = [];
  let mentionsSecrets = false;
  let mentionsVerification = false;
  let mentionsRisk = false;

  for (const file of agentFiles) {
    const text = readTextFile(file) ?? "";
    const lower = text.toLowerCase();
    if (/(secret|token|credential|cookie|password|\.env)/.test(lower)) mentionsSecrets = true;
    if (/(test|lint|typecheck|build|check|verify|verification|ci)/.test(lower)) mentionsVerification = true;
    if (/(delete|publish|release|payment|dns|destructive|approval|confirm)/.test(lower)) mentionsRisk = true;
    for (const match of text.matchAll(/`([^`]*(?:npm|pnpm|yarn|pytest|cargo|go test|gradle|mvn)[^`]*)`/gi)) {
      commandClaims.push(match[1].trim());
    }
  }

  if (!mentionsSecrets) {
    findings.push({
      id: "agents.no-secret-boundary",
      title: "Agent rules do not define secret handling",
      severity: "medium",
      scanner: "agent-instructions",
      file: agentFiles[0]?.relativePath,
      why: "Agents may inspect logs, configs, fixtures, and CI output. The repo should say where secrets must never be written.",
      next: "Document that real secrets, cookies, tokens, private URLs, and local profiles must not be committed or copied into reports."
    });
  }

  if (!mentionsVerification) {
    findings.push({
      id: "agents.no-verification",
      title: "Agent rules do not list verification commands",
      severity: "medium",
      scanner: "agent-instructions",
      file: agentFiles[0]?.relativePath,
      why: "Agents need a small, reliable command set to prove work before they stop.",
      next: "Add install, build, test, lint, typecheck, and smoke commands where they exist."
    });
  }

  if (!mentionsRisk) {
    findings.push({
      id: "agents.no-risk-boundary",
      title: "Agent rules do not mark high-risk actions",
      severity: "low",
      scanner: "agent-instructions",
      file: agentFiles[0]?.relativePath,
      why: "Publishing, deletion, DNS, payment, and account actions should require explicit maintainer intent.",
      next: "Add a short high-risk action policy."
    });
  }

  if (commandClaims.some((command) => /skip|do not|never/.test(command.toLowerCase())) && commandClaims.some((command) => /must|always|required/.test(command.toLowerCase()))) {
    findings.push({
      id: "agents.possible-command-conflict",
      title: "Agent instructions may contain conflicting command guidance",
      severity: "medium",
      scanner: "agent-instructions",
      why: "Multiple agent files can produce inconsistent behavior when they disagree about verification.",
      next: "Keep the root AGENTS.md authoritative and move tool-specific differences into clearly labeled sections."
    });
  }

  return {
    findings,
    facts: {
      agentInstructionFiles: agentFiles.map((file) => file.relativePath)
    }
  };
}
