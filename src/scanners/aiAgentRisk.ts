import { findFiles, readTextFile } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

export function scanAiAgentRisk(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const mcpFiles = findFiles(context.files, /(^|\/)(mcp|\.mcp|mcp-config|mcp\.json|mcp\.yaml|mcp\.yml|mcpServers\.json)$/i);
  const promptFiles = findFiles(context.files, /(^|\/)(prompts?|system-prompts?|instructions?)\/|prompt.*\.(md|txt|json)$/i);

  for (const file of mcpFiles) {
    const text = readTextFile(file) ?? "";
    if (/(cmd|command|args|stdio|shell|powershell|bash|node|python)/i.test(text) && !/(permission|allow|deny|risk|review|sandbox)/i.test(text)) {
      findings.push({
        id: "agent.mcp-undocumented-command",
        title: "MCP command configuration lacks nearby permission notes",
        severity: "medium",
        scanner: "ai-agent-risk",
        file: file.relativePath,
        why: "MCP tools can give agents filesystem, shell, browser, or network access.",
        next: "Document each tool's purpose, permissions, required env vars, and safe review path."
      });
    }
  }

  for (const file of promptFiles) {
    const text = readTextFile(file) ?? "";
    if (/ignore (all )?(previous|above|system) instructions|developer mode|jailbreak/i.test(text)) {
      findings.push({
        id: "agent.prompt-injection-phrase",
        title: "Prompt-like file contains instruction override language",
        severity: "high",
        scanner: "ai-agent-risk",
        file: file.relativePath,
        why: "Instruction override phrases should be fenced as test data, not mixed into live prompts.",
        next: "Move adversarial samples into clearly labeled fixtures and add untrusted-input boundaries."
      });
    }
  }

  return {
    findings,
    facts: {
      mcpFiles: mcpFiles.map((file) => file.relativePath),
      promptFiles: promptFiles.map((file) => file.relativePath)
    }
  };
}

