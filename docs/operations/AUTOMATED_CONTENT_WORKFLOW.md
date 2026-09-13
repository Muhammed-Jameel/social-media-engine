# SOCIAL_MEDIA_PLUGIN automatic content production — v1

Effective owner direction: 2026-09-08. This is the operating protocol for the Codex heartbeat, not a claim that the legacy offline worker can generate finished media.

## Execution and authority

- Work in the current copied implementation directory (for this project: `/Users/muhammedjameel/Documents/SOCIAL_MEDIA_PLUGIN/apps/social-media-engine-plugin`). Read its AGENTS.md first. Never expose credentials, replace the owner's existing plan, erase old assets, or change publishing safety switches.
- Codex runs the creative agents and real media tools on the local host. The VPS runs Postiz and already-accepted schedules. A local Codex heartbeat is **not** an always-on VPS creative worker: the host and necessary tools must be available.
- No production CLI command can grant owner approval or publish. Only an authenticated dashboard owner action approves the exact five-platform package and optionally schedules it. Missing permissions, funds, rendering capability, or evidence are blockers, never simulated successes.
- Do not auto-purchase credits or invoke a newly billable service. Use existing authorized capabilities. Never manufacture reviewer scores, screenshots, source evidence, or rendered files to advance a gate.
- Keep routine runs quiet. Notify only when a complete package needs final review, a meaningful blocker needs owner action, or a scheduled delivery has a material failure. Do not repeatedly report an unchanged blocker.

## Monthly strategy and work limits

1. Inspect current jobs, current Content/Plan, prior publication receipts, and owner feedback. Do not re-publish past content or count TikTok inbox delivery as a public post. Import the existing September plan once with `pnpm campaign:production import-current-plan`; this preserves the original content/asset rows and IDs.
2. Maintain a full month, defaulting to the owner's existing cadence of **20 posts**, primarily carousels plus about six videos. From the 20th of each month prepare the following month early enough for production and owner review. The first three announcement carousels are a launch event, **not** a recurring monthly introduction.
3. After launch, repeat a service/AI-automation scenario, a Bunyan Pro/product scenario, and a genuinely useful independent AI/automation tip. The tip must solve an observed user need without being a disguised sales pitch. End the caption and final carousel/video frame with a proportionate CTA.
4. Each post needs a specific audience, tension, story, practical payoff, source requirements, novelty check, and success hypothesis. Do not invent product features, client outcomes, statistics, or analytics. Use current primary sources for changing facts and tool advice.
5. Use `CampaignPlanSchema` in `packages/engine/src/campaign-production.ts`; save the authored plan under `artifacts/monthly-plans/<month>/automation/plan.json` with apply_patch and import it using `pnpm campaign:production import-plan <path>`. Imports are insert-only and idempotent. Do not run the legacy September renderer/seeder to replace new work.
6. Process at most **two complete post packages or 12 stage submissions per daily run**, whichever occurs first. Persist at every stage. Use no more than three idea attempts, three editorial attempts, or three design attempts per owner-feedback cycle. A weak idea is replaced, not polished indefinitely. Exhausted rounds remain BLOCKED and need a specific diagnosis. Do not restart counters to evade this limit.
7. Prioritize owner rejection feedback, then near-term unfinished posts, then next month. A stale, undispatched slot may receive a proposed future date using `retime ID ISO_TIME`; this invalidates approval and restarts evaluation. Allow at least 48 hours for production and review. Preserve the 2:1 ordering and avoid schedule collisions. Never retime a post with a publication intent; reconcile it first.

## Agent assignments and evidence

Run each producer and its critic in **separate agent invocations**, with unique run IDs and no access to each other's private reasoning. Critics receive the deliverable, factual evidence, brand rules, and rubric, not a suggested passing score. Record the actual model, prompt version and skill versions. Follow each applicable skill completely, including required references.

