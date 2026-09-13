# SOCIAL_MEDIA_PLUGIN Content OS — Simple Dashboard Guide

## Start the dashboard

The project requires Node.js 22.13 or later. The repository pins Node.js 22.23.2 in `.nvmrc`.

```bash
cd /Users/muhammedjameel/Documents/SOCIAL_MEDIA_PLUGIN/apps/social-media-engine-plugin
nvm install
nvm use
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Stop the server with `Ctrl+C`.

`pnpm dev` now performs the database migration and seed, brand sync, legacy import, active September plan render/sync, and web startup. Use `pnpm plan:september` separately only when you want to regenerate the plan without starting the dashboard.

Start `pnpm worker` in a second terminal only when you intentionally want queued workflow steps to advance.

## Review Month 1

1. Open **Plan**.
2. Read the strategy and creative-balance summary first.
3. Review `SEP-01` through `SEP-20` in order.
4. Inspect the rendered asset or planning cover, publishing format, track, platform, date, production state, and funnel stage.
5. Open **الخطة الكاملة** on each card.
6. Check the caption, CTA, visual direction, slide or frame plan, evidence boundary, and KPIs.
7. Request changes using the post key, for example: `Revise SEP-08: keep the concept, shorten the caption, and strengthen the CTA.`

The new Month 1 plan contains:

- 20 scheduled releases.
- 3 opening posts that introduce SOCIAL_MEDIA_PLUGIN.
- A repeating service story → Bunyan Pro story → independent value post cadence.
- 14 carousels and 6 reels, with no single-image posts.
- The first day contains three complete six-slide announcement carousels and six supporting Story frames.
- 40 supporting Story frames: two engagement-led frames for every post.
- A CTA at the end of every caption and final carousel slide.
- Reel clip plans with per-clip validation and an assembly gate; generated video is not yet complete.

## What every screen does

### Command

The home view. It summarizes month status, review work, provider constraints, learning signals, and alerts.

### Plan

The active Month 1 campaign. Its 20 `SEP-*` cards link directly to the same database-backed review items shown in **Content**.

### Content

The current review queue. It defaults to the 20 active `SEP-*` items; use **Historical** to inspect the 33 superseded imported items without changing them. Open a current item to inspect planning assets, copy, CTA, QA flags, strategic intent, and decision history.

The formal decision form supports:

- Approve this item.
- Request revision.
- Reject and block.
- Disable item.

An approval binds the exact copy and listed asset hashes. Material changes require a fresh review.

### Analytics

Shows qualified reach, learning notes, and format cohorts. Current values are synthetic demonstrations and must not be used as SOCIAL_MEDIA_PLUGIN performance claims.

### Runs

The durable workflow ledger. It shows workflow type, status, current step, creation time, and trace identifier.

### Providers

Shows whether each provider capability is available, unavailable, manual, or unverified. A connection is not automatic publishing permission.

### Publishing

The supervised Postiz workspace. It lists approved current content, connected supported channels, platform-specific captions, exact feed assets, draft/schedule/publish controls, and the immutable publication-batch history. Use Draft for the first account validation and review every package in Postiz before a supervised canary.

### Controls

Contains the creative-quality release gate, plain-language owner commands, emergency pause, runtime posture, and publication authorization chain.

Emergency pause prevents workers from claiming new generation, scheduling, or publishing work. Resume and persistent changes require confirmation.

### Setup

Reports whether required configuration is present without exposing secret values. It also links to the health endpoint and safe local-start instructions.

### Guide

The in-product version of this document.

## Status meanings

- **In review / Needs review:** no final owner approval exists.
- **Approved:** the exact reviewed copy and asset hashes were approved.
- **High risk:** requires a separate item decision; month approval cannot clear it.
- **Hard fail:** a blocking QA or critique issue requires revision and re-rendering.
- **Historical:** a superseded item retained for provenance; it is read only.
- **Paused / Frozen:** the protected workflow cannot advance.
- **Synthetic:** demonstration evidence only, not production truth.

## Correct monthly operating sequence

1. Review strategy and audience.
2. Review all 20 posts and their full plans.
3. Request revisions by `SEP-*` key.
4. Re-run `pnpm plan:september` after approved source changes.
5. Confirm the plan manifest still has `publicationEligible: false`.
6. Use **Content** for formal decisions on database-backed items.
7. Check **Controls** before any workflow execution.
8. Use **Runs** to inspect execution state.
9. Use **Analytics** only after real authenticated metrics replace fixtures.

## Current safety boundary

- Self-hosted Postiz and draft handoff are implemented; live social delivery remains gated until provider accounts and policies are verified and the production controls are deliberately enabled.
- Creative production is frozen at the release gate.
- No verified live provider adapter is enabled.
- **Plan** and **Content** show the same 20 active `SEP-*` records; formal decisions are submitted from an item’s **Content** detail page.
- Legacy `W*` and `V*` items remain available only through the read-only **Historical** filter.
- Higgsfield reel generation is blocked until `higgsfield auth login` succeeds; planning covers are not publishable reel assets.
- Analytics are synthetic.
- Changed creative or copy requires new hash-bound approval.

## Useful files

- Campaign source: `apps/web/src/lib/september-creative-plan.ts`
- Dashboard page: `apps/web/src/app/(console)/plans/2026-09/page.tsx`
- Readable calendar: `artifacts/monthly-plans/2026-09-structured-intelligence/MONTHLY-CALENDAR.md`
- Complete JSON plan: `artifacts/monthly-plans/2026-09-structured-intelligence/month-plan.json`
- Asset manifest: `apps/web/public/monthly-plan/2026-09/manifest.json`
