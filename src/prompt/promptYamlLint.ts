import fs from "node:fs";
import type { ReportFormat } from "../types.js";

interface PromptCheck {
  id: string;
  weight: number;
  pass: string;
  fail: string;
  run: (input: { file: string; text: string }) => boolean;
}

export interface PromptLintResult {
  status: "PASS" | "FAIL";
  check: string;
  message: string;
  weight: number;
}

export interface PromptLintReport {
  file: string;
  score: number;
  results: PromptLintResult[];
}

const secretPattern = /(github_pat_|ghp_|sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})/;

const checks: PromptCheck[] = [
  {
    id: "extension",
    weight: 1,
    run: ({ file }) => /\.(prompt\.ya?ml|ya?ml)$/i.test(file),
    pass: "File extension is compatible with prompt-as-code workflows",
    fail: "Use .prompt.yml, .prompt.yaml, .yml, or .yaml."
  },
  {
    id: "name",
    weight: 1,
    run: ({ text }) => hasTopLevelKey(text, "name"),
    pass: "Prompt has a name",
    fail: "Add a top-level name field."
  },
  {
    id: "description",
    weight: 1,
    run: ({ text }) => hasTopLevelKey(text, "description"),
    pass: "Prompt explains when to use it",
    fail: "Add a description so humans and agents know when to use this prompt."
  },
  {
    id: "model",
    weight: 1,
    run: ({ text }) => hasTopLevelKey(text, "model"),
    pass: "Model is declared",
    fail: "Add a model field or document the intended model in metadata."
  },
  {
    id: "prompt-body",
    weight: 1.5,
    run: ({ text }) => hasTopLevelKey(text, "prompt") || hasTopLevelKey(text, "messages"),
    pass: "Prompt body is present",
    fail: "Add prompt: or messages: content."
  },
  {
    id: "inputs",
    weight: 1,
    run: ({ text }) => hasTopLevelKey(text, "inputs") || hasTopLevelKey(text, "variables"),
    pass: "Inputs or variables are declared",
    fail: "Declare inputs or variables instead of relying on hidden assumptions."
  },
  {
    id: "tests",
    weight: 1,
    run: ({ text }) => hasTopLevelKey(text, "tests") || hasTopLevelKey(text, "evals") || /expected/i.test(text),
    pass: "Prompt has a test or expected behavior section",
    fail: "Add tests, evals, or expected output examples."
  },
  {
    id: "length",
    weight: 0.8,
    run: ({ text }) => countNonEmptyLines(text) >= 8,
    pass: "Prompt file has enough structure to review",
    fail: "The file is very short. Add metadata, inputs, and expected behavior."
  }
];

export function lintPromptYamlFile(file: string): PromptLintReport {
  if (!fs.existsSync(file)) throw new Error(`Prompt file does not exist: ${file}`);
  if (!fs.statSync(file).isFile()) throw new Error(`Prompt target is not a file: ${file}`);

  const text = fs.readFileSync(file, "utf8");
  const results: PromptLintResult[] = checks.map((check) => {
    const ok = check.run({ file, text });
    return {
      status: ok ? "PASS" : "FAIL",
      check: check.id,
      message: ok ? check.pass : check.fail,
      weight: check.weight
    };
  });

  if (secretPattern.test(text)) {
    results.push({
      status: "FAIL",
      check: "leaked-secret",
      message: "Secret-like value found. Remove it before committing prompt files.",
      weight: 2
    });
  }

  const total = results.reduce((sum, item) => sum + item.weight, 0);
  const earned = results.reduce((sum, item) => sum + (item.status === "PASS" ? item.weight : 0), 0);
  return { file, score: Math.round((earned / total) * 100), results };
}

export function formatPromptLintReport(report: PromptLintReport, format: ReportFormat): string {
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "markdown") return formatPromptMarkdown(report);
  if (format === "sarif") return JSON.stringify(formatPromptSarif(report), null, 2);
  if (format === "annotations") return formatPromptAnnotations(report);
  if (format === "html") return formatPromptHtml(report);
  return formatPromptText(report);
}

function hasTopLevelKey(text: string, key: string): boolean {
  return new RegExp(`^${key}\\s*:`, "m").test(text);
}

function countNonEmptyLines(text: string): number {
  return text.split(/\r?\n/).filter((line) => line.trim()).length;
}

function formatPromptText(report: PromptLintReport): string {
  const lines = [`Prompt YAML score: ${report.score}/100`, `File: ${report.file}`, ""];
  for (const result of report.results) {
    lines.push(`${result.status.padEnd(5)} ${result.check.padEnd(14)} ${result.message}`);
  }
  return lines.join("\n");
}

function formatPromptMarkdown(report: PromptLintReport): string {
  const rows = report.results.map((result) => `| ${result.status} | ${result.check} | ${result.message} |`).join("\n");
  return `# Prompt YAML Lint Report

Score: **${report.score}/100**

File: \`${report.file}\`

| Status | Check | Message |
| --- | --- | --- |
${rows}
`;
}

function formatPromptAnnotations(report: PromptLintReport): string {
  return report.results
    .filter((result) => result.status !== "PASS")
    .map((result) => `::warning file=${escapeAnnotation(report.file)},title=${escapeAnnotation(result.check)}::${escapeAnnotation(result.message)}`)
    .join("\n");
}

function formatPromptSarif(report: PromptLintReport): object {
  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "agent-reliability-kit prompt-lint",
            informationUri: "https://github.com/aolingge/agent-reliability-kit"
          }
        },
        results: report.results
          .filter((result) => result.status !== "PASS")
          .map((result) => ({
            ruleId: result.check,
            level: "warning",
            message: { text: result.message },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: report.file }
                }
              }
            ]
          }))
      }
    ]
  };
}

function formatPromptHtml(report: PromptLintReport): string {
  const rows = report.results.map((result) => `<tr><td>${escapeHtml(result.status)}</td><td>${escapeHtml(result.check)}</td><td>${escapeHtml(result.message)}</td></tr>`).join("");
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Prompt YAML Lint Report</title></head>
<body>
<h1>Prompt YAML Lint Report</h1>
<p>Score: <strong>${report.score}/100</strong></p>
<p>File: <code>${escapeHtml(report.file)}</code></p>
<table>
<thead><tr><th>Status</th><th>Check</th><th>Message</th></tr></thead>
<tbody>${rows}</tbody>
</table>
</body>
</html>`;
}

function escapeAnnotation(value: string): string {
  return value.replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A").replaceAll(",", "%2C").replaceAll(":", "%3A");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