| Stage | Role and required knowledge | Gate |
| --- | --- | --- |
| Monthly plan | SOCIAL_MEDIA_PLUGIN marketing-team lead, campaign brief, project content-strategy and brand-intelligence skills | Full month, 2:1 cadence, no duplicate launch, grounded priorities |
| IDEA | Strategist/ideation agent; recent feed and owner feedback | Scenario, useful payoff, hook, novelty and evidence needs |
| IDEA_REVIEW | Independent senior content strategist | Every dimension ≥85/100; no hard failures; otherwise replace the idea |
| COPY | Native Arabic/English writer plus art director; social-social-copy, social-social-creative, project art-direction and social-design skills | Exact platform captions, X thread entries, per-frame text, concept tournament and production direction |
| COPY_REVIEW | Independent editorial critic; brand guardian, factual sources and Arabic editorial expertise | Relevance, originality, clarity, credibility and platform fit all ≥85; unsupported claims fail |
| ASSETS | Creative producer plus video director when relevant; actual rendering tools | Five native variants, ≥2 supporting Stories, media hashes, rights, account IDs, exact reviewed captions |
| DESIGN_REVIEW | Independent senior art director, graphic designer, social-performance strategist, and Arabic design reviewer for Arabic work | Every asset at original/mobile scale; ≥145/160 per specialist, comparable/above anchors, no hard fail; full video playback/audio QA |
| OWNER_REVIEW | Owner only at `/production` | Approve exact package, or reject with a reason |
| APPROVED | Authenticated deterministic dashboard publisher | All five accounts, one future UTC instant, immutable media/copy hashes, safety flags, idempotency and reconciliation |

The v1 scores are provisional quality thresholds, not a guarantee of 15 years of professional experience. Calibrate them with owner decisions. Never tune the rubric down to get a pass.

Every stage submission conforms to `StageSubmissionSchema`. Persist files under `artifacts/monthly-plans/<month>/automation/<post-id>/` with explicit revision names. Run:

```sh
pnpm campaign:production status
pnpm campaign:production show <post-id>
pnpm campaign:production submit <post-id> <stage-artifact.json>
```

The status command returns the latest producer hash. A critic must bind this exact hash and producer run ID. Old evaluations cannot approve new copy or pixels. The final package includes the exact account IDs returned by the configured Postiz integrations, not invented IDs. Never store tokens in an artifact.

The CLI uses the engine database. With embedded PGlite, do not open a second database-owning process while the dashboard or worker is running; stop only an agent-owned test server, or use the configured PostgreSQL deployment. Do not kill the owner's server to make a job run. If the database is unavailable, retain artifacts and report the blocker once.

## Design direction retained from owner feedback

- Premium image-led storytelling, real product screens and tangible metaphors, deep green/cream with disciplined bright-green accents. Vary visual families; avoid generic green blocks, arbitrary arrows and decorative dashboard diagrams.
- Each carousel slide has a **different, related visual subject**. Repeating the hero behind different text is not a new scene. Critics check the actual image sequence, not just distinct filenames/hashes.
- Arabic is professional, natural and human. Start headline leading around 1.25–1.4 and body around 1.5–1.7, then visually adjust to the font, diacritics and line breaks. No touching/clipped lines, punctuation drift or malformed RTL. Render Arabic text with real fonts rather than trusting generated lettering.
- Prefer objects, interfaces and genuine work scenarios. No women as attention devices or objectification; any human casting needs a story-based justification. Do not infer a total ban on women.
- Each post has supporting Story frames with an honest experience question or useful interaction and a return-to-post CTA. Native poll/question/link stickers are a separate disclosed handoff until a verified adapter supports them.
- Review the current feed for repetition and references for transferable design principles. Per the art-direction skill, never send scraped reference pixels, creator names or source paths to the generator. Owned/authorized brand assets and screenshots may be used with rights evidence.

## Platform-native package

