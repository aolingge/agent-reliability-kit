export type Severity = "critical" | "high" | "medium" | "low" | "info";

export type ReportFormat = "text" | "markdown" | "json" | "html" | "sarif" | "annotations";

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  file?: string;
  line?: number;
  evidence?: string;
  why: string;
  next: string;
  scanner: string;
}

export interface ScanContext {
  root: string;
  files: RepoFile[];
  now: string;
}

export interface RepoFile {
  absolutePath: string;
  relativePath: string;
  size: number;
}

export interface ScannerResult {
  findings: Finding[];
  facts?: Record<string, unknown>;
}

export interface Report {
  tool: {
    name: string;
    version: string;
  };
  root: string;
  generatedAt: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  facts: Record<string, unknown>;
  findings: Finding[];
}

export interface ScanOptions {
  root: string;
  outDir: string;
  formats: ReportFormat[];
  minScore: number;
  stdout: boolean;
}

