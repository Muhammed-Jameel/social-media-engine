import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat } from "node:fs/promises";
import { basename, extname, join, relative, resolve } from "node:path";
import { promisify } from "node:util";
import type { DatabaseClient } from "./client";
import { projectRoot } from "./client";
import { AURENDOR_ORGANIZATION_ID, SEPTEMBER_STRATEGY_ID } from "./ids";

const runFile = promisify(execFile);

interface LegacyPost {
  id: string;
  publish_at_local: string;
  platforms: string[];
  format: string;
  track: string;
  note: string;
  assets: string[];
  status: string;
  permalink: string | null;
  title: string;
}

export interface ImportSummary {
  items: number;
  assets: number;
  repairs: Array<{ item: string; referenced: string; resolved: string }>;
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function normalizeLegacyDate(value: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+Asia\/Baghdad$/.exec(value);
  if (!match?.[1] || !match[2]) throw new Error(`Unsupported legacy schedule: ${value}`);
  return new Date(`${match[1]}T${match[2]}:00+03:00`).toISOString();
}

function mapFormat(value: string): string {
  if (value.startsWith("carousel")) return "carousel";
  if (value.includes("story")) return "story";
  if (value.includes("reel")) return "reel";
  if (value.includes("video")) return "video";
  return "single_image";
}

function mapTrack(track: string): { objective: string; audience: string; pillar: string; funnel: string; tension: string; shift: string } {
  const normalized = track.toLowerCase();
  if (normalized.includes("bunyan") || normalized.includes("build")) {
    return {
      objective: "Show how Aurendor Build creates clearer construction operations.",
      audience: "Construction companies and engineering offices",
      pillar: "product-bunyan",
      funnel: "consideration",
      tension: "Project information, payments, and follow-up are fragmented across people and channels.",
      shift: "A structured system can make project control visible and professional.",
    };
  }
  if (normalized.includes("brand")) {
    return {
      objective: "Establish Aurendor as the builder of intelligent operational infrastructure.",
      audience: "Iraqi business and operations leaders",
      pillar: "brand-and-founder",
      funnel: "awareness",
      tension: "AI is often presented as a demo rather than dependable operating infrastructure.",
      shift: "Aurendor builds practical systems where intelligence and automation become operational.",
    };
  }
  if (normalized.includes("proof")) {
    return {
      objective: "Build trust through concrete systems, screens, and process evidence.",
      audience: "Business owners evaluating technology partners",
      pillar: "proof-and-systems",
      funnel: "consideration",
      tension: "Technology claims are difficult to trust without visible proof.",
      shift: "Aurendor shows working systems and the operational thinking behind them.",
    };
  }
  return {
    objective: "Teach a practical applied-AI or automation insight.",
    audience: "Iraqi business owners and operations leaders",
    pillar: "operational-education",
    funnel: "awareness",
    tension: "Repeated manual work consumes attention but the automation path is unclear.",
    shift: "A useful workflow can be structured and automated without replacing the whole operation.",
  };
}

function captionFrom(markdown: string): string {
  const marker = "\n---\n";
  const index = markdown.indexOf(marker);
  return (index >= 0 ? markdown.slice(index + marker.length) : markdown).trim();
}

async function resolveAsset(folder: string, referenced: string): Promise<{ path: string; repaired: boolean }> {
  const entries = await readdir(folder);
  if (entries.includes(referenced)) return { path: join(folder, referenced), repaired: false };
  const normalizedReference = referenced.replace(/^\d+_/, "");
  const candidate = entries.find((entry) => entry.replace(/^\d+_/, "") === normalizedReference);
  if (!candidate) throw new Error(`Missing asset ${referenced} in ${folder}`);
  return { path: join(folder, candidate), repaired: candidate !== referenced };
}

async function dimensions(path: string, buffer: Buffer): Promise<{ width: number; height: number }> {
  const extension = extname(path).toLowerCase();
  if (extension === ".png" && buffer.length >= 24 && buffer.toString("ascii", 1, 4) === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if ([".mp4", ".mov", ".webm"].includes(extension)) {
    const { stdout } = await runFile("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "csv=s=x:p=0",
      path,
    ]);
    const [width, height] = stdout.trim().split("x").map(Number);
    if (!width || !height) throw new Error(`Unable to read dimensions for ${path}`);
    return { width, height };
  }
  throw new Error(`Unsupported imported asset type: ${path}`);
}

function mimeType(path: string): string {
  const extension = extname(path).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".mp4") return "video/mp4";
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  return "application/octet-stream";
}