- Instagram: usually a 4:5 image carousel; 9:16 for a Reel. Strong first frame, legible sequence, last-frame CTA. A single video uses Postiz `post_type: post`; do not invent a `reel` setting.
- Facebook: captions and image grouping must make sense in feed previews/collages. Re-compose the first images to work independently. Use a vertical video for a Reel-style story or an intentionally composed feed video.
- LinkedIn: use a document-style carousel, not an accidental multi-image collage. The bridge uses Postiz `post_as_images_carousel: true` and `carousel_name`. Write a professional opening and useful document sequence. A detailed demo may benefit from 4:5 or 16:9 video; landscape is not automatically better.
- TikTok: 9:16 photo sequence or video, concise native text, safe zones and a first-second hook. Current integration is **UPLOAD/inbox completion**, never Direct Post. No guarantee of simultaneous public publication with the other four channels.
- X: write the entire thread explicitly, with up to four distinct images per entry and a conservative 280-character editorial budget per entry. No generic auto-generated “continuation” captions. Check account permissions/funds before any live dispatch.
- One shared `scheduledAt` belongs to the whole package. Choose one connected SOCIAL_MEDIA_PLUGIN account per platform. Do not quietly drop an unavailable platform or move it to a different time.
- Network and platform processing are not atomic. An incomplete/ambiguous Postiz acknowledgement must be reconciled per platform; never resend the whole batch to “fix” one channel.

## GPT-6 Astra video production protocol

GPT-6 Astra inside Codex is the preferred **director and code-production model** when available. It is not assumed to be a hosted video-rendering API. Record the actual model used; never substitute another model under its name. Read the video skill and the appropriate Remotion creation/rendering skills if using Remotion. Use verified existing generation tools only when the shot truly requires generated footage.

1. Build a reference packet: approved brand work, owned Bunyan Pro screenshots, genuine screen recordings, typography/palette assets, rights evidence, and at least three sanitized design/reference principles. Verify screenshots actually depict the current product; label illustrative mockups as illustrative, not a live product result.
2. Write the narrative: audience problem → tangible workflow → demonstrated payoff → CTA. Specify exact Arabic/English on-screen copy separately, voice-over transcript, captions, sound plan, duration and beat timing. Prefer short focused reels; duration follows the story rather than padding.
3. For **each shot**, specify purpose, real inputs, subject, one action, camera/lens/framing, motion/easing, depth, light/material, start/end state, exact timing, continuity, safe text regions, negative constraints, and the intended transition. No “make a great professional video” prompts. Save the precise prompt and reference IDs.
4. Generate/compose shots separately. For product UI and exact text, use code-driven motion or genuine captures. AI footage supplements the evidence; it does not fabricate screens, testimonials or people. Keep brand text/logos as controlled overlays.
5. Render every clip, inspect its real frames and watch it completely. A separate critic records continuity, artifacts, reading speed, factual/UI fidelity and whether the shot serves the narrative. Regenerate failed clips before assembly. A storyboard or screenshot contact sheet alone is not full-motion QA.
6. Assemble passed clips in an editable project. Add controlled type, captions, transitions, licensed audio and a CTA. Record renderer and editable project path. Use an explicit audio plan; silent videos must still be checked for accidental audio or missing intended speech.
7. Create actual native exports: at least 9:16 for IG/TikTok and appropriate separate Facebook/X/LinkedIn compositions. Re-layout UI, typography and camera framing for each aspect ratio; don't crop away the important content. Reusing the same bytes between two platforms is allowed only where the composition and caption are deliberately appropriate for both.
8. Export MP4/H.264 for the bridge. Store under `apps/web/public/production/<post>/<revision>/`. The importer independently checks SHA-256, codec, actual dimensions, duration and full decode using ffprobe/ffmpeg. Ensure these binaries are present; absence is a blocker.
9. Review **every export and clip**, including full playback, audio, captions, first/last frames, transitions and mobile overlays. Record `videoChecks` for exact hashes and the full specialist critique panels. Re-render after any required change. Only then queue owner review.

## Current boundaries / operational rollout

- The first new complete five-platform package is still required as an end-to-end canary. Contract tests are not evidence that new videos have been rendered or that all five live accounts can publish.
- Legacy worker MONTHLY_PLAN/offline fixtures are not this production path. The heartbeat uses the durable campaign stages, real Codex tools and skills. It must not mark placeholder worker output as production.
- The dashboard publisher stays subject to demo mode, global pause, dry run and production flags. Existing flags are not changed by this automation.
- The new final review page and import pipeline are local engine changes. Deploying the full creative worker to the VPS would be a separate runtime/provider integration; Postiz itself remains hosted there.
