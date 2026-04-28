import { findFiles, lineNumber, readTextFile } from "../core/files.js";
import { findSecretLikeValues } from "../core/redaction.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

interface N8nNode {
  name?: unknown;
  type?: unknown;
  parameters?: unknown;
}

interface N8nWorkflow {
  nodes?: unknown;
}

export function scanN8nWorkflows(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const workflowFiles: string[] = [];

  for (const file of findFiles(context.files, /\.json$/i)) {
    const text = readTextFile(file);
    if (!text || !looksLikeN8nWorkflow(text, file.relativePath)) continue;
    workflowFiles.push(file.relativePath);

    for (const secret of findSecretLikeValues(text)) {
      findings.push({
        id: "n8n.secret-like-value",
        title: `n8n workflow contains possible ${secret.label}`,
        severity: "critical",
        scanner: "n8n-safety",
        file: file.relativePath,
        line: lineNumber(text, secret.index),
        evidence: "[redacted]",
        why: "n8n workflow exports are often copied into Git, support tickets, and templates, so embedded credentials can leak quickly.",
        next: "Move the value to n8n credentials or environment variables, rotate it if real, and keep only redacted workflow backups in Git."
      });
    }

    const parsed = parseJson(text);
    if (!parsed) continue;
    const nodes = getWorkflowNodes(parsed);
    for (const node of nodes) {
      const nodeName = typeof node.name === "string" ? node.name : "unnamed node";
      const nodeType = typeof node.type === "string" ? node.type : "";
      const parametersText = JSON.stringify(node.parameters ?? {});
      const nodeLine = lineNumber(text, findNodeIndex(text, nodeName, nodeType));

      if (/webhook/i.test(nodeType) && !hasWebhookAuthentication(node.parameters)) {
        findings.push({
          id: "n8n.public-webhook",
          title: "n8n webhook node has no explicit authentication",
          severity: "high",
          scanner: "n8n-safety",
          file: file.relativePath,
          line: nodeLine,
          evidence: nodeName,
          why: "Public n8n webhooks can trigger automations from the internet when authentication is missing or implicit.",
          next: "Require authentication, restrict the webhook path, and document who may call it."
        });
      }

      if (/executeCommand|ssh/i.test(nodeType)) {
        findings.push({
          id: "n8n.command-execution-node",
          title: "n8n workflow can execute commands",
          severity: "critical",
          scanner: "n8n-safety",
          file: file.relativePath,
          line: nodeLine,
          evidence: nodeName,
          why: "Command execution nodes can turn a workflow import into host-level code execution.",
          next: "Remove the node, isolate it on a locked-down worker, or require a documented human approval step."
        });
      }

      if (/code|function/i.test(nodeType) && /(eval\(|child_process|process\.env|require\(["']fs["']|fetch\()/i.test(parametersText)) {
        findings.push({
          id: "n8n.risky-code-node",
          title: "n8n code node uses risky runtime APIs",
          severity: "high",
          scanner: "n8n-safety",
          file: file.relativePath,
          line: nodeLine,
          evidence: nodeName,
          why: "Code nodes that read environment variables, evaluate strings, or call network/file APIs are hard to review in shared workflow templates.",
          next: "Move risky code into a reviewed service, add tests, and keep the workflow node as a narrow API call."
        });
      }
    }
  }

  return {
    findings,
    facts: {
      n8nWorkflowFiles: workflowFiles
    }
  };
}

export function looksLikeN8nWorkflow(text: string, relativePath = ""): boolean {
  if (/(^|\/)(n8n|workflows?)\//i.test(relativePath)) return true;
  return /"nodes"\s*:\s*\[/.test(text) && /"n8n-nodes-base\./.test(text);
}

function parseJson(text: string): unknown | null {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function getWorkflowNodes(value: unknown): N8nNode[] {
  const workflow = value as N8nWorkflow;
  if (!Array.isArray(workflow.nodes)) return [];
  return workflow.nodes.filter((node): node is N8nNode => typeof node === "object" && node !== null);
}

function hasWebhookAuthentication(parameters: unknown): boolean {
  if (!parameters || typeof parameters !== "object") return false;
  const params = parameters as Record<string, unknown>;
  const auth = params.authentication ?? params.httpMethod;
  if (typeof auth === "string" && /none|noAuth/i.test(auth)) return false;
  return typeof params.authentication === "string" && params.authentication.trim() !== "";
}

function findNodeIndex(text: string, nodeName: string, nodeType: string): number {
  const byName = text.indexOf(nodeName);
  if (byName >= 0) return byName;
  const byType = text.indexOf(nodeType);
  return byType >= 0 ? byType : 0;
}
