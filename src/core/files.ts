import fs from "node:fs";
import path from "node:path";
import type { RepoFile } from "../types.js";

const SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".tmp",
  ".next",
  ".turbo",
  ".venv",
  "venv",
  "__pycache__",
  ".agent-reliability"
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".md",
  ".mdx",
  ".txt",
  ".json",
  ".jsonc",
  ".yml",
  ".yaml",
  ".toml",
  ".ini",
  ".env",
  ".example",
  ".sh",
  ".ps1",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".rs",
  ".java",
  ".kt",
  ".xml",
  ".html",
  ".css",
  ".svg"
]);

export function resolveRoot(input: string): string {
  const root = path.resolve(input);
  if (!fs.existsSync(root)) throw new Error(`Path does not exist: ${root}`);
  if (!fs.statSync(root).isDirectory()) throw new Error(`Path is not a directory: ${root}`);
  return root;
}

export function listRepoFiles(root: string): RepoFile[] {
  const files: RepoFile[] = [];

  function walk(dir: string): void {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;
      const stat = fs.statSync(absolutePath);
      files.push({
        absolutePath,
        relativePath: path.relative(root, absolutePath).replaceAll("\\", "/"),
        size: stat.size
      });
    }
  }

  walk(root);
  return files;
}

export function readTextFile(file: RepoFile): string | null {
  if (file.size > 512_000) return null;
  const ext = path.extname(file.relativePath).toLowerCase();
  const name = path.basename(file.relativePath).toLowerCase();
  if (!TEXT_EXTENSIONS.has(ext) && !name.includes(".env")) return null;
  const buffer = fs.readFileSync(file.absolutePath);
  if (buffer.includes(0)) return null;
  return buffer.toString("utf8");
}

export function readRootText(root: string, relativePath: string): string | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) return null;
  const file: RepoFile = {
    absolutePath,
    relativePath: relativePath.replaceAll("\\", "/"),
    size: fs.statSync(absolutePath).size
  };
  return readTextFile(file);
}

export function hasFile(files: RepoFile[], relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/").toLowerCase();
  return files.some((file) => file.relativePath.toLowerCase() === normalized);
}

export function findFiles(files: RepoFile[], matcher: RegExp): RepoFile[] {
  return files.filter((file) => matcher.test(file.relativePath));
}

export function lineNumber(text: string, index: number): number {
  return text.slice(0, index).split("\n").length;
}
