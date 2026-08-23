import { readdir, readFile, stat } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

type SecretRule = {
  id: string;
  pattern: RegExp;
};

const root = resolve(process.cwd());
const ignoredDirectories = new Set([
  ".data",
  ".git",
  ".next",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const ignoredFiles = new Set(["pnpm-lock.yaml"]);
const binaryExtensions = new Set([
  ".avif",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".mov",
  ".mp4",
  ".otf",
  ".pdf",
  ".png",
  ".ttf",
  ".webm",
  ".woff",
  ".woff2",
  ".zip",
]);

// High-confidence formats only. The match itself is intentionally never printed.
const rules: SecretRule[] = [
  { id: "openai-api-key", pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { id: "google-api-key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { id: "github-token", pattern: /\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{30,}\b/g },
  { id: "slack-token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { id: "aws-access-key", pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { id: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

function isLocalSecretFile(name: string): boolean {
  return name === ".env" || name === ".env.local" || /^\.env\..*\.local$/.test(name);
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (
      entry.isFile() &&
      !ignoredFiles.has(entry.name) &&
      (process.env.CI === "true" || !isLocalSecretFile(entry.name)) &&
      !binaryExtensions.has(extname(entry.name).toLowerCase())
    ) {
      files.push(path);
    }
  }
  return files;
}

const findings: Array<{ path: string; line: number; rule: string }> = [];
for (const path of await collectFiles(root)) {
  const metadata = await stat(path);
  if (metadata.size > 5_000_000) continue;
  const content = await readFile(path, "utf8");
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(lines[index] ?? "")) {
        findings.push({ path: relative(root, path), line: index + 1, rule: rule.id });
      }
    }
  }
}

if (findings.length > 0) {
  console.error("Potential committed secrets detected. Values are intentionally redacted:");
  for (const finding of findings) console.error(`- ${finding.path}:${finding.line} [${finding.rule}]`);
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed (${rules.length} high-confidence rules; generated, binary, dependency, and local database paths excluded).`);
}
