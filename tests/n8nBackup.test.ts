import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { backupN8nWorkflows } from "../src/n8n/backup.js";

function rootFixture(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ark-backup-paths-"));
}

function workflow(root: string, relative: string, name = "synthetic-workflow"): void {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ name, nodes: [{ name: "synthetic-node", type: "n8n-nodes-base.manualTrigger", parameters: {} }] }));
}

describe("n8n backup destination safety", () => {
  it.each([
    ["a/b.json", "A__b.json"],
    ["readme.md"],
    ["BACKUP-REPORT.JSON"]
  ])("rejects portable case-insensitive destination collisions: %s", (...sources) => {
    const root = rootFixture();
    for (const source of sources) workflow(root, source);
    const originalPlatform = Object.getOwnPropertyDescriptor(process, "platform")!;
    try {
      // Reproduce the non-Windows path used on case-insensitive macOS volumes.
      Object.defineProperty(process, "platform", { ...originalPlatform, value: "darwin" });
      expect(() => backupN8nWorkflows({ root, backupDir: "backups" })).toThrow(/collid/i);
      expect(fs.existsSync(path.join(root, "backups"))).toBe(false);
    } finally {
      Object.defineProperty(process, "platform", originalPlatform);
    }
  });

  it.each(["README.md", "backup-report.json"])("rejects a workflow colliding with generated metadata: %s", (name) => {
    const root = rootFixture();
    workflow(root, name);
    expect(() => backupN8nWorkflows({ root, backupDir: "backups" })).toThrow(/collid/i);
    expect(fs.existsSync(path.join(root, "backups"))).toBe(false);
  });

  it("rejects a directory alias pointing at the source root", () => {
    const root = rootFixture();
    workflow(root, "example.json");
    fs.symlinkSync(root, path.join(root, "alias"), process.platform === "win32" ? "junction" : "dir");
    expect(() => backupN8nWorkflows({ root, backupDir: "alias" })).toThrow(/root/i);
  });

  it("keeps source folders that merely share the output prefix", () => {
    const root = rootFixture();
    workflow(root, "backups-other/example.json");
    const result = backupN8nWorkflows({ root, backupDir: "backups" });
    expect(result.files.map((file) => file.source)).toEqual(["backups-other/example.json"]);
  });

  it("rejects flattened filename collisions before writing backups", () => {
    const root = rootFixture();
    workflow(root, "a/b.json", "nested-workflow");
    workflow(root, "a__b.json", "flat-workflow");
    expect(() => backupN8nWorkflows({ root, backupDir: "backups" })).toThrow(/collid/i);
    expect(fs.existsSync(path.join(root, "backups"))).toBe(false);
    expect(JSON.parse(fs.readFileSync(path.join(root, "a/b.json"), "utf8")).name).toBe("nested-workflow");
  });

  it("does not read generated custom backup files as new workflows", () => {
    const root = rootFixture();
    workflow(root, "workflows/example.json");
    const first = backupN8nWorkflows({ root, backupDir: "backups" });
    const second = backupN8nWorkflows({ root, backupDir: path.join(root, "backups") });
    expect(second.files).toEqual(first.files);
    expect(second.files).toHaveLength(1);
    expect(fs.readdirSync(path.join(root, "backups")).sort()).toEqual(["README.md", "backup-report.json", "workflows__example.json"]);
  });

  it("rejects the repository root as output without overwriting source metadata", () => {
    const root = rootFixture();
    workflow(root, "example.json");
    fs.writeFileSync(path.join(root, "README.md"), "original-readme\n");
    expect(() => backupN8nWorkflows({ root, backupDir: "." })).toThrow(/root/i);
    expect(fs.readFileSync(path.join(root, "README.md"), "utf8")).toBe("original-readme\n");
  });
});
