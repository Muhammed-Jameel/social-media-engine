# AURENDOR Content OS

AURENDOR Content OS is an evidence-led, bilingual social media operating system for monthly strategy, post production, creative review, owner approval, safe publication planning, and analytics. It is a TypeScript modular monolith with a Next.js owner console, a durable worker, PostgreSQL-compatible persistence, strict Zod contracts, project-native expert skills, and an offline deterministic creative path.

The repository is currently an **offline/dry-run implementation**, not a live social publishing service. It can ingest and review the existing September content set, exercise workflows, render deterministic SVG creative, persist publication intents, and produce clearly labelled fixture analytics. It does not yet possess verified Canva or social-provider credentials, approved API access, or a production publication adapter. No file, key, or flag alone turns those missing capabilities into a production connection.

## Safety posture

- `DRY_RUN=true` and `PRODUCTION_PUBLISHING_ENABLED=false` are the defaults.
- Models generate validated candidates; they never receive direct publish authority.
- Publication plans bind the account, operation, schedule, brand version, copy hash, asset hashes, compliance artifact, signed approval, authorization state, and idempotency key.
- Imported legacy creative starts at `NEEDS_REVIEW`; prior files are seed evidence, not approval evidence.
- Unsupported provider operations become explicit capability states or manual handoffs.
- Fixture analytics are labelled synthetic and cannot support production performance claims.

## Quick start

Prerequisites: Node.js 22.13 or later and pnpm 11.19. Node.js 22.23.2 LTS is pinned in `.nvmrc` for reproducible local setup.

```bash
nvm install
nvm use
pnpm install
cp .env.example .env.local
pnpm discovery
pnpm brand:sync
pnpm db:migrate
pnpm db:seed
pnpm seed:import
pnpm simulate:dry-run
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). In another terminal, start the workflow worker when you want queued steps to advance:

```bash
pnpm worker
```

The default database is PGlite under `.data/pglite`. The content importer reads AURENDOR’s canonical source tree from the local machine and copies only resolved demo assets into the app’s ignored `public/demo-content` directory. It records filename repairs and keeps every imported post in review.

Run the complete local verification set with:

```bash
pnpm exec tsx scripts/check-secrets.mts
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --prod
pnpm test:e2e
```

The browser suite uses a separate local PGlite database. Install Chromium once with `pnpm exec playwright install chromium` before running `pnpm test:e2e`.

## System map

| Area | Location | Responsibility |
|---|---|---|
| Owner console | `apps/web` | Review, approvals, controls, provider state, and analytics views |
| Worker | `apps/worker` | Persisted workflow-step execution |
| Contracts | `packages/schemas` | Versioned domain and skill-output schemas |
| Persistence | `packages/db` | PGlite/PostgreSQL migrations, repositories, seed data, imports |
| Domain engine | `packages/engine` | Brand retrieval, agents, content, creative, policy, publishing, analytics |
| Observability | `packages/observability` | Structured logs and secret redaction |
| Brand truth | `data/brand` | FINAL 2026 canonical YAML and evidence manifest |
| Expert workflows | `skills/aurendor-*` | Native role instructions with explicit contracts and failure modes |

The authoritative active identity is FINAL 2026: deep green `#003F35`, neon green `#0EDB23`, pale green `#77FF70`, paper `#F4F8F5`, Dh Ranclo for Latin, and Ghroob Arabic ITF for Arabic. Archived Sovereign Field v3 sources remain discoverable only for provenance.

## Lifecycle

1. Retrieve the active brand evidence and preserve conflicts.
2. Build the next-month retrospective, research, strategy, cadence, and content plan.
3. Author Arabic and English independently, then validate claims and policy.
4. Produce art direction, render actual assets, and run two independent visual critics.
5. Route hard failures and critic disagreement to revision or adjudication.
6. Request owner approval at the correct monthly or item scope.
7. Persist an exact publication intent; use dry-run or an explicit manual handoff while providers are unavailable.
8. Normalize real metrics only after authenticated collection; keep observations, correlations, hypotheses, and experiments distinct.

## Documentation

- [Local setup](docs/setup/LOCAL_SETUP.md)
- [Provider setup boundary](docs/setup/PROVIDERS.md)
- [Canva setup](docs/setup/CANVA.md)
- [Social-network setup](docs/setup/SOCIAL_NETWORKS.md)
- [Production runbook](docs/operations/PRODUCTION_RUNBOOK.md)
- [Incident response](docs/operations/INCIDENT_RESPONSE.md)
- [Creative QA](docs/quality/CREATIVE_QA.md)
- [Evaluation gates](docs/quality/EVALUATION_GATES.md)
- [Final readiness report](docs/quality/FINAL_READINESS_REPORT.md)
- [Current status](docs/CURRENT_STATUS.md)
- [Provider capability matrix](docs/research/CAPABILITY_MATRIX.md)
- [Architecture](docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Threat model](docs/security/THREAT_MODEL.md)

## Production boundary

Do not enable external publication from this snapshot. Production remains a no-go until the readiness report’s blocking gates are closed: owner authentication and authorization are exercised, the known source-tree credential is rotated, encrypted credential storage and backups are verified, provider accounts/scopes are probed, real adapters and webhooks pass sandbox contract tests, representative creative passes dual review, and a supervised canary is explicitly approved.

The staged rollout is `OFFLINE → SHADOW → SUPERVISED → LIMITED → BROAD`. Progress between stages is an evidence decision, not a configuration convenience.
