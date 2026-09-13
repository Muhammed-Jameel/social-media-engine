# Social Media Engine Gaps & P-level Remediations

## Audit baseline

This file captures prioritized gaps after Stage-1 audit of the SOCIAL_MEDIA_PLUGIN Social Media Engine implementation.

## P0 (blocks safe core operation/security)

1. **No verified production publishing path**
   - **Observed**: publishing controls and Postiz integration are implemented, but live external account binding, post dispatch, and canary validation are not yet established in the audited snapshot.
   - **Impact**: Engine cannot be claimed as production-ready or portable plugin behavior for external tenants.
   - **Fix**: finalize provider connection and staged canary flow behind explicit manual-gating; document and run account-specific verification for each provider used.

2. **Analytics source is not end-to-end verified as live/social**
   - **Observed**: analytic retrieval can be synthetic/normalized and is not fully guaranteed to map to live platform metrics.
   - **Impact**: reporting, optimization, and feedback loops can become incorrect; downstream strategy decisions become unreliable.
   - **Fix**: implement direct provider analytics ingestion or canonical Postiz-to-provider reconciliation and wire source attribution per metric.

3. **Remaining portability residues in historical artifacts**
   - **Observed**: runtime docs/UI now use plugin-local start paths, while historical proof/artifact JSON and scripts still contain absolute paths to source trees.
   - **Impact**: plugin bootstrap usability is improved, but legacy replays of those artifacts can still fail outside the copied snapshot.
   - **Fix**: re-emit historical proof artifacts from the plugin environment using local-root paths or parameterized render scripts before production packaging.

## P1 (important functionality gaps)

1. **Feedback-to-rule learning is incomplete**
   - **Observed**: revision and approval flows are present, but deterministic scope/type-based rule persistence is not fully evidenced as a first-class system.
   - **Fix**: persist feedback as scoped rules (post/campaign/type/platform/language/global) and apply precedence hierarchy before generation.

2. **Unified inbox/reply capabilities are not fully confirmed per network**
   - **Observed**: stage for comments/replies/mentions exists conceptually, but per-network support and reply actionability were not fully proven.
   - **Fix**: explicit capability matrix and per-network feature handlers with safe fallback/notifications.

3. **Creative/video/carousel operational parity unclear**
   - **Observed**: creative pipeline is advanced, but production-ready parity for carousel/video and provider fallback selection is partially uncertain in non-dry workflows.
   - **Fix**: add contract tests and deterministic adapter routing for each requested format.

4. **Platform capability visibility and errors**
   - **Observed**: Hints for availability/limitations exist, but user-facing capability diagnostics are not fully normalized across all provider flows.
   - **Fix**: expose structured availability and required-action state (`CONNECTED`, `ACTION_REQUIRED`, `ERROR`) everywhere a social action can be attempted.

## P2 (important improvements)

1. **Brand-memory schema normalization**
   - Introduce explicit persistence buckets (`facts`, `brandRules`, `preferences`, `campaignContext`, `performanceLearnings`) with migration-safe shape.

2. **Postiz adapter hardening**
   - Expand retry/reconnect behavior and clearer token-expiration surfacing in the engine owner controls.

3. **Cross-platform dashboard completeness**
   - Ensure every planned route has empty-state, error-state, and failure-action surfaces consistent with live execution.

## P3 (enhancements)

1. Automated rule-conflict detector to prevent contradictory learned constraints.
2. Better onboarding “first-run assistant” with guided minimal question path.
3. Deterministic tests for prohibited terms, punctuation/emoji rules, CTA patterns, and platform-specific style constraints.

## Recommended staged remediation order

1. Close P0 items in a safety-first sequence: credentials/connectivity verification, publish canary, analytics source verification.
2. Resolve P1 workflow gaps before adding new product surfaces.
3. Introduce scoped feedback rules and regression tests.
4. Move to Stage-2 reusable plugin package decisions (portable core, onboarding, provider adapters, and portability hardening).
