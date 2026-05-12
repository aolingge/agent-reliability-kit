import fs from "node:fs";
import path from "node:path";
import type { ReportFormat } from "../types.js";

interface TextAuditCheck {
  id: string;
  pattern: string;
  message: string;
  expectNoMatch?: boolean;
}

interface TextAuditProfile {
  title: string;
  sourceRepo: string;
  checks: TextAuditCheck[];
}

export interface TextAuditResult {
  status: "PASS" | "WARN";
  check: string;
  message: string;
}

export interface TextAuditReport {
  tool: "agent-reliability-kit text-audit";
  profile: string;
  sourceRepo: string;
  target: string;
  title: string;
  score: number;
  passed: number;
  total: number;
  results: TextAuditResult[];
  redacted: string;
}

const tokenPattern = /(github_pat_|ghp_|gitee_[A-Za-z0-9_]*|sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16})[A-Za-z0-9_-]*/g;
const assignmentSecretPattern = /(token|password|secret|cookie)\s*[:=]\s*[^\s]+/gi;

const profiles: Record<string, TextAuditProfile> = {
  "agent-ci": {
    title: "Agent CI Doctor",
    sourceRepo: "agent-ci-doctor",
    checks: [
      check("test", "test|pytest|go test|cargo test|mvn test|gradle test", "Has a test command."),
      check("lint", "lint|ruff|eslint|prettier|checkstyle", "Has a lint command."),
      check("build", "build|compile|package|dist", "Has a build command."),
      check("ci", "ci|github actions|workflow|validate", "Mentions CI or validation.")
    ]
  },
  "ci-command": {
    title: "CI Command Harvest",
    sourceRepo: "ci-command-harvest",
    checks: [
      check("test", "npm test|pytest|go test|mvn test|gradle test|测试", "Lists test command."),
      check("lint", "lint|eslint|ruff|checkstyle|格式|检查", "Lists lint command."),
      check("build", "build|compile|package|构建|打包", "Lists build command."),
      check("scope", "safe|local|workspace|安全|本地", "Explains safe scope.")
    ]
  },
  "agents-md": {
    title: "AGENTS.md Doctor",
    sourceRepo: "agents-md-doctor",
    checks: [
      check("purpose", "#\\s*agents\\.md|ai agent|coding agent|codex|claude|cursor", "Explains that the file is for AI coding agents."),
      check("read-order", "read order|read first|start here|先读|读取顺序", "Defines where agents should start reading."),
      check("build-test", "(npm|pnpm|yarn|pytest|mvn|gradle|go test|cargo test|make).{0,40}(test|build|lint|check)|验证|测试|构建", "Includes concrete build/test/lint commands."),
      check("boundaries", "do not|never|avoid|不要|禁止|不得|scope|boundary|边界", "Defines editing boundaries."),
      check("secrets", "secret|token|cookie|credential|api key|密钥|令牌|凭据", "Mentions secret and credential handling."),
      check("git-workflow", "git status|pull request|commit|branch|dirty|worktree|提交|分支", "Mentions git workflow and dirty worktree handling."),
      check("project-map", "layout|structure|directory|folder|repo|目录|结构|项目", "Provides project structure hints."),
      check("verification", "verify|verified|run|evidence|验证|证据|运行", "Asks agents to verify claims."),
      noMatch("leaked-secret", tokenPattern.source, "Does not contain obvious raw secrets.")
    ]
  },
  "context-budget": {
    title: "Agent Context Budget",
    sourceRepo: "agent-context-budget",
    checks: [
      check("has-purpose", "agent|context|prompt|instructions|上下文|说明", "Explains why this file belongs in agent context."),
      check("has-commands", "npm|pnpm|pytest|mvn|gradle|test|build|lint|验证|测试", "Contains concrete commands."),
      check("has-boundary", "do not|never|avoid|boundary|不要|禁止|边界", "Defines what should not be loaded or edited."),
      check("has-summary", "summary|overview|tl;dr|摘要|概览", "Provides a compact summary.")
    ]
  },
  "context-diff": {
    title: "Agent Context Diff",
    sourceRepo: "agent-context-diff",
    checks: [
      check("added", "add|added|new|新增|添加", "Describes additions."),
      check("removed", "remove|removed|delete|删除|移除", "Describes removals."),
      check("risk", "risk|impact|breaking|风险|影响", "Mentions risk or impact."),
      check("verification", "test|build|lint|verify|验证|测试", "Mentions verification.")
    ]
  },
  "env-redactor": {
    title: "Agent Env Redactor",
    sourceRepo: "agent-env-redactor",
    checks: [
      check("has-secret-boundary", "token|secret|api[_ -]?key|cookie|credential|密钥|令牌|凭据", "Mentions secret handling."),
      check("has-redaction-target", "mcp|agent|prompt|env|config|环境变量|配置", "Targets agent config or logs."),
      check("has-share-context", "issue|report|share|bug|日志|报告|分享", "Designed for shareable reports."),
      noMatch("no-raw-secret", tokenPattern.source, "Does not contain obvious raw secrets.")
    ]
  },
  "log-triage": {
    title: "Agent Log Triage",
    sourceRepo: "agent-log-triage",
    checks: [
      check("error", "error|exception|failed|失败|异常|错误", "Contains error signal."),
      check("command", "command|npm|node|python|mvn|gradle|命令", "Contains command context."),
      check("file", "\\.js|\\.ts|\\.py|\\.md|line|file|文件|行", "Contains file or line context."),
      check("next", "fix|next|retry|建议|下一步|修复", "Contains next-step hint.")
    ]
  },
  "permission-audit": {
    title: "Agent Permission Audit",
    sourceRepo: "agent-permission-audit",
    checks: [
      check("filesystem", "file|filesystem|read|write|文件|读|写", "Mentions file access."),
      check("shell", "shell|command|exec|terminal|命令|终端", "Mentions shell command rules."),
      check("network", "network|browser|http|api|网络|浏览器", "Mentions network or browser access."),
      check("secrets", "secret|token|cookie|credential|密钥|令牌|凭据", "Mentions secret boundary.")
    ]
  },
  "pr-brief": {
    title: "Agent PR Brief",
    sourceRepo: "agent-pr-brief",
    checks: [
      check("goal", "goal|purpose|why|目标|目的|为什么", "Explains why the PR exists."),
      check("scope", "scope|changed files|影响范围|范围", "Describes change scope."),
      check("verification", "test|lint|build|verify|验证|测试", "Lists verification performed."),
      check("risk", "risk|rollback|migration|风险|回滚|迁移", "Mentions risk or rollback.")
    ]
  },
  "runbook": {
    title: "Agent Runbook Check",
    sourceRepo: "agent-runbook-check",
    checks: [
      check("debug", "debug|troubleshoot|logs?|排障|调试|日志", "Explains debugging steps."),
      check("verify", "verify|test|health|验证|测试|健康", "Explains verification."),
      check("rollback", "rollback|revert|restore|回滚|恢复", "Explains rollback."),
      check("report", "report|summary|evidence|汇报|证据", "Explains reporting expectations.")
    ]
  },
  "task-scope": {
    title: "Agent Task Scope",
    sourceRepo: "agent-task-scope",
    checks: [
      check("scope", "scope|范围|边界", "Defines scope."),
      check("acceptance", "acceptance|criteria|done when|验收|完成标准", "Defines acceptance criteria."),
      check("constraints", "constraint|do not|must|不要|必须|约束", "Defines constraints."),
      check("verification", "verify|verification|test|build|lint|验证|测试", "Defines verification.")
    ]
  },
  "tool-risk": {
    title: "Agent Tool Risk Score",
    sourceRepo: "agent-tool-risk-score",
    checks: [
      check("files", "file|filesystem|read|write|文件", "Mentions file access."),
      check("shell", "shell|exec|command|terminal|命令", "Mentions shell access."),
      check("network", "http|api|browser|network|网络|浏览器", "Mentions network/browser access."),
      check("secrets", "secret|token|cookie|credential|密钥|凭据", "Mentions secret handling.")
    ]
  },
  "windows-path": {
    title: "Agent Windows Path Doctor",
    sourceRepo: "agent-windows-path-doctor",
    checks: [
      check("drive", "[A-Z]:\\\\|/mnt/[a-z]/", "Mentions Windows or WSL paths."),
      check("quotes", "\"[^\"]+\"|'[^']+'", "Uses quotes around paths with spaces."),
      check("shell", "powershell|pwsh|cmd|bash|wsl", "Names the intended shell."),
      check("portable", "cross-platform|windows|linux|macos|portable|跨平台", "Documents portability expectations.")
    ]
  },
  agentignore: {
    title: "Agentignore Check",
    sourceRepo: "agentignore-check",
    checks: [
      check("env", "\\.env|env.local|secrets?", "Ignores env and secret files."),
      check("logs", "logs?/|\\*.log|日志", "Ignores logs."),
      check("build", "node_modules|dist|build|target|__pycache__", "Ignores generated dependencies and builds."),
      check("private", "private|cookies?|browser|profile|凭据|私有", "Ignores private data.")
    ]
  },
  changelog: {
    title: "AI Changelog Guard",
    sourceRepo: "ai-changelog-guard",
    checks: [
      check("version", "v\\d+\\.\\d+\\.\\d+|version|版本", "Mentions version."),
      check("ai-assisted", "ai|agent|codex|claude|AI 辅助|智能体", "Mentions AI-assisted work when relevant."),
      check("verification", "test|build|lint|ci|验证|测试", "Mentions verification."),
      check("breaking", "breaking|migration|兼容|破坏|迁移", "Mentions breaking changes or compatibility.")
    ]
  },
  "pr-risk": {
    title: "AI PR Risk Labeler",
    sourceRepo: "ai-pr-risk-labeler",
    checks: [
      check("scope", "scope|files changed|diff|范围|改动", "Describes PR scope."),
      check("risk", "risk|security|migration|breaking|风险|安全|迁移", "Mentions risk signals."),
      check("tests", "test|build|lint|ci|验证|测试", "Mentions verification."),
      check("rollback", "rollback|revert|恢复|回滚", "Mentions rollback or recovery.")
    ]
  },
  "mcp-readme": {
    title: "MCP README Score",
    sourceRepo: "mcp-readme-score",
    checks: [
      check("install", "install|npx|uvx|pip|docker|安装", "Shows install instructions."),
      check("configuration", "mcpServers|command|args|env|配置", "Shows client configuration."),
      check("permissions", "permission|filesystem|network|read|write|权限|文件|网络", "Explains permissions."),
      check("security", "security|token|secret|安全|密钥", "Mentions security boundary.")
    ]
  },
  "repo-health": {
    title: "Repo Agent Health",
    sourceRepo: "repo-agent-health",
    checks: [
      check("readme", "readme|quick start|overview|快速开始", "Has README or overview guidance."),
      check("commands", "test|build|lint|check|验证|测试", "Has verification commands."),
      check("agent-rules", "agents\\.md|agent|codex|claude|智能体", "Has agent instructions."),
      check("safety", "secret|private|do not|不要|密钥|私有", "Has safety boundaries.")
    ]
  },
  "repo-context": {
    title: "Repo Context Pack",
    sourceRepo: "repo-context-pack",
    checks: [
      check("readme", "readme|overview|quick start|快速开始", "Includes README or quick start material."),
      check("agents", "agents\\.md|ai agent|coding agent|agent", "Includes agent instructions."),
      check("commands", "test|build|lint|check|验证|测试", "Includes verification commands."),
      check("boundaries", "secret|private|do not|不要|密钥|私有", "Includes privacy boundary.")
    ]
  },
  onboarding: {
    title: "Repo Onboarding Check",
    sourceRepo: "repo-onboarding-check",
    checks: [
      check("install", "install|setup|npm install|pip install|安装", "Explains installation."),
      check("run", "run|start|serve|启动|运行", "Explains how to run the project."),
      check("test", "test|build|lint|check|验证|测试", "Explains verification."),
      check("contribute", "contribut|issue|pull request|贡献|提交", "Explains contribution path.")
    ]
  },
  "skill-md": {
    title: "SKILL.md Lint",
    sourceRepo: "skill-md-lint",
    checks: [
      check("trigger", "trigger|when to use|activate|触发|使用时机", "Defines when to use the skill."),
      check("inputs", "input|arguments|requires|输入|参数", "Defines inputs."),
      check("outputs", "output|result|deliverable|输出|结果", "Defines outputs."),
      check("safety", "safe|do not|secret|token|安全|禁止|密钥", "Defines safety boundaries.")
    ]
  },
  "release-mirror": {
    title: "Release Mirror Check",
    sourceRepo: "release-mirror-check",
    checks: [
      check("github", "github|release|tag|actions", "Mentions GitHub release evidence."),
      check("gitee", "gitee|mirror|同步|镜像", "Mentions Gitee mirror evidence."),
      check("version", "v\\d+\\.\\d+\\.\\d+|version|tag|版本", "Mentions version or tag."),
      check("verification", "test|build|lint|verify|验证|测试", "Mentions verification.")
    ]
  }
};

