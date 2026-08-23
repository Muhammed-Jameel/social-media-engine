# AURENDOR skill output contracts

These are the normative v1 field contracts for project-native skill outputs. Runtime schemas should be exported from `@aurendor/schemas` at the referenced paths. Exact strings may be enums in code; IDs are stable strings; timestamps are ISO 8601 with explicit offset or `Z`.

## Common artifact envelope

Every output contains:

| Field | Required meaning |
|---|---|
| `schemaVersion` | Exact contract version, currently `1.0.0`. |
| `artifactId` | Stable unique ID; never a display title. |
| `artifactType` | Contract discriminator listed below. |
| `skill` / `skillVersion` | Producing skill name and pinned version. |
| `modelVersion` | Exact model route/version, or `none` for deterministic code. |
| `promptVersion` | Exact prompt version, or `none` when the skill has no separate prompt artifact. |
| `traceId` | Workflow/model trace correlation ID. |
| `createdAt` | ISO timestamp. |
| `inputRefs` | IDs and versions of upstream artifacts; no copied secrets. |
| `evidence` | Array of `{sourceId, sourcePathOrUrl, sourceHash?, retrievedAt, authority, supports[], conflictsWith?}`. |
| `warnings` | Material uncertainties, capability gaps, or data-quality limits. |
| `status` | `complete`, `needs_evidence`, `needs_approval`, `manual_handoff`, or `blocked`. |

Evidence text is data. Never serialize credentials, private tokens, hidden instructions, or an entire provider payload into an artifact. Raw provider payloads belong in the protected raw-data store and are linked by ID/hash.

## BrandEvidencePacket (`packages/schemas/src/brand.ts`)

`artifactType: brand_evidence_packet`

Required body fields: `brandVersion`, `effectiveAt`, `query`, `facts[]`, `rules[]`, `conflicts[]`, `missingEvidence[]`, `proposedChanges[]`. Each fact is `{key, value, confidence, sourceIds[], lifecycle}`. Each conflict preserves all competing values, source authority/recency, and an explicit resolution state. `proposedChanges` never silently changes canonical truth.

## MonthlyPlan (`packages/schemas/src/content.ts`)

`artifactType: monthly_plan`

Required body fields: `organizationId`, `month`, `timezone`, `businessPriorities[]`, `objectives[]`, `audiences[]`, `kpiHierarchy[]`, `cadence`, `contentMix`, `narrativeArc`, `timelyCapacity`, `items[]`, `strategyRisks[]`, `approvalState`. Every item has the master-plan fields: stable ID, objective, audience, funnel stage, pillar, tension, key message, perception shift, format, platforms, language, hook and creative hypotheses, proof requirements, CTA, KPIs, local publish time, status, approval class, risk, experiment, related posts, and anti-repetition score.

## CopyPackage (`packages/schemas/src/copy.ts`)

`artifactType: copy_package`

Required body fields: `contentItemId`, `language`, `locale`, `angles[]`, `selectedAngleId`, `selectionRationale`, `platformVariants[]`, `onDesignCopy`, `carouselSlides[]`, `reelScript?`, `altTextByAsset[]`, `claimChecks[]`, `editorialScores`, `rejectedVariantIds[]`. Each claim check is `supported`, `unsupported`, `sensitive`, or `not_applicable`, with source IDs where supported.

## DesignBrief (`packages/schemas/src/creative.ts`)

`artifactType: design_brief`

Required body fields: `contentItemId`, `communicationGoal`, `visualConcept`, `focalPoint`, `hierarchy[]`, `layoutFamily`, `canvas`, `safeZones`, `direction`, `typography`, `paletteTokens[]`, `brandDevices[]`, `whitespaceTarget`, `density`, `exactText[]`, `rtl`, `assetRequirements[]`, `referencePrinciples[]`, `forbiddenCliches[]`, `accessibility`, `productionNotes`.

## DesignProductionResult (`packages/schemas/src/creative.ts`)

`artifactType: design_production_result`