function qaFlagsFor(id: string): string[] {
  if (id === "W3-P5") return [
    "HARD_FAIL: icon overlaps Arabic text",
    "Before/after chips straddle card borders",
    "Arabic copy contains orphan lines",
  ];
  if (id === "W4-P6-brand") return [
    "Arabic brand/year chip lacks spacing",
    "Generic oversized layers icon weakens brand-manifesto concept",
  ];
  if (id === "W1-P1") return ["Spot-check numbered tip slides for uncomposed dead space and clipped ghost numerals"];
  return ["Imported asset set was not exhaustively visually reviewed"];
}

export async function importExistingContent(
  database: DatabaseClient,
  sourceRoot = resolve(process.env.AURENDOR_SOURCE_ROOT ?? join(projectRoot(), "..")),
): Promise<ImportSummary> {
  const queueRoot = join(sourceRoot, "content-engine", "READY-TO-PUBLISH");
  const folders = (await readdir(queueRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(queueRoot, entry.name))
    .sort();
  const outputRoot = join(projectRoot(), "apps", "web", "public", "demo-content");
  await mkdir(outputRoot, { recursive: true });
  const summary: ImportSummary = { items: 0, assets: 0, repairs: [] };

  for (const folder of folders) {
    const postPath = join(folder, "post.json");
    try {
      await stat(postPath);
    } catch {
      continue;
    }
    const post = JSON.parse(await readFile(postPath, "utf8")) as LegacyPost;
    const contentId = stableId("content", post.id);
    const briefId = stableId("brief", post.id);
    const traceId = randomUUID();
    const track = mapTrack(post.track);
    const qaFlags = qaFlagsFor(post.id);
    const riskLevel = post.id === "W3-P5" ? "high" : qaFlags.length > 0 ? "medium" : "low";
    const scheduledAt = normalizeLegacyDate(post.publish_at_local);
    const platformValues = post.platforms.filter((platform) => ["instagram", "facebook", "linkedin", "tiktok", "youtube", "x"].includes(platform));
    const sourceReference = {
      sourceId: stableId("source", postPath),
      path: postPath,
      title: `${post.id} legacy post manifest`,
      authority: "medium",
      retrievedAt: new Date().toISOString(),
    };
    const envelope = {
      schemaVersion: "1.0.0",
      modelVersion: null,
      promptVersion: "legacy-import-v1",
      skillVersions: ["aurendor-brand-compliance@1.0.0"],
      templateVersion: "legacy-render-unknown",
      traceId,
      createdAt: new Date().toISOString(),
      sources: [sourceReference],
    };

    await database.query(
      `INSERT INTO content_items (
         id, organization_id, strategy_id, external_key, month, title, strategic_objective, audience,
         funnel_stage, content_pillar, tension, key_message, perception_shift, format, platforms, language,
         hook_hypothesis, creative_hypothesis, proof_requirements, cta, kpi_hierarchy, scheduled_at, timezone,
         status, approval_class, risk_level, risk_reasons, experiment_id, related_prior_post_ids,
         anti_repetition_score, is_demo, qa_flags, source_path, artifact_envelope
       ) VALUES (
         $1, $2, $3, $4, '2026-09', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb,
         'ar', $15, $16, $17::jsonb, $18, $19::jsonb, $20, 'Asia/Baghdad', 'NEEDS_REVIEW',
         $21, $22, $23::jsonb, NULL, '[]'::jsonb, 80, true, $24::jsonb, $25, $26::jsonb
       ) ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, platforms = EXCLUDED.platforms, scheduled_at = EXCLUDED.scheduled_at,
         risk_level = EXCLUDED.risk_level, qa_flags = EXCLUDED.qa_flags, updated_at = now()`,
      [
        contentId,
        AURENDOR_ORGANIZATION_ID,
        SEPTEMBER_STRATEGY_ID,
        post.id,
        post.title,
        track.objective,
        track.audience,
        track.funnel,
        track.pillar,
        track.tension,
        post.title,
        track.shift,
        mapFormat(post.format),
        json(platformValues),
        post.title,
        `Test a ${post.format} execution grounded in the ${post.track} track.`,
        json([]),
        "Save, share, or contact Aurendor when the workflow is relevant.",
        json(["saves", "shares", "profile_visits", "qualified_messages"]),
        scheduledAt,
        post.id === "W3-P5" ? "ITEM_APPROVAL" : "MONTHLY_APPROVAL",
        riskLevel,
        json(qaFlags),
        json(qaFlags),
        postPath,
        json(envelope),
      ],
    );
    await database.query(
      `INSERT INTO design_briefs (id, content_item_id, brief, artifact_envelope)
       VALUES ($1, $2, $3::jsonb, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET brief = EXCLUDED.brief`,
      [
        briefId,
        contentId,
        json({
          communicationGoal: track.objective,
          visualConcept: post.note || post.title,
          layoutFamily: mapFormat(post.format),
          palette: ["#003F35", "#0EDB23", "#77FF70", "#F4F8F5"],
          provenance: "Imported render; source compositor version unavailable.",
        }),
        json(envelope),
      ],
    );

    const captionPath = join(folder, "CAPTION.md");
    let caption = post.title;
    try {
      caption = captionFrom(await readFile(captionPath, "utf8"));
    } catch {
      // A missing caption remains reviewable with the title and a QA flag.
    }
    const hashtags = caption.match(/#[^\s#]+/g) ?? [];
    for (const platform of platformValues) {
      const copyId = stableId("copy", `${post.id}:${platform}`);
      await database.query(
        `INSERT INTO copy_variants (
           id, content_item_id, platform, language, angle, on_design_copy, caption, alt_text,
           hashtags, factual_claims, editorial_score, selected, artifact_envelope
         ) VALUES ($1, $2, $3, 'ar', $4, $5::jsonb, $6, $7, $8::jsonb, '[]'::jsonb, 78, true, $9::jsonb)
         ON CONFLICT (id) DO UPDATE SET caption = EXCLUDED.caption, hashtags = EXCLUDED.hashtags`,
        [copyId, contentId, platform, post.track, json([post.title]), caption, `AURENDOR social creative: ${post.title}`, json(hashtags), json(envelope)],
      );
    }

    const destinationFolder = join(outputRoot, post.id);
    await mkdir(destinationFolder, { recursive: true });
    for (const [sequence, referenced] of post.assets.entries()) {
      const resolvedAsset = await resolveAsset(folder, referenced);
      const buffer = await readFile(resolvedAsset.path);
      const hash = createHash("sha256").update(buffer).digest("hex");
      const size = await stat(resolvedAsset.path);
      const mediaDimensions = await dimensions(resolvedAsset.path, buffer);
      const outputName = basename(resolvedAsset.path);
      const outputPath = join(destinationFolder, outputName);
      await copyFile(resolvedAsset.path, outputPath);
      const assetId = stableId("asset", hash);
      const renderId = stableId("render", `${post.id}:${hash}:${sequence}`);
      await database.query(
        `INSERT INTO source_assets (
           id, organization_id, source_path, storage_path, media_type, sha256, width, height, size_bytes, license_status, metadata
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'OWNED', $10::jsonb)
         ON CONFLICT (id) DO UPDATE SET source_path = EXCLUDED.source_path, storage_path = EXCLUDED.storage_path`,
        [
          assetId,
          AURENDOR_ORGANIZATION_ID,
          resolvedAsset.path,
          relative(projectRoot(), outputPath),
          mimeType(resolvedAsset.path).startsWith("video") ? "video" : "image",
          hash,
          mediaDimensions.width,
          mediaDimensions.height,
          size.size,
          json({ importedFrom: folder, referencedName: referenced, repaired: resolvedAsset.repaired }),
        ],
      );
      await database.query(
        `INSERT INTO rendered_assets (
           id, content_item_id, design_brief_id, provider, provider_draft_id, editable_url, storage_path,
           public_url, mime_type, width, height, sha256, sequence, source_path, license_status, artifact_envelope
         ) VALUES ($1, $2, $3, 'imported', NULL, NULL, $4, $5, $6, $7, $8, $9, $10, $11, 'OWNED', $12::jsonb)
         ON CONFLICT (id) DO UPDATE SET storage_path = EXCLUDED.storage_path, public_url = EXCLUDED.public_url`,
        [
          renderId,
          contentId,
          briefId,
          relative(projectRoot(), outputPath),
          `/demo-content/${encodeURIComponent(post.id)}/${encodeURIComponent(outputName)}`,
          mimeType(resolvedAsset.path),
          mediaDimensions.width,
          mediaDimensions.height,
          hash,
          sequence,
          resolvedAsset.path,
          json(envelope),
        ],
      );
      if (resolvedAsset.repaired) {
        summary.repairs.push({ item: post.id, referenced, resolved: basename(resolvedAsset.path) });
      }
      summary.assets += 1;
    }
    summary.items += 1;
  }

  await database.query(
    `INSERT INTO audit_logs (id, organization_id, actor_id, action, entity_type, entity_id, previous_state, new_state, reason, trace_id)
     VALUES ($1, $2, 'system-importer', 'IMPORT_LEGACY_QUEUE', 'monthly_strategy', $3, NULL, $4::jsonb, $5, $6)
     ON CONFLICT (id) DO UPDATE SET new_state = EXCLUDED.new_state`,
    [
      "audit-legacy-import-2026-09",
      AURENDOR_ORGANIZATION_ID,
      SEPTEMBER_STRATEGY_ID,
      json(summary),
      "Imported read-only September content evidence with explicit filename reconciliation and review status.",
      randomUUID(),
    ],
  );

  return summary;
}
