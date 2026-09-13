# ARCHITECTURE-MAP — SOCIAL MEDIA ENGINE (Current Implementation)

## Purpose

This map documents the current implementation topology before Stage-2 refactoring to a reusable, brand-agnostic product.

## Runtime layers

1) UI Layer (`apps/web`)
- Console routes for control, review, publishing setup, analytics, and content operations.
- User-facing approval, revision, run visibility, and safety switches.
- No hard social API calls in UI code; calls are mediated through server entrypoints and engine services.

2) Engine Domain Layer (`packages/engine`)
- Domain orchestration for planning, content workflow, brand pack handling, creative generation orchestration, publication state, and review gates.
- Strong state modeling and explicit transitions are used across strategy, review, scheduling, and publishing flows.

3) Integrations Layer (`packages/engine`, Postiz adapter, skill-facing boundaries)
- Contains adapters for Postiz and content/creative providers.
- Explicit integration-state handling exists (`UNAVAILABLE`, `MANUAL_HANDOFF`, etc.) where provider parity is incomplete.

4) Data Layer (`packages/db`)
- Local-first repository pattern with schema-backed persistence.
- Tracks campaigns, content plans, publications, runs, assets, receipts, reservations, and audit artifacts.

5) Worker/Service Layer (durable worker process)
- Runs long workflows with fail-closed gates and idempotent reservations.
- Supports dry-run publication simulation and provider handoff once connected.

6) Evidence/Quality Layer
- Stores hashes, proofs, critic reports, and provenance for creative assets and decisions.
- Prevents silent drift by linking approvals to exact material and decision hashes.

7) Security Boundary Layer
- Secret-safe config handling, sanitization utilities, webhook integrity checks, and replay prevention helpers.

## Stage-2 extraction seams (target reusable product)

- `core`: portable domain primitives, workflow orchestration, brand memory model, and state machines.
- `adapters`: provider-specific modules for social, creative, and analytics with capability descriptors.
- `dashboard`: product UI screens and actions (can be kept as current web layer initially).
- `provider-auth`: OAuth/token lifecycle and status descriptors.
- `storage`: workspace-level data + credentials abstractions.
- `learning`: structured feedback rule store with precedence and conflict handling.
- `agent-interface`: command and agent-invocation schemas for external environments (Codex/Claude-like runtimes).

## Stage-2 readiness blockers from current snapshot

- Analytics source is currently not fully live/proven end-to-end.
- Postiz execution remains environment/capability-gated and not globally production-verified.
- Unified engagement reply handling is not fully validated per network in this audit pass.
- Feedback-to-rule persistence model is present conceptually but not yet complete as a first-class scoped rule hierarchy.

