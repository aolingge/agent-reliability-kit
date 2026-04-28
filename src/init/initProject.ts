import fs from "node:fs";
import path from "node:path";
import { INIT_TEMPLATES } from "./templates.js";
import { resolveRoot } from "../core/files.js";

export interface InitResult {
  created: string[];
  skipped: string[];
}

export function initProject(rootInput: string, force = false): InitResult {
  const root = resolveRoot(rootInput);
  const created: string[] = [];
  const skipped: string[] = [];

  for (const template of INIT_TEMPLATES) {
    const target = path.join(root, template.path);
    if (fs.existsSync(target) && !force) {
      skipped.push(template.path);
      continue;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, template.content, "utf8");
    created.push(template.path);
  }

  return { created, skipped };
}

