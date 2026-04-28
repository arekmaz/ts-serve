import { resolve, relative } from "node:path";

export function isSafePath(root: string, filePath: string): boolean {
  const rel = relative(root, filePath);
  return !rel.startsWith("..") && resolve(root, rel) === filePath;
}
