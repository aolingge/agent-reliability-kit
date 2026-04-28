import fs from "node:fs";
import path from "node:path";
import { hasFile, readRootText } from "../core/files.js";
import type { Finding, ScanContext, ScannerResult } from "../types.js";

export function scanCommands(context: ScanContext): ScannerResult {
  const findings: Finding[] = [];
  const commands: string[] = [];
  const packageJsonText = readRootText(context.root, "package.json");

  if (packageJsonText) {
    try {
      const parsed = JSON.parse(packageJsonText) as { scripts?: Record<string, string> };
      const scripts = parsed.scripts ?? {};
      for (const name of ["build", "test", "lint", "typecheck", "check"]) {
        if (scripts[name]) commands.push(`npm run ${name}`);
      }
      if (!scripts.test) {
        findings.push({
          id: "commands.node.no-test",
          title: "package.json has no test script",
          severity: "medium",
          scanner: "commands",
          file: "package.json",
          why: "A missing test command makes it harder for agents and contributors to verify changes.",
          next: "Add a test script, even if it starts with a smoke test."
        });
      }
      if (!scripts.build && !scripts.typecheck) {
        findings.push({
          id: "commands.node.no-build-or-typecheck",
          title: "No build or typecheck script",
          severity: "medium",
          scanner: "commands",
          file: "package.json",
          why: "AI-assisted changes need at least one structural check before merge.",
          next: "Add `build`, `typecheck`, or a combined `check` script."
        });
      }
    } catch {
      findings.push({
        id: "commands.package-json.invalid",
        title: "package.json is not valid JSON",
        severity: "high",
        scanner: "commands",
        file: "package.json",
        why: "Invalid package metadata blocks install and verification automation.",
        next: "Fix package.json syntax and rerun the scan."
      });
    }
  }

  if (hasFile(context.files, "pyproject.toml")) {
    commands.push("python -m pytest");
    commands.push("ruff check .");
  }
  if (hasFile(context.files, "pom.xml")) commands.push("mvn test");
  if (hasFile(context.files, "build.gradle") || hasFile(context.files, "build.gradle.kts")) commands.push("gradle test");
  if (hasFile(context.files, "Cargo.toml")) {
    commands.push("cargo test");
    commands.push("cargo clippy");
  }
  if (hasFile(context.files, "go.mod")) commands.push("go test ./...");
  if (fs.existsSync(path.join(context.root, "Makefile"))) commands.push("make test");

  if (commands.length === 0) {
    findings.push({
      id: "commands.none-detected",
      title: "No verification command detected",
      severity: "high",
      scanner: "commands",
      why: "A product-grade repository needs a repeatable command that proves it still works.",
      next: "Add a package script, Makefile target, or documented command for tests/builds."
    });
  }

  return {
    findings,
    facts: {
      detectedCommands: [...new Set(commands)]
    }
  };
}

