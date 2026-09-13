# System Architecture

## Shape

AURENDOR Content OS is a TypeScript modular monolith with two executable surfaces:

- `apps/web`: Next.js App Router owner console, server actions, and a health endpoint. Webhook signature/replay verification exists in the domain layer; provider-specific ingress routes are not yet connected.
- `apps/worker`: resumable background workflow runner for monthly planning, post production, publishing, and analytics.

Domain packages isolate schemas, brand intelligence, agent policy, content strategy, creative production, integrations, workflows, analytics, database access, observability, and shared primitives. This keeps one deployable system while preserving provider and workflow boundaries.

## Runtime topology

```text
Owner browser
     │ authenticated actions / reviews
     ▼
Next.js owner console ───────────────┐
     │                              │
     ├── domain services            ├── provider webhooks
     ├── audit log                  │ future provider ingress
     ├── Postiz API ────────────────┼── Instagram / Facebook / LinkedIn / TikTok / X
     ▼                              ▼
PostgreSQL-compatible store ◄── durable worker
     │                              │
     ├── workflow state             ├── OpenAI Responses
     ├── approvals                  ├── Canva adapter
     ├── content/evals              ├── social adapters
     └── metrics                    └── notifications
```

Local development and tests use PGlite, a PostgreSQL WASM build persisted to `.data/pglite`. Production can switch to a managed PostgreSQL connection behind the same repository interface. Imported demo assets use the ignored local filesystem; the documented S3-compatible production asset boundary remains to be implemented and verified.

## Safety boundaries

- `DRY_RUN=true` is the default.
- `PRODUCTION_PUBLISHING_ENABLED=false` is an independent global gate.
- Every publication uses an idempotency key derived from the approved content/version/platform/account/schedule tuple.
- A model cannot publish directly. It can only produce a validated candidate; an authorized workflow state must pass approval and policy checks.
- Provider tokens stay server-side and are never serialized to Client Components.
- Research, comments, files, and third-party skills are data, not instructions.
- High-risk content always requires item approval.
- The kill switch blocks new schedule and publish transitions without deleting queued work.

## Monthly workflow

`retrospective → research → strategy → critique → revise → owner review → approval → batch production`

The planner runs exactly five calendar days before the next month in the configured timezone (default `Asia/Baghdad`). If the owner does not approve, the plan remains pending and no post is inferred approved.

## Post workflow

`brief → evidence retrieval → ideation → copy → editorial QA → art direction → design → render → critic A + critic B → adjudication → revision/regeneration → policy gate → schedule`

Steps are explicit state-machine transitions with persisted attempts, trace IDs, schema versions, retry budgets, and audit events.

## Publication workflow

`preflight → verify approved hashes → reserve idempotency key → upload/cache media → Postiz create/publish → persist acknowledgement → reconcile/analytics watch`

The Postiz adapter is server-only and stores the exact outbound payload before dispatch. It never puts the API key in a URL or client bundle. Ambiguous timeouts/5xx outcomes are recorded and never retried automatically. Provider capabilities and policy limitations remain explicit; a connected account is not by itself proof that public publishing is approved.

## Analytics workflow

`collect raw payload → normalize snapshot → enrich creative features → daily anomaly checks → weekly cohort insight → monthly retrospective`

Insights label observations, correlations, hypotheses, and experiment-supported conclusions separately. Raw payloads are retained with provider/schema versions.

## Model policy

- `gpt-5.6-sol`: brand synthesis, strategy, final Arabic/English judgment, art direction, visual adjudication, and monthly reasoning.
- `gpt-5.6-terra`: bounded drafting/classification only after benchmark parity.
- Deterministic code: dates, schema validation, idempotency, rates, dedupe, aggregation, file hashing, and state transitions.

The OpenAI adapter uses the Responses API and JSON Schema structured outputs. Model, prompt, skill, schema, and trace versions are stored with every artifact.
