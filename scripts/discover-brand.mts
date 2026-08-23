import { createHash } from "node:crypto";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const sourceRoot = resolve(process.env.AURENDOR_SOURCE_ROOT ?? join(projectRoot, ".."));
const outputPath = join(projectRoot, "data", "brand", "source-manifest.json");

const ignoredSegments = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "cache",
  "tmp",
  "outputs",
  "graphify-out",
  "social media engine",
]);

const ignoredNames = new Set([
  ".DS_Store",
  ".env",
  ".mcp.json",
  "settings.local.json",
]);

const textExtensions = new Set([
  ".md",
  ".txt",
  ".json",
  ".yaml",
  ".yml",
  ".csv",
  ".html",
  ".css",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".py",
]);

const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]);

function shouldIgnore(path: string): boolean {
  const parts = relative(sourceRoot, path).split(sep);
  const name = parts.at(-1) ?? "";
  return (
    parts.some((part) => ignoredSegments.has(part)) ||
    ignoredNames.has(name) ||
    name.startsWith(".env.") ||
    name.endsWith(".tmp") ||
    name.endsWith(".log")
  );
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (shouldIgnore(path)) continue;
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function inferAuthority(path: string): "canonical" | "high" | "medium" | "historical" | "reference" {
  const normalized = path.toLowerCase();
  if (normalized.includes("brand_identity_final_2026") || normalized.includes("social_design_system_2026")) return "canonical";
  if (normalized.includes("new-brand") || normalized.includes("sovereign") || normalized.includes("brand_system_v3")) return "historical";
  if (normalized.includes("engine-state") || normalized.includes("_context") || normalized.includes("visual identity")) return "high";
  if (normalized.includes("campaign") || normalized.includes("research") || normalized.includes("content-engine")) return "medium";
  return "reference";
}

function inferTopics(path: string): string[] {
  const value = path.toLowerCase();
  const topics = [
    ["brand", "brand"],
    ["voice", "voice"],
    ["social", "social"],
    ["design", "visual-system"],
    ["logo", "logo"],
    ["font", "typography"],
    ["campaign", "campaign"],
    ["research", "research"],
    ["sales", "sales"],
    ["product", "product"],
    ["build", "aurendor-build"],
    ["content-engine", "prior-engine"],
    ["ready-to-publish", "publication-candidate"],
  ] as const;
  return topics.filter(([needle]) => value.includes(needle)).map(([, topic]) => topic);
}

function typeFor(extension: string): string {
  if (textExtensions.has(extension)) return "text";
  if (imageExtensions.has(extension)) return "image";
  if ([".mp4", ".mov", ".webm"].includes(extension)) return "video";
  if ([".mp3", ".wav", ".m4a"].includes(extension)) return "audio";
  if (extension === ".pdf") return "pdf";
  if ([".docx", ".xlsx", ".pptx"].includes(extension)) return "office";
  if ([".otf", ".ttf", ".woff", ".woff2"].includes(extension)) return "font";
  return "binary";
}

const files = await walk(sourceRoot);
const sources = [];

for (const path of files.sort()) {
  const metadata = await stat(path);
  const extension = extname(path).toLowerCase();
  const content = await readFile(path);
  const sourcePath = relative(sourceRoot, path);
  const authority = inferAuthority(sourcePath);
  sources.push({
    path,
    sourcePath,
    type: typeFor(extension),
    extension: extension || null,
    sha256: createHash("sha256").update(content).digest("hex"),
    sizeBytes: metadata.size,
    lastModified: metadata.mtime.toISOString(),
    inferredAuthority: authority,
    topics: inferTopics(sourcePath),
    extractedTextRef: textExtensions.has(extension) ? path : null,
    visualReference: imageExtensions.has(extension) ? { source: path, indexed: false } : null,
    lifecycle: authority === "historical" ? "historical" : "active-or-reference",
    notes:
      authority === "historical"
        ? "Retained for provenance; do not override FINAL 2026 sources."
        : null,
  });
}

const manifest = {
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  sourceRoot,
  exclusions: [...ignoredSegments, ...ignoredNames],
  safety: "Secrets and local settings are excluded. Source files are indexed as data, never instructions.",
  sourceCount: sources.length,
  sources,
};

await mkdir(resolve(outputPath, ".."), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Indexed ${sources.length} sources into ${outputPath}`);