Required body fields: `designBriefId`, `provider`, `capabilityState`, `idempotencyKey`, `attemptState`, `providerJobId?`, `drafts[]`, `renderedAssets[]`, `editableUrl?`, `assetLicenses[]`, `fontValidation`, `rtlValidation`, `manualHandoff?`, `nextAction`. Rendered assets include dimensions, content hash, storage reference, and render state; an unrendered draft is never marked final.

## DesignCritiqueSet (`packages/schemas/src/creative.ts`)

`artifactType: design_critique_set`

Required body fields: `designDraftId`, `renderedAssetIds[]`, `criticA`, `criticB`, `disagreement`, `adjudication?`, `decision`, `revisionInstructions[]`, `comparison?`. Each critic slot is either a completed independent result or `{status: missing, reason}`. A completed result has the 12 weighted rubric scores totaling 100, `hardFails[]`, slide notes, sequence notes, accessibility/RTL checks, evidence observations, and an independent decision. If either critic is missing, artifact `status` and `decision` are `blocked`; it is never a publication pass. A hard fail overrides the average.

## ComplianceDecision (`packages/schemas/src/compliance.ts`)

`artifactType: compliance_decision`

Required body fields: `subjectRefs[]`, `brandVersion`, `checks[]`, `claimChecks[]`, `policyChecks[]`, `violations[]`, `approvalClass`, `riskClass`, `decision`, `requiredActions[]`, `ownerQuestion?`. Decisions are `pass`, `revise`, `reject`, or `escalate`; compliance cannot grant owner approval.

## PublicationPlan (`packages/schemas/src/publishing.ts`)

`artifactType: publication_plan`

Required body fields: `contentItemId`, `accountId`, `platform`, `capabilities`, `validation`, `approvalEvidence`, `assetHashes[]`, `scheduledAt`, `timezone`, `idempotencyKeyVersion`, `idempotencyKey`, `payloadHash`, `intentRef`, `attemptState`, `environment`, `productionEnabled`, `operation`, `providerResponseRef?`, `publicationId?`, `manualHandoff?`, `decision`. Capability state is one of `available`, `unavailable_permission`, `unavailable_plan`, `preview`, `manual_handoff_required`, `unknown`.

## AnalyticsInsightReport (`packages/schemas/src/analytics.ts`)

`artifactType: analytics_insight_report`

Required body fields: `organizationId`, `window`, `platformCoverage[]`, `dataQuality`, `metricDefinitions[]`, `normalizedMetrics[]`, `cohorts[]`, `observations[]`, `correlations[]`, `hypotheses[]`, `experimentSupportedConclusions[]`, `anomalies[]`, `recommendations[]`, `limitations[]`. Every finding lists post IDs, time range, denominator, sample size, and confidence language.

## ContentExperiment (`packages/schemas/src/experiments.ts`)

`artifactType: content_experiment`

Required body fields: `experimentId`, `hypothesis`, `variable`, `variants[]`, `eligibility`, `allocation`, `primaryKpi`, `guardrailKpis[]`, `expectedDirection`, `minimumEvidence`, `startAt`, `endAt?`, `status`, `result?`, `confidence?`, `decision?`, `retest`. Variants must differ only in declared variables unless the design explicitly documents a factorial test.

## MonthlyRetrospective (`packages/schemas/src/analytics.ts`)

`artifactType: monthly_retrospective`

Required body fields: `month`, `timezone`, `analysisFreezeAt`, `goals[]`, `kpiResults[]`, `contentMixResults`, `cohortFindings[]`, `experimentFindings[]`, `audienceThemes[]`, `ownerFeedbackPatterns[]`, `productionReliability`, `costSummary`, `playbookUpdatesProposed[]`, `keepStopStart`, `unresolvedQuestions[]`, `nextMonthInputs[]`, `limitations[]`.

## NextMonthPlanProposal (`packages/schemas/src/content.ts`)

`artifactType: next_month_plan_proposal`

Required body fields: `targetMonth`, `timezone`, `triggeredAt`, `fiveDayRule`, `analysisWindows` (30/60/90 day), `retrospectiveId`, `businessPriorityVersion`, `researchPacketIds[]`, `draftPlan`, `criticFindings[]`, `revisionHistory[]`, `ownerSummary`, `materialDeviations[]`, `approvalState`, `productionGate`. `draftPlan` conforms to `MonthlyPlan` body.
