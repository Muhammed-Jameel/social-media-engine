# Architecture Decision Log

## ADR-001 — Modular monolith before microservices

**Status:** Accepted · **Date:** 2026-08-23

Use one TypeScript workspace with separate web and worker entry points plus domain packages. This keeps transactions, auditability, and local development understandable while preserving adapters as future extraction seams. Rejected: many independent agent services, because they add distributed failure modes before provider volume justifies them.

## ADR-002 — PostgreSQL semantics locally and in production

**Status:** Accepted · **Date:** 2026-08-23

Use PGlite for a self-contained local/demo environment and a repository boundary compatible with managed PostgreSQL for production. Rejected: JSON files as the primary store because concurrent workflow, audit, idempotency, and metric snapshot behavior require transactional semantics. Rejected: SQLite-first because it would create avoidable SQL/constraint drift from the target production database.

## ADR-003 — Explicit durable state machines

**Status:** Accepted · **Date:** 2026-08-23

Persist workflow runs, steps, attempts, next-run times, errors, and idempotency keys. The first implementation uses a database-backed runner to avoid a hosted workflow dependency in local setup. The worker interface is intentionally compatible with later Trigger.dev/Inngest/Temporal adoption. Rejected: cron-only scripts and fire-and-forget queues.

## ADR-004 — Provider capability adapters with manual fallbacks

**Status:** Accepted · **Date:** 2026-08-23

OpenAI, Canva, Meta, LinkedIn, TikTok, YouTube, storage, and notifications sit behind typed capability interfaces. Lack of scopes/plan/API support becomes an explicit capability state and manual handoff, not a simulated success.

## ADR-005 — Dry-run and shadow mode are the default

**Status:** Accepted · **Date:** 2026-08-23

No unattended external publication is enabled by code installation or by adding a credential alone. Production requires both a global enablement flag and account/policy readiness. The initial maturity stage is `OFFLINE`, then `SHADOW`, `SUPERVISED`, `LIMITED`, and `BROAD` only with evidence.

## ADR-006 — FINAL 2026 brand identity is canonical

**Status:** Accepted · **Date:** 2026-08-23

The deep-green/neon “Digital Civilization” system supersedes Sovereign Field v3. Old assets remain indexed for provenance but are down-weighted as historical and cannot silently override current brand retrieval.

## ADR-007 — Deterministic creative renderer as Canva fallback

**Status:** Accepted · **Date:** 2026-08-23

The engine includes an SVG-based, editable deterministic renderer for core 4:5 and 9:16 layouts. Canva is an optional provider route selected by verified capability. This guarantees preview, QA, and manual handoff even when Autofill or Brand Template access is unavailable. It is not represented as Canva functionality.

## ADR-008 — Single-owner product with organization IDs

**Status:** Accepted · **Date:** 2026-08-23

Optimize the first UX for one AURENDOR owner/admin while retaining organization/brand identifiers throughout the schema. Rejected: premature multi-tenant billing/role complexity. Production auth still requires a secure owner session.

## ADR-009 — Self-hosted Postiz as the social delivery gateway

**Status:** Accepted · **Date:** 2026-09-05

Use a pinned, self-hosted Postiz instance to consolidate provider OAuth and delivery for Instagram, Facebook, LinkedIn, TikTok, and X. AURENDOR remains authoritative for approval, exact copy and asset hashes, scheduling intent, audit history, and duplicate protection. Provider credentials stay in the private Postiz runtime; only a server-side Postiz API key is given to Content OS. Rejected: browser-session automation, because it is brittle and cannot provide durable provider identity, scheduling, reconciliation, or safe idempotency.