export function listTextAuditProfiles(): string[] {
  return Object.keys(profiles).sort();
}

export function runTextAudit(target: string, profileName: string): TextAuditReport {
  const profile = profiles[profileName];
  if (!profile) {
    throw new Error(`Unknown text-audit profile: ${profileName}. Available profiles: ${listTextAuditProfiles().join(", ")}`);
  }
  const raw = readTarget(target);
  const redacted = redact(raw);
  const results = profile.checks.map((item) => {
    const source = item.expectNoMatch ? raw : redacted;
    const matched = new RegExp(item.pattern, "i").test(source);
    const passed = item.expectNoMatch ? !matched : matched;
    return {
      status: passed ? "PASS" : "WARN",
      check: item.id,
      message: item.message
    } satisfies TextAuditResult;
  });
  const passed = results.filter((item) => item.status === "PASS").length;
  const score = Math.round((passed / results.length) * 100);
  return {
    tool: "agent-reliability-kit text-audit",
    profile: profileName,
    sourceRepo: profile.sourceRepo,
    target,
    title: profile.title,
    score,
    passed,
    total: results.length,
    results,
    redacted
  };
}

export function formatTextAuditReport(report: TextAuditReport, format: ReportFormat): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "sarif") return JSON.stringify(formatSarif(report), null, 2);
  if (format === "annotations") return formatAnnotations(report);
  if (format === "html") return formatHtml(report);
  if (format === "markdown") return formatMarkdown(report);
  return formatText(report);
}

