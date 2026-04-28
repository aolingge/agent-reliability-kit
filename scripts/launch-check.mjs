#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const requiredFiles = [
  "docs/launch/README.md",
  "docs/launch/launch-plan.md",
  "docs/launch/channel-copy.md",
  "docs/launch/demo-script.md",
  "docs/launch/press-kit.md",
  "docs/launch/community-responses.md",
  "docs/launch/channel-rules.md",
  "docs/launch/product-hunt.md",
  "docs/launch/devto-article.md",
  "docs/launch/live-links.md",
  "assets/social-preview.png",
  "assets/social-preview.svg",
  "assets/product-hunt-thumbnail.png",
  "assets/product-hunt-thumbnail.svg",
  "docs/assets/social-preview.png"
];
const placeholders = ["<PUBLIC_REPO_URL>", "<NPM_PACKAGE_URL>", "<DOCS_URL>"];
const problems = [];

for (const file of requiredFiles) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) problems.push(`missing required launch file: ${file}`);
}

checkSize("assets/social-preview.png", 1024 * 1024, "GitHub social preview should stay under 1 MB");
checkSize("assets/product-hunt-thumbnail.png", 3 * 1024 * 1024, "Product Hunt thumbnail should stay under 3 MB");
checkPlaceholders();
checkLocalLinks("docs/index.html");
checkLocalLinks("docs/launch/README.md");

if (problems.length > 0) {
  console.error("launch check: failed");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("launch check: ok");
console.log("- launch docs: present");
console.log("- placeholders: present");
console.log("- social images: present and within size limits");
console.log("- docs links: valid");

function checkSize(file, maxBytes, message) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const { size } = fs.statSync(full);
  if (size > maxBytes) problems.push(`${file}: ${message}; current size is ${size} bytes`);
}

function checkPlaceholders() {
  const launchDir = path.join(root, "docs", "launch");
  if (!fs.existsSync(launchDir)) return;
  const combined = fs
    .readdirSync(launchDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => fs.readFileSync(path.join(launchDir, file), "utf8"))
    .join("\n");

  for (const placeholder of placeholders) {
    if (!combined.includes(placeholder)) problems.push(`launch docs missing placeholder ${placeholder}`);
  }
}

function checkLocalLinks(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) return;
  const text = fs.readFileSync(full, "utf8");
  const baseDir = path.dirname(full);
  const links = collectLinks(text);

  for (const link of links) {
    if (isExternalOrAnchor(link)) continue;
    const target = link.split("#")[0];
    if (!target) continue;
    const decoded = decodeURI(target);
    const targetPath = path.resolve(baseDir, decoded);
    if (!fs.existsSync(targetPath)) problems.push(`${file}: broken local link ${link}`);
  }
}

function collectLinks(text) {
  const links = [];
  const htmlLinkPattern = /\b(?:href|src)="([^"]+)"/g;
  const markdownLinkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

  for (const match of text.matchAll(htmlLinkPattern)) links.push(match[1]);
  for (const match of text.matchAll(markdownLinkPattern)) links.push(match[1]);
  return links;
}

function isExternalOrAnchor(link) {
  return (
    link.startsWith("#") ||
    link.startsWith("http://") ||
    link.startsWith("https://") ||
    link.startsWith("mailto:") ||
    link.startsWith("<")
  );
}
