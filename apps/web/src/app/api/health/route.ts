import { getDatabase } from "@aurendor/db/runtime";
import { isDemoMode } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const checkedAt = new Date().toISOString();
  const publishingFlagRequested = process.env.PRODUCTION_PUBLISHING_ENABLED === "true";
  try {
    const database = await getDatabase();
    await database.query("SELECT 1 AS healthy");
    return Response.json({
      status: "ok",
      service: "aurendor-content-os",
      database: database.kind,
      mode: isDemoMode() ? "demo" : process.env.DRY_RUN === "false" ? "production-configuration-requested" : "offline-dry-run",
      publicationCapability: "dry-run-only",
      publishingEnabled: false,
      publishingFlagRequested,
      environmentPauseRequested: process.env.AURENDOR_ENGINE_PAUSED === "true",
      checkedAt,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "degraded", service: "aurendor-content-os", database: "unavailable", checkedAt }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