function check(id: string, pattern: string, message: string): TextAuditCheck {
  return { id, pattern, message };
}

function noMatch(id: string, pattern: string, message: string): TextAuditCheck {
  return { id, pattern, message, expectNoMatch: true };
}

function readTarget(target: string): string {
  const stat = fs.statSync(target);
  if (!stat.isDirectory()) return fs.readFileSync(target, "utf8");
  return listTextFiles(target)
    .slice(0, 120)
    .map((file) => `\n--- ${path.relative(target, file).replaceAll("\\", "/")} ---\n${fs.readFileSync(file, "utf8")}`)
    .join("\n");
}

function listTextFiles(root: string): string[] {
  const found: string[] = [];
  const ignored = new Set([".git", "node_modules", "dist", "build", "target", ".agent-reliability", ".tmp"]);
  const visit = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) visit(path.join(dir, entry.name));
      } else if (/\.(md|txt|json|ya?ml|log|env|js|ts)$/i.test(entry.name)) {
        found.push(path.join(dir, entry.name));
      }
    }
  };
  visit(root);
  return found.sort();
}

function redact(text: string): string {
  return text
    .replace(tokenPattern, "[REDACTED_TOKEN]")
    .replace(assignmentSecretPattern, "$1=[REDACTED]");
}

function formatText(report: TextAuditReport): string {
  const lines = [
    `${report.title} score: ${report.score}/100`,
    `Profile: ${report.profile}`,
    `Source repo: ${report.sourceRepo}`,
    `Target: ${report.target}`,
    ""
  ];
  for (const item of report.results) {
    lines.push(`${item.status.padEnd(5)} ${item.check.padEnd(18)} ${item.message}`);
  }
  return lines.join("\n");
}

