# Campaign automation implementation record — 2026-09-08

## Implemented locally

- Durable monthly campaign import and per-post IDEA → IDEA_REVIEW → COPY → COPY_REVIEW → ASSETS → DESIGN_REVIEW → OWNER_REVIEW → APPROVED stages, append-only stage history and optimistic revision checks.
- Three-attempt bounds per gate. All editorial dimensions must reach 85. Professional visual panels retain the existing 145/160 floor, current image hashes, specialist roles, original/mobile views, no hard failures, full video review and technical evidence.
- Separate native media/captions/thread entries for the five exact account IDs; shared schedule, related but distinct slide subjects, supporting Story handoffs, reference-first video direction and measured H.264 exports.
- `/production` final owner review. Rejection requires a reason and invalidates approval; a fresh idea/editorial/design cycle follows. Owner approval can trigger deterministic scheduling when existing safety flags permit it.
- Publishing bridge now rejects missing platform variants, partial channel selection, altered captions/accounts/time, stale hashes and legacy single-media approvals. LinkedIn carousel mode uses image-to-document settings. TikTok stays UPLOAD-only. Ambiguous or incomplete batch acknowledgements are reconciliation cases, not automatic retries.
- Existing 20 September posts registered as production jobs. Original content and media were not removed or regenerated. No new owner approvals or publication dispatches were made.
- App heartbeat `aurendor-monthly-content-production` created ACTIVE, daily at 09:00 local time (host configured Asia/Baghdad). Plans the next month from the 20th; bounded at two complete packages or twelve submissions per run. Production requires the local Codex host and tools; the VPS only runs Postiz's accepted schedules.

## Verification

- Full Vitest suite: **98/98 tests passed across 26 files**.
- Focused campaign/provider/professional creative tests: **24/24 passed**.
- Engine TypeScript passed. Web source TypeScript passed using `apps/web/tsconfig.production-check.json`.
- Default web typecheck encountered pre-existing duplicate generated files `.next/types/cache-life.d 2.ts` and `.next/types/routes.d 2.ts`; those generated copies were not deleted or altered to hide the issue. The additional check config isolates actual application source from the duplicate generated glob.
- New Next development route `/production`: HTTP 200, rendered the final-review heading and empty-final-inbox state with registered production jobs. Test server on port 3017 was stopped afterward; it was agent-owned.
- This is contract/source/route verification, not production capability certification or an owner-labelled creative golden-set pass.

## Not yet verified / remaining runtime boundaries

- No fresh complete five-platform media package or video has traversed a real generation-to-publication canary under this new workflow.
- Existing Postiz account permissions, X funds and per-platform processing still govern actual delivery. One schedule timestamp does not make third-party public delivery atomic. TikTok requires in-app completion; interactive Story stickers remain a disclosed native handoff.
- No always-on creative agent service was deployed to the VPS, no new paid API plan was purchased, and no publishing/pause/security flag was changed.
- Embedded PGlite cannot safely be owned by simultaneous dashboard and CLI processes. The heartbeat must respect this boundary or use an already-configured PostgreSQL runtime, and must never terminate the owner's app to progress.

Operating instructions: `docs/operations/AUTOMATED_CONTENT_WORKFLOW.md`.
