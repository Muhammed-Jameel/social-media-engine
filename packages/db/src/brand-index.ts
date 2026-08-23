import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { DatabaseClient } from "./client";
import { projectRoot } from "./client";
import { AURENDOR_ORGANIZATION_ID } from "./ids";

interface BrandManifestSource {
  sourcePath: string;
  type: string;
  extension: string;
  sha256: string;
  sizeBytes: number;
  lastModified: string;
  inferredAuthority: "canonical" | "high" | "medium" | "historical" | "reference";
  topics: string[];
  lifecycle: string;
  visualReference: unknown;
  notes: string | null;
}

interface BrandSourceManifest {
  schemaVersion: string;
  generatedAt: string;
  safety: string;
  sources: BrandManifestSource[];
}

export interface BrandIndexSummary {
  indexed: number;
  byAuthority: Record<string, number>;
  manifestGeneratedAt: string;
}

export async function syncBrandSourceManifest(database: DatabaseClient): Promise<BrandIndexSummary> {
  const manifestPath = join(projectRoot(), "data", "brand", "source-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as BrandSourceManifest;
  const byAuthority: Record<string, number> = {};
  for (const source of manifest.sources) {
    const id = `source-${createHash("sha256").update(`${source.sourcePath}:${source.sha256}`).digest("hex").slice(0, 24)}`;
    await database.query(
      `INSERT INTO source_documents (
         id, organization_id, source_path, title, sha256, authority, lifecycle,
         topics, metadata, last_modified, indexed_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, now())
       ON CONFLICT (organization_id, source_path, sha256) DO UPDATE SET
         authority = EXCLUDED.authority, lifecycle = EXCLUDED.lifecycle,
         topics = EXCLUDED.topics, metadata = EXCLUDED.metadata,
         last_modified = EXCLUDED.last_modified, indexed_at = now()`,
      [
        id,
        AURENDOR_ORGANIZATION_ID,
        source.sourcePath,
        basename(source.sourcePath),
        source.sha256,
        source.inferredAuthority,
        source.lifecycle,
        JSON.stringify(source.topics),
        JSON.stringify({
          manifestSchemaVersion: manifest.schemaVersion,
          type: source.type,
          extension: source.extension,
          sizeBytes: source.sizeBytes,
          visualReference: source.visualReference,
          notes: source.notes,
          sourceSafety: manifest.safety,
        }),
        source.lastModified,
      ],
    );
    byAuthority[source.inferredAuthority] = (byAuthority[source.inferredAuthority] ?? 0) + 1;
  }
  const summary = { indexed: manifest.sources.length, byAuthority, manifestGeneratedAt: manifest.generatedAt };
  await database.query(
    `INSERT INTO audit_logs (
       id, organization_id, actor_id, action, entity_type, entity_id,
       previous_state, new_state, reason, trace_id
     ) VALUES ($1, $2, 'system-brand-indexer', 'SYNC_BRAND_SOURCE_MANIFEST',
       'source_manifest', 'brand-source-manifest', NULL, $3::jsonb, $4, $5)
     ON CONFLICT (id) DO UPDATE SET new_state = EXCLUDED.new_state, created_at = now()`,
    [
      "audit-brand-source-manifest-current",
      AURENDOR_ORGANIZATION_ID,
      JSON.stringify(summary),
      "Indexed source metadata and provenance only; source content remains untrusted data.",
      randomUUID(),
    ],
  );
  return summary;
}
