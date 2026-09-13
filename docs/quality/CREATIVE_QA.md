# Creative QA Standard

Creative is reviewed from final rendered pixels, never from a prompt, design brief, Canva response, filename, or thumbnail alone. A provider success response means only that a provider completed an operation.

## Gate inputs

The reviewer needs all of the following:

- approved design brief and exact platform copy;
- original-resolution render for every slide/frame plus mobile-scale previews;
- active FINAL 2026 brand evidence and creative-rubric version;
- asset, font, license, copy, content, and render hashes, including the composite original/mobile pixel-evidence hash;
- platform canvas/safe-zone/format constraints;
- Arabic/English source copy and locale intent;
- prior candidate lineage and revision reasons;
- blind candidate labels for comparative review;
- the exact retrieved corpus version/reference set plus recent-feed post IDs and asset hashes used for originality and coherence review.

If a render, slide, license, or evidence input is missing, return `BLOCKED`; do not estimate a pass.

## Canonical visual checks

- Active colors are deep `#003F35`, neon `#0EDB23`, pale `#77FF70`, and paper `#F4F8F5` unless an evidence-backed campaign extension is approved.
- Latin display uses Dh Ranclo; Arabic uses Ghroob Arabic ITF.
- Arabic is correctly shaped, professional, naturally authored, and right-to-left; numerals, punctuation, mixed Latin text, and alignment are inspected explicitly.
- The design expresses disciplined grid, modular geometry, deliberate whitespace, quiet confidence, and a recognizable AURENDOR device beyond simply placing a logo on green.
- Archived cream/gold Sovereign Field v3 styling cannot silently pass as current work.
- Visuals avoid generic blue-tech clichés, stock-template composition, fake dashboards, gratuitous gradients, placeholder statistics, and ornamental AI imagery with no concept role.

## Professional 160-point rubric

| Dimension | Points |
|---|---:|
| Concept | 20 |
| Composition | 20 |
| Typography | 20 |
| Visual craft | 20 |
| Brand | 20 |
| Communication | 20 |
| Professional polish | 20 |
| Distinctiveness | 20 |
| **Total** | **160** |

Bands are `<120` `REJECT`, `120–134` `MAJOR_REVISION`, `135–144` `INSUFFICIENT`, `145–151` `PROFESSIONAL_CANDIDATE`, and `152–160` `EXCELLENT`. Every required critic must independently reach at least `145/160`, cite visible evidence, inspect original and mobile pixels at the exact current hash, record no hard fail, and rate the work `comparable` or `above` its relevant professional anchors. Averaging cannot create a pass. The canonical dimension anchors live in [CREATIVE_QUALITY_RUBRIC.md](../../design-intelligence/reports/CREATIVE_QUALITY_RUBRIC.md).

## Hard failures

Any of these forces revision/rebuild regardless of average:

- unreadable, missing, or clipped text;
- wrong logo, canonical color, or active brand version;
- Arabic spelling, shaping, mixed-direction, or RTL failure;
- factual error or unsupported claim presented as fact;
- visible placeholder, watermark, or generator residue;
- distorted people, products, charts, or logos;
- incoherent hierarchy or unintended overlap/crop;
- unlicensed/unknown-rights asset;
- reference-too-close or recent-feed self-repetition;
- missing carousel slide, wrong ordering, or broken sequence.

`W3-P5` in the imported September set is a known hard-fail example. It must remain `NEEDS_REVIEW`/revision until a repaired render completes the full gate.

## Independent critic protocol

1. A Senior Art Director, Senior Graphic Designer, and Social Performance Strategist review independently and freeze scores, visible evidence, anchor comparisons, hard failures, and prioritized changes.
2. Every Arabic asset also requires an independent Arabic Design Reviewer inspecting final shaping, line breaks, mixed-script behavior, RTL hierarchy, and optical balance.
3. Totals are recomputed from all eight dimensions. Each critic cites observable regions/slides and cannot see or average away another role’s specialist failure.
4. Any hard failure forces rejection/rebuild. A missing required role, missing original/mobile evidence, stale hash, or unverified anchor produces `BLOCKED`.
5. Critic disagreement is preserved and can route to adjudication, but adjudication cannot waive a specialist hard failure or the `145/160` floor.
6. A separate originality reviewer binds its decision to the retrieved corpus version, knowledge hash, exact reference IDs, and current composite pixel hash.
7. A separate feed reviewer must inspect the complete approved recent-feed set, with exact post IDs and compared asset hashes.
8. Owner approval is separate, authenticated, and bound to the current render, composite pixel evidence, and policy-evidence hashes; critics cannot grant publishing authority.

## Technical and accessibility inspection

- Decode/fetch and hash the actual bytes, verify their intrinsic dimensions and MIME type, and bind original plus mobile artifacts into one canonical pixel-evidence hash.
- Inspect at 100% and at a representative mobile viewport; verify safe zones and UI overlays for Stories/Reels.
- Compare OCR/text extraction against exact approved text; manually inspect Arabic where OCR is uncertain.
- Verify contrast and do not encode essential meaning only by color.
- Provide meaningful platform alt text for static/multi-image content.
- Inspect carousel consistency and narrative progression without making every slide a near-duplicate.
- Verify licensed assets, font rights, source lineage, and any required attribution.
- Confirm crop/thumbnail/cover behavior for each target platform.

## Revision loop

Revision instructions must name the asset/slide/region, exact change, reason, rubric dimension, and expected outcome. Preserve prior candidates and scores. Use targeted revision first; after repeated failure, require a materially new direction. Never move the threshold or average away a failed slide to end the loop.

## Publication-candidate evidence

Store the brief/version, corpus/knowledge hash, exact copy hash, ordered asset hashes, composite original/mobile pixel hash, licenses, font/RTL checks, every required frozen critic record, professional-anchor comparisons, originality/feed decisions, policy-evidence hash, adjudication if any, approved candidate ID, and authenticated owner approval binding. Re-rendering or changing copy, pixels, fonts, corpus context, recent-feed context, or assets invalidates the affected visual/owner evidence until the current hashes are reviewed again.
