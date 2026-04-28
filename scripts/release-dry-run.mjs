#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const runThroughShell = process.platform === "win32";
const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "dist/cli.js",
  "docs/release-readiness.md",
  "docs/examples/clean-report.md",
  "docs/launch/README.md",
  "docs/launch/channel-copy.md",
  "assets/social-preview.png",
  "assets/product-hunt-thumbnail.png"
];

const result = spawnSync("npm", ["pack", "--json", "--dry-run"], {
  cwd: process.cwd(),
  encoding: "utf8",
  shell: runThroughShell,
  windowsHide: true
});

if (result.error) {
  console.error(`release dry run: failed to start npm: ${result.error.message}`);
  process.exit(1);
}

if (result.status !== 0) {
  if (result.stdout.trim()) console.error(result.stdout.trim());
  if (result.stderr.trim()) console.error(result.stderr.trim());
  console.error("release dry run: npm pack --json --dry-run failed");
  process.exit(result.status ?? 1);
}

let pack;
try {
  pack = JSON.parse(result.stdout.trim());
} catch {
  console.error("release dry run: could not parse npm pack JSON output");
  if (result.stdout.trim()) console.error(result.stdout.trim());
  process.exit(1);
}

const entry = Array.isArray(pack) ? pack[0] : undefined;
if (!entry || !Array.isArray(entry.files)) {
  console.error("release dry run: npm pack JSON did not include a file list");
  process.exit(1);
}

const packedFiles = new Set(entry.files.map((file) => normalizePath(file.path)));
const missing = requiredFiles.filter((file) => !packedFiles.has(file));

if (missing.length > 0) {
  console.error("release dry run: package preview is missing required files:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

console.log("release dry run: ok");
console.log(`- package: ${entry.name}@${entry.version}`);
console.log(`- tarball: ${entry.filename}`);
console.log(`- files: ${entry.files.length}`);
console.log(`- unpacked size: ${formatBytes(entry.unpackedSize)}`);
console.log("- required files: present");

function normalizePath(value) {
  return String(value).replaceAll("\\", "/").replace(/^package\//, "");
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "unknown";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}
