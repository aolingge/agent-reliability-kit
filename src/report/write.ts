import fs from "node:fs";
import path from "node:path";
import { formatAnnotations } from "./annotations.js";
import { formatHtml } from "./html.js";
import { formatMarkdown } from "./markdown.js";
import { formatSarif } from "./sarif.js";
import { formatText } from "./text.js";
import type { Report, ReportFormat } from "../types.js";

export function renderReport(report: Report, format: ReportFormat): string {
  if (format === "text") return formatText(report);
  if (format === "markdown") return formatMarkdown(report);
  if (format === "json") return JSON.stringify(report, null, 2);
  if (format === "html") return formatHtml(report);
  if (format === "sarif") return JSON.stringify(formatSarif(report), null, 2);
  if (format === "annotations") return formatAnnotations(report);
  throw new Error(`Unknown report format: ${format}`);
}

export function writeReports(report: Report, outDir: string, formats: ReportFormat[]): string[] {
  fs.mkdirSync(outDir, { recursive: true });
  const written: string[] = [];
  for (const format of formats) {
    if (format === "text" || format === "annotations") continue;
    const fileName = {
      markdown: "report.md",
      json: "report.json",
      html: "report.html",
      sarif: "report.sarif"
    }[format];
    if (!fileName) continue;
    const target = path.join(outDir, fileName);
    fs.writeFileSync(target, renderReport(report, format), "utf8");
    written.push(target);
  }
  return written;
}