function formatMarkdown(report: TextAuditReport): string {
  const rows = report.results.map((item) => `| ${item.status} | ${item.check} | ${item.message} |`).join("\n");
  return `# ${report.title} Report

Score: **${report.score}/100**

- Profile: \`${report.profile}\`
- Source repo: \`${report.sourceRepo}\`
- Target: \`${report.target}\`

| Status | Check | Message |
| --- | --- | --- |
${rows}
`;
}

function formatHtml(report: TextAuditReport): string {
  const rows = report.results.map((item) => `<tr><td>${escapeHtml(item.status)}</td><td>${escapeHtml(item.check)}</td><td>${escapeHtml(item.message)}</td></tr>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(report.title)} Report</title></head><body><h1>${escapeHtml(report.title)} Report</h1><p>Score: ${report.score}/100</p><p>Profile: ${escapeHtml(report.profile)}</p><table><thead><tr><th>Status</th><th>Check</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

function formatAnnotations(report: TextAuditReport): string {
  return report.results
    .filter((item) => item.status !== "PASS")
    .map((item) => `::warning file=${escapeAnnotation(report.target)},title=${escapeAnnotation(item.check)}::${escapeAnnotation(item.message)}`)
    .join("\n");
}

function formatSarif(report: TextAuditReport): unknown {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "agent-reliability-kit text-audit",
            informationUri: "https://github.com/aolingge/agent-reliability-kit",
            rules: report.results.map((item) => ({
              id: `${report.profile}.${item.check}`,
              shortDescription: { text: item.message }
            }))
          }
        },
        results: report.results
          .filter((item) => item.status !== "PASS")
          .map((item) => ({
            ruleId: `${report.profile}.${item.check}`,
            level: "warning",
            message: { text: item.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: report.target.replaceAll("\\", "/") },
                  region: { startLine: 1 }
                }
              }
            ]
          }))
      }
    ]
  };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}

function escapeAnnotation(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(":", "%3A").replaceAll(",", "%2C");
}
