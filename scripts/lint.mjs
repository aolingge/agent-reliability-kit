import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkedExtensions = new Set([".ts", ".js", ".md", ".json", ".yml", ".yaml", ".html", ".svg"]);
const ignoredDirs = new Set([".git", "node_modules", "dist", "coverage", ".tmp", ".agent-reliability"]);
const problems = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!checkedExtensions.has(path.extname(entry.name))) continue;
    const text = fs.readFileSync(full, "utf8");
    const rel = path.relative(root, full).replaceAll("\\", "/");
    if (/\r\n/.test(text)) problems.push(`${rel}: use LF line endings`);
    if (/[ \t]$/m.test(text)) problems.push(`${rel}: remove trailing whitespace`);
    if (!text.endsWith("\n")) problems.push(`${rel}: add final newline`);
    if (/\bAPI[_-]?KEY\s*=\s*['"]?[A-Za-z0-9_-]{16,}/i.test(text)) problems.push(`${rel}: possible secret-like API key`);
  }
}

walk(root);

if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

console.log("lint: ok");

