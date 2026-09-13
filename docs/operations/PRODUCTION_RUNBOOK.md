# Production Runbook

**Current verdict:** no-go for external production publication. This runbook defines the controlled path to production; it is not evidence that the path has been completed.

## Operating stages

| Stage | Allowed activity | Exit evidence |
|---|---|---|
| `OFFLINE` | Local seed data, deterministic render, fixture agents/analytics, dry-run intents | Full local verification; representative workflows reviewed |
| `SHADOW` | Real read-only account/analytics inputs and exact outbound payloads, no social mutation | Account/scopes verified; payload parity; webhook/reconciliation exercises |
| `SUPERVISED` | One owner-approved canary at a time with operator present | Successful create, visible verification, metrics, rollback, and incident drill |
| `LIMITED` | Approved formats/accounts within a small daily ceiling | Error/retry/duplicate rates within targets over a defined observation window |
| `BROAD` | Only proven combinations; still subject to approval and pause controls | Explicit owner decision backed by reliability and quality history |

This repository is in `OFFLINE`. Its executable publisher rejects production-classified plans and only dispatches explicit dry-runs. Implementing and validating a real adapter is a prerequisite to `SHADOW`, not an operator workaround.

## Pre-deployment gate

The release owner signs each item. A missing item is a stop:

- known source credential has been revoked/rotated and no longer appears in `/Users/muhammedjameel/Documents/AURENDOR/.mcp.json`;
- CI passes secret scan, lint, type-check, unit/contract tests, migrations, and production build;
- production build output is inspected and does not trace/include workstation source discovery, local databases, generated demo content, or unrelated repository files;
- owner authentication/authorization, session expiry, CSRF/origin protection, and audit logging are exercised in the deployed environment;
- managed PostgreSQL backup, point-in-time restore, and a restore drill are recorded;
- credential encryption and rotation are verified without exposing token values;
- provider app ownership, accounts, granted scopes, expiry, review/audit tier, rate limits, and capability probes are recorded;
- exact production domains, OAuth callbacks, webhook endpoints, signatures, and replay protection are verified;
- immutable asset storage, hashes, licenses, MIME types, dimensions, and provider accessibility are verified;
- every applicable professional critic, Arabic/RTL/mobile QA, anchor/originality/feed review, claims compliance, and the exact-hash approval scope pass on the canary;
- idempotency, ambiguous-response reconciliation, retry budget, and duplicate prevention pass adapter tests;
- pause/kill switch and provider-side rollback are tested;
- monitoring, owner notifications, escalation contacts, and on-call window are active;
- fixture/demo analytics are excluded from operational or business decisions.

## Build and release

```bash
pnpm install --frozen-lockfile
pnpm exec tsx scripts/check-secrets.mts
pnpm lint
pnpm typecheck
pnpm test
pnpm db:migrate
pnpm db:seed
pnpm build
```

Do not run `pnpm seed:import` in production. It reads a workstation-specific historical source set and is intended for local benchmark/demo data. Use an explicit, reviewed migration or asset-import job for any production content.

Deploy web and worker from the same reviewed revision and schema version. Migrate before starting the new worker. Confirm health, DB connectivity, queue depth, model/provider capability state, and the global pause before accepting work.

## Safe environment baseline

At initial deployment:

```dotenv
DEMO_MODE=false
DRY_RUN=true
PRODUCTION_PUBLISHING_ENABLED=false
AURENDOR_ENGINE_PAUSED=true
```

Keep the engine paused while identity, read-only provider, storage, webhook, and reconciliation probes run. Unpause only for an explicitly approved test window. The environment flags are necessary controls but never sufficient authority: approvals, policy, account capability, hashes, auth proof, and adapter maturity still apply.

## Shadow exercise

1. Freeze the canary’s content, platform variant, rendered assets, schedule, and account.
2. Record the active brand, copy, asset, compliance, and approval hashes.
3. Produce the exact outbound payload in shadow mode.
4. Compare it field-by-field with the owner-visible review.
5. Verify provider constraints, media reachability, token health, and remaining rate budget without mutation.
6. Persist an intent and prove duplicate attempts deduplicate.
7. Exercise timeout after request, ambiguous state, provider lookup, and reconciliation.
8. Confirm the engine remains unable to mutate externally while production publishing is disabled.

## Supervised canary

Only after the shadow gate:

1. Announce the change window, provider/account/format, operator, owner approver, expected visible result, and rollback method.
2. Confirm no unrelated queued publication is eligible in the window.
3. Set the narrow capability/account allowlist; do not enable every provider.
4. Re-run preflight immediately before the operation. Any material deviation invalidates approval.
5. Dispatch once under the persisted idempotency key.
6. If the response is ambiguous, do not blind-retry. Reconcile by intent/account/payload/provider records.
7. Verify the visible account, post content, crops, ordering, caption, links, accessibility, and timestamp.
8. Persist the provider ID and verification evidence with sensitive payload fields redacted.
9. Confirm analytics/comment collection separately; publication success does not prove those capabilities.
10. Re-enable the pause at the end of the window and hold a short outcome review.

## Routine operations

Daily while publication is enabled:

- inspect global pause, failed/ambiguous intents, retries, dead letters, token expiry, webhooks, rate budgets, queue lag, schedule timezone, and clock drift;
- review next 48 hours of approved posts and account bindings;
- compare provider-visible state with persisted state;
- check that imported/demo data remains labelled and excluded from production analytics;
- review alerts without copying raw credential-bearing payloads.

Weekly:

- reconcile all provider posts/metrics;
- review duplicates, failures, manual handoffs, owner overrides, creative rejection reasons, and costs;
- verify backups and rotate expiring provider tokens through approved OAuth;
- sample audit records and content-hash bindings;
- recheck official provider notices for capability or metric changes.

## Rollback and pause

Set `AURENDOR_ENGINE_PAUSED=true` and restart affected web/worker processes to block new scheduling/publishing transitions. Also cancel native provider schedules directly where they already exist; the local pause cannot retract a provider-side scheduled or published post.

For a bad published post, preserve evidence first, then use the provider’s native admin interface to hide/delete/correct it under owner authorization. Record the provider action, actor, timestamp, reason, visible result, and follow-up. Do not delete local audit or intent records.

Follow [Incident Response](INCIDENT_RESPONSE.md) for credential exposure, wrong-account publication, duplicate publication, harmful content, data integrity, or provider compromise.
