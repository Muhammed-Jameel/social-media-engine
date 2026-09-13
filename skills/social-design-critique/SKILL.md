---
name: social-design-critique
description: Run a four-role, pixel-grounded professional review of current SOCIAL_MEDIA_PLUGIN renders using a 160-point rubric, anchors, blind pairwise comparisons, and restart logic. Use only after exact pixels exist.
---

# SOCIAL_MEDIA_PLUGIN Design Critique v2

## Exact job

Determine whether the **current rendered pixels** are genuinely professional, require a bounded revision, or need a new concept. Four critics inspect independently before findings are combined. Metadata, prompts, briefs, self-scores, and provider status are not visual evidence.

## Required inputs

- Every final-dimension rendered asset and slide/frame at original resolution.
- Desktop/original-size view plus mobile-scale and feed/thumbnail previews generated from the same current asset.
- Current asset ID and lowercase SHA-256, verified against the bytes being inspected.
- Approved `ProfessionalDesignBrief`, exact copy, language, platform, lineage, prior critique hashes, and revision count.
- Font, Arabic, license, dimensions, OCR/exact-copy, and technical render checks.
- Two to five relevant professional anchor IDs with local read-only pixels and principle annotations.
- Blind-label candidates for old-vs-new, new-vs-alternative, or candidate-vs-anchor comparison when available.

Block immediately if pixels or the current hash cannot be resolved. Never carry a prior score to a changed asset.

## Reference boundary

Professional anchors are evidence for reviewers only. Reviewers may inspect authorized local anchor pixels and describe observable gaps. Never send those pixels, paths, filenames, studio names, or project names to a generator. Never recommend copying the anchor’s distinctive composition; convert gaps into general craft or communication instructions.

## Four independent roles

Run all four roles against the same hash. Freeze each result before sharing it with another role.

1. **Senior Art Director** — concept, metaphor, story, verbal–visual relationship, distinctiveness, strategic clarity, and whether the direction deserves further craft.
2. **Senior Graphic Designer** — composition, typography, grid, spacing, image/graphic craft, color, optical balance, and finish at original size.
3. **Social Performance Strategist** — two-second comprehension, mobile/feed behavior, sequence/drop-off risk, platform suitability, and clarity without caption dependence.
4. **Arabic Design Reviewer** — Arabic shaping, typography, RTL architecture, line rhythm, bidi/numerals, cultural tone, and whether Arabic is primary rather than adapted. For an English-only asset, still inspect Arabic-system readiness and confirm no pseudo-Arabic or future localization trap; do not invent Arabic content.

Each role returns its own `ProfessionalCritique`; no consensus scoring and no shared draft notes.

## Pixel inspection protocol

1. Recompute/verify the SHA-256 from the exact asset bytes.
2. Inspect original pixels at desktop scale for type edges, masks, perspective, retouching, texture, artifacts, logo construction, and micro-spacing.
3. Inspect mobile scale for the focal point, first read, Arabic legibility, hierarchy collapse, and CTA/proof visibility.
4. Inspect thumbnail/feed context for distinctiveness, density rhythm, repeated structures, and whether the design reads as a template.
5. For carousels, inspect each slide plus sequence pacing, continuity, variation, and payoff.
6. Compare exact visible text against approved copy; deterministic checks inform review but never replace pixel inspection.
7. Inspect relevant professional anchors and name observable differences in concept, hierarchy, typography, craft, polish, and distinctiveness.

`actualPixelsInspected` must be `true`, `renderedAssetSha256` must equal the set’s current hash, and `viewingScales` must include at least `original` and `mobile`; add `feed` or `thumbnail` when judging social behavior.

## 160-point professional rubric

Score eight independent dimensions, each from 0–20:

- **Concept (20):** message-specific idea, metaphor, story, and textless comprehension.
- **Composition (20):** focal weight, grid, eye path, depth, crop, balance, and purposeful negative space.
- **Typography (20):** type choice, line breaks, scale, rhythm, optical alignment, shaping, and type–image integration.
- **Visual craft (20):** asset quality, perspective, lighting, masks, illustration/3D consistency, texture, and artifact control.
- **Brand (20):** SOCIAL_MEDIA_PLUGIN visual grammar, not merely logo/colors; continuity without rigid templating.
- **Communication (20):** two-second takeaway, exact-message fidelity, proof clarity, platform behavior, and sequence logic.
- **Professional polish (20):** micro-spacing, finishing, restraint, edge quality, production precision, and completeness.
- **Distinctiveness (20):** avoids generic AI/template language, feels ownable, and stays structurally distant from references/recent posts.

