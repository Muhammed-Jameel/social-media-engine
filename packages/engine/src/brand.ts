import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { projectRoot } from "@aurendor/db/runtime";
import { parse as parseYaml } from "yaml";

const canonicalFiles = [
  "brand-core.yaml",
  "visual-system.yaml",
  "voice-guide-ar.yaml",
  "voice-guide-en.yaml",
  "audiences.yaml",
  "content-pillars.yaml",
  "services-products.yaml",
  "proof-library.yaml",
  "claims-policy.yaml",
  "terminology.yaml",
  "competitors.yaml",
  "creative-rubric.yaml",
  "social-objectives.yaml",
] as const;

export type CanonicalBrandFile = (typeof canonicalFiles)[number];
export type CanonicalBrandPack = Record<CanonicalBrandFile, Record<string, unknown>>;

interface ManifestSource {
  path: string;
  sourcePath: string;
  inferredAuthority: "canonical" | "high" | "medium" | "historical" | "reference";
  topics: string[];
  lastModified: string;
  sha256: string;
  type: string;
}

interface SourceManifest {
  generatedAt: string;
  sources: ManifestSource[];
}

export interface RetrievedEvidence {
  path: string;
  sourcePath: string;
  authority: ManifestSource["inferredAuthority"];
  topics: string[];
  sha256: string;
  score: number;
  lastModified: string;
}

let brandPackPromise: Promise<CanonicalBrandPack> | undefined;
let manifestPromise: Promise<SourceManifest> | undefined;

export async function loadCanonicalBrandPack(): Promise<CanonicalBrandPack> {
  brandPackPromise ??= Promise.all(
    canonicalFiles.map(async (file) => {
      const content = await readFile(join(projectRoot(), "data", "brand", file), "utf8");
      return [file, parseYaml(content) as Record<string, unknown>] as const;
    }),
  ).then((entries) => Object.fromEntries(entries) as CanonicalBrandPack);
  return brandPackPromise;
}

async function loadManifest(): Promise<SourceManifest> {
  manifestPromise ??= readFile(join(projectRoot(), "data", "brand", "source-manifest.json"), "utf8").then(
    (content) => JSON.parse(content) as SourceManifest,
  );
  return manifestPromise;
}

const authorityWeight: Record<ManifestSource["inferredAuthority"], number> = {
  canonical: 50,
  high: 35,
  medium: 20,
  reference: 10,
  historical: -25,
};

function tokens(value: string): string[] {
  return value
    .toLocaleLowerCase("en")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);
}

export async function searchBrandEvidence(query: string, limit = 8): Promise<RetrievedEvidence[]> {
  const manifest = await loadManifest();
  const queryTokens = tokens(query);
  const now = Date.now();
  return manifest.sources
    .filter((source) => source.type === "text" || source.type === "image" || source.type === "pdf")
    .map((source) => {
      const haystack = new Set(tokens(`${source.sourcePath} ${source.topics.join(" ")}`));
      const matches = queryTokens.filter((token) => haystack.has(token)).length;
      const recencyDays = Math.max(0, (now - new Date(source.lastModified).getTime()) / 86_400_000);
      const recencyScore = Math.max(0, 10 - Math.log10(recencyDays + 1) * 3);
      return {
        path: source.path,
        sourcePath: source.sourcePath,
        authority: source.inferredAuthority,
        topics: source.topics,
        sha256: source.sha256,
        lastModified: source.lastModified,
        score: authorityWeight[source.inferredAuthority] + matches * 12 + recencyScore,
      };
    })
    .filter((source) => source.score > 10 && (queryTokens.length === 0 || source.score > authorityWeight[source.authority] + 4))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function retrieveBrandContext(input: { query: string; language: "ar" | "en" | "bilingual"; limit?: number }) {
  const [pack, evidence] = await Promise.all([loadCanonicalBrandPack(), searchBrandEvidence(input.query, input.limit)]);
  return {
    core: pack["brand-core.yaml"],
    visual: pack["visual-system.yaml"],
    voice: input.language === "ar" ? pack["voice-guide-ar.yaml"] : input.language === "en" ? pack["voice-guide-en.yaml"] : {
      ar: pack["voice-guide-ar.yaml"],
      en: pack["voice-guide-en.yaml"],
    },
    audiences: pack["audiences.yaml"],
    claimsPolicy: pack["claims-policy.yaml"],
    terminology: pack["terminology.yaml"],
    evidence,
  };
}
