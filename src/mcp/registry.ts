import fs from "node:fs";
import path from "node:path";
import { resolveRoot } from "../core/files.js";
import { findSecretLikeValues } from "../core/redaction.js";
import type { Finding } from "../types.js";

export interface McpRegistryOptions {
  root: string;
  registryPath?: string;
  configPath?: string;
  outDir: string;
}

export interface McpRegistryReport {
  generatedAt: string;
  root: string;
  registryPath: string;
  configPaths: string[];
  approvedServers: string[];
  checkedServers: string[];
  findings: Finding[];
  status: "pass" | "fail";
}

interface RegistryServer {
  name: string;
  approved?: boolean;
  trustScore?: number;
  permissions?: string[];
  allowedCommands?: string[];
  allowedUrls?: string[];
  riskOwner?: string;
  riskReason?: string;
}

interface RegistryFile {
  servers?: unknown;
}

interface McpServerConfig {
  name: string;
  command?: string;
  url?: string;
  env?: unknown;
}

const DEFAULT_CONFIG_PATHS = [
  ".mcp.json",
  "mcp.json",
  ".cursor/mcp.json",
  ".vscode/mcp.json",
  ".claude/mcp.json",
  "claude_desktop_config.json"
];

export function runMcpRegistryAudit(options: McpRegistryOptions): McpRegistryReport {
  const root = resolveRoot(options.root);
  const registryPath = resolveInputPath(root, options.registryPath ?? ".agent-reliability/mcp-registry.json");
  const registry = readRegistry(registryPath);
  const configPaths = resolveConfigPaths(root, options.configPath);
  const findings: Finding[] = [];
  const checkedServers: string[] = [];

  if (!fs.existsSync(registryPath)) {
    findings.push({
      id: "mcp.registry.missing",
      title: "Private MCP registry is missing",
      severity: "high",
      scanner: "mcp-registry",
      file: path.relative(root, registryPath).replaceAll("\\", "/"),
      why: "Teams need an explicit allowlist before agents can safely use file, shell, browser, network, or SaaS tools.",
      next: "Create .agent-reliability/mcp-registry.json with approved servers, permissions, trust score, and risk owner."
    });
  }

  if (configPaths.length === 0) {
    findings.push({
      id: "mcp.registry.no-config",
      title: "No MCP config found to check",
      severity: "info",
      scanner: "mcp-registry",
      why: "The registry can only protect MCP configs that are committed or passed explicitly.",
      next: "Pass --config path/to/mcp.json or commit a redacted repo-local MCP config template."
    });
  }

  const registryByName = new Map(registry.map((server) => [server.name, server]));
  for (const configFile of configPaths) {
    const text = fs.readFileSync(configFile, "utf8");
    for (const secret of findSecretLikeValues(text)) {
      findings.push({
        id: "mcp.config.secret-like-value",
        title: `MCP config contains possible ${secret.label}`,
        severity: "critical",
        scanner: "mcp-registry",
        file: path.relative(root, configFile).replaceAll("\\", "/"),
        evidence: "[redacted]",
        why: "MCP configs are frequently pasted into issue reports and agent setup docs.",
        next: "Move credentials to environment variables or a secret manager, rotate real values, and keep only placeholders in config examples."
      });
    }

    for (const server of readMcpServers(text)) {
      checkedServers.push(server.name);
      const registryEntry = registryByName.get(server.name);
      const relativeConfig = path.relative(root, configFile).replaceAll("\\", "/");
      if (!registryEntry) {
        findings.push({
          id: "mcp.server.not-allowlisted",
          title: "MCP server is not in the private allowlist",
          severity: "high",
          scanner: "mcp-registry",
          file: relativeConfig,
          evidence: server.name,
          why: "Unreviewed MCP servers can expose files, commands, browser state, network calls, or SaaS data to agents.",
          next: "Add the server to the private registry with an owner, trust score, allowed command or URL, and permission scope before use."
        });
        continue;
      }

      if (registryEntry.approved === false) {
        findings.push({
          id: "mcp.server.disabled",
          title: "MCP server is present but not approved",
          severity: "high",
          scanner: "mcp-registry",
          file: relativeConfig,
          evidence: server.name,
          why: "A disabled registry entry means the team has explicitly not approved the server for agent use.",
          next: "Remove the server from config or update the registry after a documented review."
        });
      }

      if ((registryEntry.trustScore ?? 100) < 70) {
        findings.push({
          id: "mcp.server.low-trust",
          title: "MCP server trust score is below policy target",
          severity: "medium",
          scanner: "mcp-registry",
          file: relativeConfig,
          evidence: `${server.name}: ${registryEntry.trustScore}`,
          why: "Low-trust tools should not be available to coding agents without supervision.",
          next: "Raise the trust score with a review, limit permissions, or require human approval."
        });
      }

      if (server.command && registryEntry.allowedCommands && !registryEntry.allowedCommands.includes(server.command)) {
        findings.push({
          id: "mcp.command.not-approved",
          title: "MCP command does not match the registry allowlist",
          severity: "high",
          scanner: "mcp-registry",
          file: relativeConfig,
          evidence: `${server.name}: ${server.command}`,
          why: "A changed command can swap an approved MCP server for arbitrary local execution.",
          next: "Update the config to the approved command or review and add the new command to the registry."
        });
      }

      if (server.url && registryEntry.allowedUrls && !registryEntry.allowedUrls.some((allowed) => server.url?.startsWith(allowed))) {
        findings.push({
          id: "mcp.url.not-approved",
          title: "MCP URL does not match the registry allowlist",
          severity: "high",
          scanner: "mcp-registry",
          file: relativeConfig,
          evidence: `${server.name}: ${server.url}`,
          why: "Remote MCP URLs can redirect agent data to an unreviewed service.",
          next: "Use an approved URL prefix or add a reviewed remote endpoint to the registry."
        });
      }

      const riskyPermissions = (registryEntry.permissions ?? []).filter((permission) => /file|shell|browser|network|secret|credential/i.test(permission));
      if (riskyPermissions.length > 0 && (!registryEntry.riskOwner || !registryEntry.riskReason)) {
        findings.push({
          id: "mcp.permission.owner-missing",
          title: "Risky MCP permissions need an owner and reason",
          severity: "medium",
          scanner: "mcp-registry",
          file: path.relative(root, registryPath).replaceAll("\\", "/"),
          evidence: `${server.name}: ${riskyPermissions.join(", ")}`,
          why: "High-power MCP tools need a named owner so teams know who accepts the risk.",
          next: "Add riskOwner and riskReason to the registry entry."
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    root,
    registryPath: path.relative(root, registryPath).replaceAll("\\", "/"),
    configPaths: configPaths.map((config) => path.relative(root, config).replaceAll("\\", "/")),
    approvedServers: registry.filter((server) => server.approved !== false).map((server) => server.name),
    checkedServers: [...new Set(checkedServers)],
    findings,
    status: findings.some((finding) => finding.severity === "critical" || finding.severity === "high") ? "fail" : "pass"
  };
}

export function writeMcpRegistryReport(report: McpRegistryReport, outDir: string): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "mcp-registry-report.json");
  const mdPath = path.join(outDir, "mcp-registry-report.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, formatMcpRegistryMarkdown(report), "utf8");
  return [jsonPath, mdPath];
}

export function formatMcpRegistryMarkdown(report: McpRegistryReport): string {
  const lines = [
    "# MCP Registry Audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: **${report.status.toUpperCase()}**`,
    "",
    `Registry: \`${report.registryPath}\``,
    `Configs: ${report.configPaths.length > 0 ? report.configPaths.map((item) => `\`${item}\``).join(", ") : "none"}`,
    `Approved servers: ${report.approvedServers.length > 0 ? report.approvedServers.map((item) => `\`${item}\``).join(", ") : "none"}`,
    `Checked servers: ${report.checkedServers.length > 0 ? report.checkedServers.map((item) => `\`${item}\``).join(", ") : "none"}`,
    ""
  ];
  if (report.findings.length === 0) {
    lines.push("## Findings", "", "No MCP registry findings.");
    return lines.join("\n");
  }
  lines.push("## Findings", "");
  for (const finding of report.findings) {
    lines.push(`### ${finding.severity.toUpperCase()} ${finding.title}`);
    lines.push("");
    lines.push(`- Rule: \`${finding.id}\``);
    if (finding.file) lines.push(`- File: \`${finding.file}\``);
    if (finding.evidence) lines.push(`- Evidence: \`${finding.evidence}\``);
    lines.push(`- Why: ${finding.why}`);
    lines.push(`- Next: ${finding.next}`);
    lines.push("");
  }
  return lines.join("\n");
}

function resolveInputPath(root: string, input: string): string {
  return path.isAbsolute(input) ? input : path.join(root, input);
}

function resolveConfigPaths(root: string, configPath?: string): string[] {
  if (configPath) {
    const absolutePath = resolveInputPath(root, configPath);
    return fs.existsSync(absolutePath) ? [absolutePath] : [];
  }
  return DEFAULT_CONFIG_PATHS.map((relativePath) => path.join(root, relativePath)).filter((file) => fs.existsSync(file));
}

function readRegistry(registryPath: string): RegistryServer[] {
  if (!fs.existsSync(registryPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(registryPath, "utf8")) as RegistryFile;
    if (Array.isArray(parsed.servers)) return parsed.servers.map(normalizeRegistryServer).filter(Boolean) as RegistryServer[];
  } catch {
    return [];
  }
  return [];
}

function normalizeRegistryServer(value: unknown): RegistryServer | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.name !== "string" || item.name.trim() === "") return null;
  return {
    name: item.name,
    approved: typeof item.approved === "boolean" ? item.approved : undefined,
    trustScore: typeof item.trustScore === "number" ? item.trustScore : undefined,
    permissions: arrayOfStrings(item.permissions),
    allowedCommands: arrayOfStrings(item.allowedCommands),
    allowedUrls: arrayOfStrings(item.allowedUrls),
    riskOwner: typeof item.riskOwner === "string" ? item.riskOwner : undefined,
    riskReason: typeof item.riskReason === "string" ? item.riskReason : undefined
  };
}

function readMcpServers(text: string): McpServerConfig[] {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const block = parsed.mcpServers ?? parsed.servers;
    if (!block || typeof block !== "object" || Array.isArray(block)) return [];
    return Object.entries(block as Record<string, unknown>).map(([name, value]) => {
      const config = typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
      return {
        name,
        command: typeof config.command === "string" ? config.command : undefined,
        url: typeof config.url === "string" ? config.url : undefined,
        env: config.env
      };
    });
  } catch {
    return [];
  }
}

function arrayOfStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is string => typeof item === "string");
}
