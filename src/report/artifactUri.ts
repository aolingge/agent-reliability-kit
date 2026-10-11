import path from "node:path";
import { pathToFileURL } from "node:url";

/** SARIF locations are URI references, not raw filesystem paths. */
export function artifactUri(file: string): string {
  if (path.isAbsolute(file)) return pathToFileURL(file).href;
  return file.replaceAll("\\", "/").split("/").map(encodeURIComponent).join("/");
}
