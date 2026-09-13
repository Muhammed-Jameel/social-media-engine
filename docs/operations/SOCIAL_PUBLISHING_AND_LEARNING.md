# September publishing and first-week learning

Owner instruction, 10 September 2026: produce the next three items, replace the old automation with automatic publishing at varied times, and monitor every platform post through its first week. The standing instruction replaces repeated per-item manual permission for independently reviewed exact releases. It does not override production authentication, global pause, provider limitations, immutable evidence or idempotency.

## Scope and commands

`data/social-operations-policy.json` contains the September ID/account allowlist, Baghdad schedule, enabled/paused state and authority trail. Morning/afternoon/evening rotate across pillars in each two-day cycle. This is an exploratory comparison, not a causal A/B test. Publication to every platform uses the same chosen instant for that content concept, with native assets/copy. There is no claim that all channels have identical best times.

- `pnpm social:sync`: read the connected Postiz account list and reported posts, reconcile public URLs, collect due metrics and persist raw observations.
- `pnpm social:schedule`: validate exact release manifests, evidence hashes, assets and account binding without dispatch.
- `pnpm social:schedule --live`: schedule only validated future releases with an open live dashboard gate. No immediate posts, catch-up bursts, or retries of prior intents.
- `pnpm social:status`: read stored collection state.

Current scope is September11–30; monitor final posts through October7. The previous `aurendor-monthly-content-production` automation is paused. Replacement `aurendor-publishing-and-first-week-learning` checks hourly. The host must be awake for creative work and collection. Accepted Postiz schedules execute on the hosted deployment.

## Release contract

`artifacts/social-releases/<id>.release.json` binds complete platform copy, assets, dimensions, account IDs and immutable schedule. An independent report is hash-bound to all release fields except the report itself. It must identify producer/reviewer, provide concrete observations and contain no hard failures. Actual renders and fonts must be inspected; never fabricate a passing review. Public asset files are under the September editorial directory; do not overwrite files referenced by a dispatched release.

Use Hyperframes + GSAP for video, independently composed 1080×1920 and1920×1080. Each carousel ends with its topic-related service/product CTA. Supporting interactive Stories remain native sticker handoffs and are not counted as automatically published posts. Review exact platform captions before binding the release. Latest sources need a24–48hour prepublication recheck; dates and conditions are retained in briefs.

Historical setup state before11September05:00Baghdad: the dashboard production gate was closed in demonstration mode. See the activation record below for the current live state. The scheduler must show BLOCKED until production authentication and switches are valid; no user-facing claim of active publication is allowed before a real accepted schedule. `DEMO_MODE=false`, configured owner authentication, `DRY_RUN=false`, `PRODUCTION_PUBLISHING_ENABLED=true` and an unpaused runtime are required. Do not modify credentials or simulate authentication. This technical gate is separate from the owner's already-given publishing permission.

## Durable state and recovery

`.data/social-operations/` is private local operational state: learning.json, scheduling-status.json, dispatches.json, delivery-index.json and runner.lock. Atomic replacement and an exclusive process lock prevent overlapping writers. A stale lock requires verifying its PID is no longer running; never blindly delete it. Reserve exact intent before scheduling; failed/uncertain calls remain held. Inspect raw receipts and reconcile each account's Postiz post ID before considering a retry. Never auto-resend a whole batch. Uploaded media alone is not a publication.

Analytics reads these records through `/analytics`; the CSV contains one row per observed platform post/check. Publishing displays the scoped queue separately from legacy approvals. No synthetic fixture is included in this Analytics page.

## Observation and decision rules

Check near2h then24,48,72,96,120,144,168h. A late run may collect within the stated checkpoint tolerance; actual age is always recorded. Missed earlier checkpoints stay missing. No-data/error responses do not erase a prior response. A report of zero remains zero; unavailable data remains null. Never sum cumulative values across collection dates. Provider series with unknown daily/lifetime semantics remain raw and unaggregated. Raw labels, API error status, observed time and releaseURL are retained.

Normalize only known metric labels. Compare within platform and format at equal-age checkpoints, showing valid sample size for each metric. At least five comparable posts per time band are needed even for a directional observation; topic/audience confounding remains. Basic engagement is likes+comments; denominator is explicitly reach. Views, reach and impressions are distinct. Saves and shares are separate usefulness signals. Never infer sales, qualified leads, watch time or completion from unsupported fields.

Each completed day-seven record gets an evidence-based note in `artifacts/social-learning/reviews/<post-id>.md`: observations, coverage gaps, content hypothesis, timing hypothesis and one next test. Do not rewrite brand identity from a few posts.

## Verified capability, 10 September 2026

Read-only probes against the configured deployment returned five connected channels and eight historical Postiz records. Instagram Reel data returned views/reach/likes/comments/saves/shares. LinkedIn returned likes/comments. Tested Facebook post analytics returned an empty array. X has a prior ERROR record, requiring provider diagnosis. TikTok PUBLISHED records link to the inbox and are not public posts. Production metrics are provider/account-specific, not guaranteed by a connection badge.

