import { getDatabase, getRepository } from "@social-media-plugin/db/runtime";
import { isDemoMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const publishingFlagRequested = process.env.PRODUCTION_PUBLISHING_ENABLED === "true";
  const postizConfigured = Boolean(process.env.POSTIZ_API_URL?.trim() && process.env.POSTIZ_API_KEY?.trim());
  const environmentPauseRequested = process.env.SOCIAL_ENGINE_PAUSED === "true" || process.env.SOCIAL_MEDIA_ENGINE_PAUSED === "true" || process.env.SOCIAL_MEDIA_PLUGIN_ENGINE_PAUSED === "true";
  const environmentCreativeProductionPauseRequested = process.env.SOCIAL_ENGINE_CREATIVE_PRODUCTION_PAUSED === "true" || process.env.SOCIAL_MEDIA_CREATIVE_PRODUCTION_PAUSED === "true" || process.env.SOCIAL_MEDIA_PLUGIN_CREATIVE_PRODUCTION_PAUSED === "true";

  try {
    const database = await getDatabase();
    const [, settings] = await Promise.all([database.query("SELECT 1 AS healthy"), getRepository().then((repository) => repository.getSettings())]);
    const ownerAuthConfigured = Boolean(process.env.OWNER_EMAIL?.trim() && process.env.OWNER_PASSWORD_HASH?.startsWith("scrypt:") && (process.env.OWNER_SESSION_SECRET?.trim().length ?? 0) >= 32);
    const publishingEnabled = ownerAuthConfigured && publishingFlagRequested && process.env.DRY_RUN === "false" && !isDemoMode() && postizConfigured && !settings.dryRun && settings.productionPublishingEnabled && !settings.paused;
    return Response.json({
      status: "ok",
      service: "social-content-os",
      database: database.kind,
      mode: isDemoMode() ? "demo" : process.env.DRY_RUN === "false" ? "production-configuration-requested" : "offline-dry-run",
      publicationCapability: postizConfigured ? "postiz-supervised" : "dry-run-only",
      postizConfigured,
      publishingEnabled,
      ownerAuthConfigured,
      enginePaused: settings.paused,
      publishingFlagRequested,
      environmentPauseRequested,
      environmentCreativeProductionPauseRequested,
      checkedAt,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", service: "social-content-os", database: "unavailable", checkedAt }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
