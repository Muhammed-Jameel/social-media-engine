# Evaluation Gates

Evaluation is a release control, not a showcase. Every result records the code revision, schema, skill, prompt/model/template, fixture IDs, environment, date, evaluator, raw counts, and known limitations. Fixture success never substitutes for a live provider contract test.

## Gate hierarchy

| Gate | Required evidence | Blocks |
|---|---|---|
| G0 — Repository integrity | Secret scan, lint, type-check, unit/contract tests, deterministic build | Any deployment |
| G1 — Brand grounding | Correct authority/recency ranking, conflict preservation, source hashes, archived-brand rejection | Strategy/copy/creative acceptance |
| G2 — Content quality | Full plan schema, anti-repetition, bilingual editorial review, supported claims, risk/approval classification | Owner review |
| G3 — Rendered creative | Byte-verified original/mobile renders, required specialist critics, professional-anchor comparison, originality and complete-feed review, no hard failures | Approval/scheduling |
| G4 — Approval/compliance binding | Authenticated owner plus exact brand/copy/render/composite-pixel/policy/account/operation/schedule hashes, expiry/revocation | Publication intent |
| G5 — Publication safety | Capability/auth proof, license state, idempotency, outbox, timeout/reconciliation, pause, dry-run receipt | External mutation |
| G6 — Provider contract | Official-doc review, sandbox account, positive/negative/rate/retry/webhook tests, visible reconciliation | Supervised canary |
| G7 — Analytics validity | Account/post identity, metric definitions, raw reference, denominator/window/timezone, data-quality label | Performance claims/experiments |
| G8 — Operational readiness | Auth, encryption, backup/restore, incident/pause drill, monitoring, owner/on-call approval | Production stage promotion |

All upstream gates must pass. A high content or design score cannot compensate for a secret, unsupported claim, missing authorization, unknown license, provider policy restriction, or ambiguous publish state.

## Required fixture classes

The golden/adversarial suite should include at least:

- FINAL 2026 source outranks a newer archived/derived contradiction;
- untrusted file/comment content attempts to instruct the agent;
- missing evidence and conflicting brand facts;
- generic “innovation/digital transformation” copy with no SOCIAL_MEDIA_PLUGIN tension;
- Arabic that is literal, unnatural, malformed RTL, or mixed-direction;
- unsupported customer, pricing, performance, legal, or guarantee claim;
- repeated hook/creative structure from recent posts;
- high visual average with clipped Arabic or one failed carousel slide;
- generic green template with logo but low brand distinctiveness;
- one missing required critic, one specialist below `145/160`, or disagreement requiring adjudication;
- unknown asset rights;
- approval that expires before schedule, is revoked, or targets a different account/operation/hash;
- global pause, disabled production flag, unavailable provider, or unhealthy auth;
- duplicate dispatch, timeout after request, ambiguous response, and reconciliation conflict;
- TikTok Direct Post request for this internal utility;
- analytics with zero/missing denominator, duplicate snapshots, tiny sample, and provider metric drift.

## Scoring and reporting

Report counts before percentages: `passed / total`, fixture list, and confidence limits. Do not publish a single “AI quality” number.

- Deterministic safety/contract gates require 100% pass.
- Brand/copy fixtures require all critical cases and no invented evidence.
- Creative publication candidates require every applicable critic at `>=145/160`, a `PROFESSIONAL_CANDIDATE` or `EXCELLENT` decision, a `comparable` or `above` professional-anchor verdict, and zero hard failures. Thresholds remain provisional until calibrated with owner labels.
- Analytics evidence labels are `OBSERVATION`, `HYPOTHESIS`, `CORRELATION`, or `EXPERIMENT_SUPPORTED`; do not upgrade them for narrative convenience.
- A controlled-experiment label requires the engine’s minimum evidence policy and a valid design; statistical confidence and practical impact remain separate.

## Change policy

Run affected golden and adversarial cases before merging any material change to:

- a model alias/tier or reasoning setting;
- prompt, native skill, output schema, or retrieval ranking;
- brand file or source authority rule;
- content rubric, creative rubric, threshold, or template;
- provider adapter, payload mapping, media transform, scheduler, idempotency, or retry behavior;
- metric definition, denominator, attribution window, cohort, or experiment calculation.

Compare candidate vs baseline on the same fixture set. Preserve regressions, not only averages. A quality/cost improvement cannot waive a critical safety regression. Version approved baselines so a provider/model change is traceable.

## Current evidence gap

The repository has unit and contract tests for schemas, redaction, policy, state transitions, brand/design-intelligence retrieval, byte-level render binding, content checks, and analytics normalization. Round three contains 12 hash-anchored rendered candidates with role-separated reviews, but only candidates `01`, `02`, `07`, and `12` clear the unanimous critic-only professional threshold; `07`/`12` then fail candidate-level feed originality, `03` has an Arabic typography hard fail, and the approved SOCIAL_MEDIA_PLUGIN golden set is empty. Live production adapters, a fully accepted representative suite, production Postgres/restore evidence, and provider contract reports remain incomplete. Therefore G3, G6, G7, and G8 are not closed for production.

Use [Creative QA](CREATIVE_QA.md) for pixel-level acceptance and [Final Readiness Report](FINAL_READINESS_REPORT.md) for the current no-go decision.
