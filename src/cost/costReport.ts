import fs from "node:fs";
import path from "node:path";
import { resolveRoot } from "../core/files.js";

export interface CostReportOptions {
  root: string;
  tracePath?: string;
  budgetUsd?: number;
  outDir: string;
}

export interface CostEvent {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface CostBucket {
  provider: string;
  model: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

export interface CostReport {
  generatedAt: string;
  root: string;
  traceFiles: string[];
  budgetUsd?: number;
  total: Omit<CostBucket, "provider" | "model">;
  byModel: CostBucket[];
  alerts: string[];
  status: "pass" | "warn";
}

export function buildCostReport(options: CostReportOptions): CostReport {
  const root = resolveRoot(options.root);
  const traceFiles = resolveTraceFiles(root, options.tracePath);
  const events = traceFiles.flatMap((file) => readCostEvents(file));
  const byModel = summarizeByModel(events);
  const total = byModel.reduce<Omit<CostBucket, "provider" | "model">>((acc, bucket) => ({
    calls: acc.calls + bucket.calls,
    inputTokens: acc.inputTokens + bucket.inputTokens,
    outputTokens: acc.outputTokens + bucket.outputTokens,
    totalTokens: acc.totalTokens + bucket.totalTokens,
    costUsd: acc.costUsd + bucket.costUsd
  }), { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, costUsd: 0 });
  const alerts: string[] = [];

  if (traceFiles.length === 0) alerts.push("No trace files found. Pass --trace or write JSON/JSONL traces under .agent-reliability/traces.");
  if (events.length === 0 && traceFiles.length > 0) alerts.push("Trace files were found, but no token or cost events could be parsed.");
  if (options.budgetUsd !== undefined && total.costUsd > options.budgetUsd) {
    alerts.push(`Cost ${formatMoney(total.costUsd)} is above budget ${formatMoney(options.budgetUsd)}.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    root,
    traceFiles: traceFiles.map((file) => path.relative(root, file).replaceAll("\\", "/")),
    budgetUsd: options.budgetUsd,
    total,
    byModel,
    alerts,
    status: alerts.length > 0 ? "warn" : "pass"
  };
}

export function writeCostReport(report: CostReport, outDir: string): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, "cost-report.json");
  const mdPath = path.join(outDir, "cost-report.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(mdPath, formatCostMarkdown(report), "utf8");
  return [jsonPath, mdPath];
}

export function formatCostMarkdown(report: CostReport): string {
  const lines = [
    "# AI Cost Guard Report",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Status: **${report.status.toUpperCase()}**`,
    "",
    `Calls: ${report.total.calls}`,
    `Input tokens: ${report.total.inputTokens}`,
    `Output tokens: ${report.total.outputTokens}`,
    `Total tokens: ${report.total.totalTokens}`,
    `Cost: ${formatMoney(report.total.costUsd)}`,
    report.budgetUsd === undefined ? "Budget: not set" : `Budget: ${formatMoney(report.budgetUsd)}`,
    "",
    "## By Model",
    "",
    "| Provider | Model | Calls | Tokens | Cost |",
    "| --- | --- | ---: | ---: | ---: |"
  ];

  for (const bucket of report.byModel) {
    lines.push(`| ${bucket.provider} | ${bucket.model} | ${bucket.calls} | ${bucket.totalTokens} | ${formatMoney(bucket.costUsd)} |`);
  }
  if (report.byModel.length === 0) lines.push("| none | none | 0 | 0 | $0.0000 |");

  lines.push("", "## Alerts", "");
  if (report.alerts.length === 0) {
    lines.push("No cost alerts.");
  } else {
    for (const alert of report.alerts) lines.push(`- ${alert}`);
  }
  return lines.join("\n");
}

function resolveTraceFiles(root: string, tracePath?: string): string[] {
  const start = tracePath ? resolveInputPath(root, tracePath) : path.join(root, ".agent-reliability", "traces");
  if (!fs.existsSync(start)) return [];
  if (fs.statSync(start).isFile()) return [start];
  const files: string[] = [];
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    const absolutePath = path.join(start, entry.name);
    if (entry.isDirectory()) {
      files.push(...resolveTraceFiles(root, absolutePath));
    } else if (entry.isFile() && /\.(json|jsonl)$/i.test(entry.name)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function readCostEvents(file: string): CostEvent[] {
  const text = fs.readFileSync(file, "utf8");
  const records = file.endsWith(".jsonl")
    ? text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseJson)
    : [parseJson(text)];
  return records.flatMap((record) => normalizeRecord(record)).filter((event): event is CostEvent => event !== null);
}

function normalizeRecord(record: unknown): CostEvent[] {
  if (Array.isArray(record)) return record.flatMap(normalizeRecord);
  if (!record || typeof record !== "object") return [];
  const item = record as Record<string, unknown>;
  if (Array.isArray(item.events)) return item.events.flatMap(normalizeRecord);
  if (Array.isArray(item.calls)) return item.calls.flatMap(normalizeRecord);

  const usage = typeof item.usage === "object" && item.usage !== null ? item.usage as Record<string, unknown> : {};
  const provider = stringField(item.provider) ?? stringField(item.modelProvider) ?? "unknown";
  const model = stringField(item.model) ?? stringField(item.modelName) ?? "unknown";
  const inputTokens = numberField(item.inputTokens) ?? numberField(item.input_tokens) ?? numberField(item.prompt_tokens) ?? numberField(usage.inputTokens) ?? numberField(usage.prompt_tokens) ?? 0;
  const outputTokens = numberField(item.outputTokens) ?? numberField(item.output_tokens) ?? numberField(item.completion_tokens) ?? numberField(usage.outputTokens) ?? numberField(usage.completion_tokens) ?? 0;
  const totalTokens = numberField(item.totalTokens) ?? numberField(item.total_tokens) ?? numberField(usage.totalTokens) ?? inputTokens + outputTokens;
  const costUsd = numberField(item.costUsd) ?? numberField(item.cost_usd) ?? numberField(item.usd) ?? 0;

  if (inputTokens + outputTokens + totalTokens + costUsd === 0) return [];
  return [{ provider, model, inputTokens, outputTokens, totalTokens, costUsd }];
}

function summarizeByModel(events: CostEvent[]): CostBucket[] {
  const buckets = new Map<string, CostBucket>();
  for (const event of events) {
    const key = `${event.provider}\u0000${event.model}`;
    const current = buckets.get(key) ?? {
      provider: event.provider,
      model: event.model,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0
    };
    current.calls += 1;
    current.inputTokens += event.inputTokens;
    current.outputTokens += event.outputTokens;
    current.totalTokens += event.totalTokens;
    current.costUsd += event.costUsd;
    buckets.set(key, current);
  }
  return [...buckets.values()].sort((left, right) => right.costUsd - left.costUsd);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function numberField(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function resolveInputPath(root: string, input: string): string {
  return path.isAbsolute(input) ? input : path.join(root, input);
}

function formatMoney(value: number): string {
  return `$${value.toFixed(4)}`;
}