Primary documentation: https://docs.postiz.com/public-api/posts/list and https://docs.postiz.com/public-api/analytics/post . Provider post-list publishDate is retained as its reported timestamp; analytics comparison is limited by its accuracy. No claim of exact platform delivery latency is inferred.

## Stage completed creative without inventing review evidence

After a real independent report exists at the item’s `qa/independent-review.json`, run:

```sh
pnpm exec tsx scripts/stage-social-release.mts B02 cycle-02 /absolute/path/to/B02/qa/independent-review.json
```

The assembler reads the public delivery manifest, complete platform copy and policy timestamp, and requires every outbound media hash to be present in the independent report. X retains its authored thread and selected frames; Reel media occurs once, with text continuations. The resulting review binds the precise outbound copy/account/media/schedule package. It stages files; it does not schedule or approve a legacy DB item. The six first-cycle/second-cycle packages are now staged. Actual live attempts returned BLOCKED before upload because production authentication/switches remain missing.

## Owner-requested media upload, 11 September

The owner subsequently explicitly requested uploading all six current pieces and their Stories to Postiz. `scripts/upload-september-media.mts --upload` uploaded 35 distinct files: 25 carousel frames, four video exports (two orientations per video), and six Story images. All 35 remote files returned HTTP200. Exact hashes and Postiz media receipts are retained in `.data/social-operations/media-uploads.json`; verification is in `artifacts/social-learning/qa/media-upload-verification.json`. This is media-library preparation, not a post-creation or scheduling receipt. The scheduler now reuses completed exact-hash media uploads after the existing live gate passes. Uncertain/conflicting uploads require reconciliation.

The owner supplied their login email. `scripts/setup-owner-login.py` is a **user-run interactive local command**, not an automation command: it requests a hidden password twice, stores a salted scrypt hash, initializes a missing session secret, and leaves publication switches and global pause intact. Do not run it on behalf of the user or put a password in chat/tool arguments. The owner confirmed completing it on11September. Their password hash was preserved. An empty-session-key parsing bug was fixed and the missing random session key was initialized as part of completing their requested setup. The console was restarted with login protection and production switches enabled; unauthenticated access redirects to the login form and CSV returns401. An interactive password login was not performed by the agent. Never report an accepted schedule until Postiz returns and reconciliation confirms the actual post IDs and dates.

Story capability was rechecked against the official Postiz provider documentation on11September: Instagram and Facebook support `post_type: story`. The current six interactive Story designs still need native poll/question stickers or separately reviewed static adaptations for automatic publication. Uploading an image does not add a working sticker. Do not schedule Story images as ordinary X/LinkedIn feed posts to simulate unsupported Stories. TikTok's current unverified direct-post configuration remains an inbox handoff; `UPLOAD` requires owner completion and must never be described as automatic public delivery. Sources: https://docs.postiz.com/public-api/providers/instagram , https://docs.postiz.com/public-api/providers/facebook , https://docs.postiz.com/public-api/providers/tiktok .

## Live schedules confirmed, 11 September 05:04 Baghdad

The owner completed password setup and requested completion of production activation and scheduling. The live health gate now reports ownerAuthConfigured=true and publishingEnabled=true, with demo mode disabled and global pause preserved. `artifacts/social-learning/qa/production-activation.json` records the audited configuration transition; `production-auth-browser.json` records login-form visibility and anonymous CSV rejection. `/login` is explicitly dynamic to avoid retaining a redirect prerendered during demo mode. Never create an owner session on the user's behalf.

All six core packages now have30 distinct Postiz IDs in QUEUE at their exact reviewed timestamps. They are retained in `.data/social-operations/dispatches.json`. Six static Story packages have12 distinct Instagram/Facebook IDs in QUEUE, scheduled30minutes after their matching feed pieces. They are retained separately in `story-dispatches.json`; review-bound manifests live in `artifacts/social-story-releases/`. Use `scripts/schedule-reviewed-stories.mts` for validation and `--live` for dispatch; existing intents are never resent. Reconciliation of all42 exact account/ID/date/state combinations is recorded in `artifacts/social-learning/qa/schedules-confirmed-2026-09-11.json`.

The six TikTok entries remain inbox handoffs, not automatic public posts. The other36 scheduled entries target automatic publication; future provider failure is still possible and must be collected. All42 IDs are registered in delivery-index.json for first-week monitoring; Story format remains distinct in comparisons. No new engagement measurements were available at scheduling time.

S01 and U01 use their independently reviewed original static Stories. B01, B02, U02 and S02 use separately produced `story-auto.png` variants with useful takeaways and ordinary reply CTAs, independently inspected by root. Their original interactive assets remain unchanged. Do not overwrite dispatched variants when regenerating the content plan. Automatic Stories do not contain native polls, and no poll analytics is claimed.

The former authentication blocker has been resolved. Heartbeats should preserve the live settings, collect due observations, retain accepted intents, and never reinitialize credentials or repeat setup commands. Postiz executes accepted schedules on the hosted deployment even when the local dashboard is offline.
