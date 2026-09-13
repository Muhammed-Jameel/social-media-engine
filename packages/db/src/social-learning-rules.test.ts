import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDatabase, type DatabaseClient, migrateDatabase } from "./client";
import { AURENDOR_ORGANIZATION_ID } from "./ids";
import { ContentOsRepository, type SocialLearningRuleFilter } from "./repository";
import { randomUUID } from "node:crypto";
import { seedCoreData } from "./seed";

describe("social learning rule persistence", () => {
  let database: DatabaseClient;

  beforeEach(async () => {
    database = await createDatabase({ memory: true });
    await migrateDatabase(database);
    await seedCoreData(database);
  });

  afterEach(async () => {
    await database.close();
  });

  it("stores feedback rules by precedence and scope", async () => {
    const repository = new ContentOsRepository(database);
    await repository.upsertSocialLearningRules([
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "fact",
        scope: { scopeLevel: "global" },
        key: "fact-caption-format",
        precedence: 20,
        strength: "MEDIUM",
        metadata: { source: "MODEL", reason: "Baseline quality policy.", tags: [], isArchived: false },
        fact: "Global Arabic captions should use concise hooks.",
        value: "concise-hook-required",
        confidence: 0.72,
        supportingStatementIds: [],
      },
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "fact",
        scope: { scopeLevel: "platform", platform: "instagram" },
        key: "fact-caption-format-instagram",
        precedence: 72,
        strength: "STRONG",
        metadata: { source: "MODEL", reason: "Platform-specific posting policy.", tags: [], isArchived: false },
        fact: "Instagram reels prefer explicit CTA in last line.",
        value: "instagram-reel-cta-required",
        confidence: 0.9,
        supportingStatementIds: [],
      },
    ]);

    const all = await repository.listSocialLearningRules({ category: "fact" });
    expect(all.map((rule) => rule.key)).toEqual(["fact-caption-format-instagram", "fact-caption-format"]);
    expect(all.every((rule) => rule.category === "fact")).toBe(true);
  });

  it("supports scope filtering before generation-time reads", async () => {
    const repository = new ContentOsRepository(database);
    await repository.upsertSocialLearningRules([
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "preference",
        scope: { scopeLevel: "platform", platform: "instagram" },
        key: "preference-1",
        precedence: 60,
        strength: "HARD",
        metadata: { source: "MODEL", reason: "Post format preference.", tags: [], isArchived: false },
        preferenceArea: "visual_style",
        value: { style: "minimal" },
        persistenceWindowDays: 60,
        decayRate: 0.25,
      },
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "preference",
        scope: { scopeLevel: "platform", platform: "linkedin" },
        key: "preference-2",
        precedence: 50,
        strength: "MEDIUM",
        metadata: { source: "MODEL", reason: "Cross-post fallback.", tags: [], isArchived: false },
        preferenceArea: "visual_style",
        value: { style: "editorial" },
        persistenceWindowDays: 30,
        decayRate: 0.15,
      },
    ]);

    const instagramFilters: SocialLearningRuleFilter = { category: "preference", platform: "instagram" };
    const instagramRules = await repository.listSocialLearningRules(instagramFilters);
    expect(instagramRules.length).toBe(1);
    expect(instagramRules[0]!.scope.platform).toBe("instagram");
  });

  it("removes obsolete rules safely", async () => {
    const repository = new ContentOsRepository(database);
    await repository.upsertSocialLearningRules([
      {
        ruleId: "11111111-1111-1111-1111-111111111111",
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "performance",
        scope: { scopeLevel: "campaign", campaignId: "11111111-1111-1111-1111-111111111111" },
        key: "performance-check",
        precedence: 33,
        strength: "HARD",
        metadata: { source: "MODEL", reason: "Campaign timing control.", tags: [], isArchived: false },
        metric: "watchTime",
        direction: "down",
        threshold: 10,
        actionVerb: "CAPTURE",
        evidenceWindowDays: 7,
        observedAt: "2026-09-09T08:00:00Z",
        confidence: 0.64,
      },
    ]);
    const deleted = await repository.deleteSocialLearningRules(["11111111-1111-1111-1111-111111111111"]);
    expect(deleted).toBe(1);
    const remaining = await repository.listSocialLearningRules({ category: "performance" });
    expect(remaining).toEqual([]);
  });

  it("excludes inactive rules unless explicitly requested", async () => {
    const repository = new ContentOsRepository(database);
    const futureIso = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const pastIso = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    await repository.upsertSocialLearningRules([
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "fact",
        scope: { scopeLevel: "global" },
        key: "preference-3",
        precedence: 55,
        strength: "WEAK",
        metadata: { source: "MODEL", reason: "Current valid rule.", tags: [], isArchived: false },
        fact: "Active fact rule stays visible while current.",
        value: "active-rule",
        confidence: 0.51,
        supportingStatementIds: [],
      },
      {
        ruleId: randomUUID(),
        organizationId: AURENDOR_ORGANIZATION_ID,
        brandVersion: "brand-final-2026.1",
        category: "fact",
        scope: { scopeLevel: "global" },
        key: "preference-4",
        precedence: 45,
        strength: "WEAK",
        metadata: { source: "MODEL", reason: "Future rule should be inactive by default.", tags: [], isArchived: false },
        fact: "Future fact rule should remain hidden until active.",
        value: "inactive-rule",
        confidence: 0.51,
        supportingStatementIds: [],
        activeFrom: futureIso,
        expiresAt: pastIso,
      },
    ]);
    await database.query(
      `INSERT INTO social_learning_rules (
         id, organization_id, rule_id, brand_version, category, scope, key, precedence,
         strength, metadata, active_from, expires_at, rule_data, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11, $12, $13::jsonb, now(), now())`,
      [
        `legacy:${randomUUID()}`,
        AURENDOR_ORGANIZATION_ID,
        "11111111-1111-1111-1111-111111111112",
        "brand-final-2026.1",
        "fact",
        JSON.stringify({ scopeLevel: "global" }),
        "legacy-metadata-rule",
        40,
        "WEAK",
        "{}",
        pastIso,
        null,
        JSON.stringify({
          organizationId: AURENDOR_ORGANIZATION_ID,
          ruleId: "11111111-1111-1111-1111-111111111112",
          brandVersion: "brand-final-2026.1",
          category: "fact",
          scope: { scopeLevel: "global" },
          key: "legacy-metadata-rule",
          precedence: 40,
          strength: "WEAK",
          metadata: {},
          fact: "Legacy row should still parse.",
          value: "legacy-rule",
          confidence: 0.49,
          supportingStatementIds: [],
        }),
      ],
    );

    const activeOnly = await repository.listSocialLearningRules({ category: "fact" });
    expect(activeOnly.length).toBe(1);
    expect(activeOnly.map((rule) => rule.key)).toContain("preference-3");
    expect(activeOnly.map((rule) => rule.key)).not.toContain("preference-4");

    const all = await repository.listSocialLearningRules({ category: "fact", includeInactive: true });
    expect(all.length).toBe(3);
    expect(all.map((rule) => rule.key)).toContain("preference-4");
    expect(all.map((rule) => rule.key)).toContain("legacy-metadata-rule");
  });
});