Recompute `total` from the eight scores. Every score cites visible evidence and an asset region. A 145/160 total is only a candidate threshold; it is not enough by itself.

## Hard fails

Use the schema hard-fail enum. Any hard fail forces `REJECT`, regardless of total. Check especially:

- Obvious template appearance or no visual concept/focal point.
- Generic AI robot, arbitrary icon, random gradient, or meaningless decoration.
- Unreadable/broken Arabic, poor typography, weak hierarchy, or excessive text.
- Low-resolution imagery, broken perspective, AI artifact, or inconsistent character.
- Logo misuse, childish anthropomorphism, reference-too-close, or unlicensed asset.

Also block rather than score when an intended render/view is missing, the hash is stale, or the pixels cannot be inspected.

## Professional-anchor comparison

Use two to five relevant anchors, preferably from different clusters and selected for this purpose/format. Return `materially-below`, `below`, `comparable`, or `above` plus at least two observable differences. Correct colors and logo cannot make a candidate comparable when concept, typography, craft, or polish remain visibly weaker.

A professional candidate must be `comparable` or `above` for every required role. Reviewers must not copy an anchor’s solution in their revision advice.

## Blind pairwise comparison

Use neutral labels A/B and hide lineage until judgment is frozen. Compare:

- Current vs prior only when both exact hashes are available.
- New vs alternative winner candidate when production rendered both.
- Candidate vs professional anchor for professional-gap calibration.

Name a winner by dimension and give at least three observable reasons. `tie-neither-professional` is required when neither clears the bar; never choose a winner merely because a pairwise field requires one.

## Decision and restart logic

- **REJECT:** any hard fail, reference-too-close, concept collapse, or severe execution failure. Stale or missing pixels are `BLOCKED`, not scored.
- **MAJOR_REVISION:** concept is viable but visible craft/communication problems need a bounded rebuild.
- **INSUFFICIENT:** no hard fail, but below 145 or below professional anchors.
- **PROFESSIONAL_CANDIDATE:** every role is at least 145, no hard fail, every anchor verdict is comparable/above, current-hash agreement is exact, and pairwise evidence supports it.
- **EXCELLENT:** every role is at least 152 with the same gates and exceptional observable evidence.

Set `restartConcept: true` immediately for `NO_VISUAL_CONCEPT`, generic/template structure, reference-too-close, concept score below 12, or a visual idea that cannot survive mobile view. After two failed targeted pixel revisions, return to `social-art-direction` even if no single critic requested restart. Never lower thresholds or keep patching metadata.

For disagreement, preserve each independent result. A higher score never overrides another role’s hard fail. Adjudication reviews evidence and pixels; it does not average taste.

## Output contract

Return `ProfessionalCritiqueSet` from `@social-media-plugin/schemas` (`packages/schemas/src/index.ts`) and follow [ProfessionalCritiqueSet](../references/output-contracts.md#professionalcritiqueset-packagesschemassrcindexts). Include four unique roles, current hash, viewing scales, evidence observations, anchors, pairwise comparisons, disagreement reasons, final decision, and next action.

## Hard boundaries

- Do not score a prompt, brief, SVG source, Canva JSON, metadata, or provider screenshot instead of final pixels.
- Do not let critics see each other’s scores before freezing.
- Do not approve because a deterministic tag or data attribute claims compliance.
- Do not average away hard fails, weak Arabic, or one unacceptable slide.
- Do not use vague revision language such as “make it pop.”
- Do not prescribe imitation or expose reference identities to generation.

## Failure behavior

Missing original/mobile pixels, current bytes, a valid hash, or a required critic makes the set `BLOCKED`; name the exact missing evidence. Possible factual errors route to compliance. If anchor relevance is weak, retrieve better anchors before professional approval. If the revision budget is exhausted, return to art direction with preserved evidence and score deltas.

## Eval cases

1. **Metadata says revised, hash unchanged:** Block; no new visual is present.
2. **154 average, one Arabic hard fail:** Reject; no averaging.
3. **Polished green template:** Keep concept/distinctiveness low and fail if template appearance is obvious.
4. **Current beats old but trails anchors:** It wins the pair but remains insufficient.
5. **Two failed targeted revisions:** Set next action to concept restart, not a third cosmetic pass.
