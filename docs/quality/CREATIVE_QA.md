# Creative QA Standard

Creative is reviewed from final rendered pixels, never from a prompt, design brief, Canva response, filename, or thumbnail alone. A provider success response means only that a provider completed an operation.

## Gate inputs

The reviewer needs all of the following:

- approved design brief and exact platform copy;
- original-resolution render for every slide/frame plus mobile-scale previews;
- active FINAL 2026 brand evidence and creative-rubric version;
- asset, font, license, copy, content, and render hashes;
- platform canvas/safe-zone/format constraints;
- Arabic/English source copy and locale intent;
- prior candidate lineage and revision reasons;
- blind candidate labels for comparative review.

If a render, slide, license, or evidence input is missing, return `BLOCKED`; do not estimate a pass.

## Canonical visual checks

- Active colors are deep `#003F35`, neon `#0EDB23`, pale `#77FF70`, and paper `#F4F8F5` unless an evidence-backed campaign extension is approved.
- Latin display uses Dh Ranclo; Arabic uses Ghroob Arabic ITF.
- Arabic is correctly shaped, professional, naturally authored, and right-to-left; numerals, punctuation, mixed Latin text, and alignment are inspected explicitly.
- The design expresses disciplined grid, modular geometry, deliberate whitespace, quiet confidence, and a recognizable AURENDOR device beyond simply placing a logo on green.
- Archived cream/gold Sovereign Field v3 styling cannot silently pass as current work.
- Visuals avoid generic blue-tech clichés, stock-template composition, fake dashboards, gratuitous gradients, placeholder statistics, and ornamental AI imagery with no concept role.

## Weighted rubric

| Dimension | Points |
|---|---:|
| Concept originality | 14 |
| Hierarchy | 12 |
| Typography | 12 |
| Composition/grid | 10 |
| Brand distinctiveness | 10 |
| Message clarity | 10 |
| Mobile readability | 8 |
| Spacing/whitespace | 7 |
| Graphic/image quality | 6 |
| Color/contrast | 5 |
| Platform suitability | 3 |
| Polish/detail | 3 |
| **Total** | **100** |

Bands are `<75` reject, `75–87` revise, `88–92` strong but inspect/revise, and `93+` publication candidate. A numeric band never overrides a hard failure.

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
- unjustified near-duplicate creative;
- missing carousel slide, wrong ordering, or broken sequence.

`W3-P5` in the imported September set is a known hard-fail example. It must remain `NEEDS_REVIEW`/revision until a repaired render completes the full gate.

## Independent critic protocol

1. Critic A reviews as a senior designer and freezes scores, visible evidence, hard failures, and prioritized changes.
2. Critic B reviews independently as a brand/creative director without seeing Critic A.
3. Both totals are recomputed from dimensions. Each score cites an observable region/slide.
4. Any hard failure forces rebuild/revision. If either critic is missing, the set is blocked.
5. A score gap greater than 8 points triggers adjudication while preserving both original reviews.
6. Both critics must meet the configured publication threshold and report no hard failure before the design can become a candidate.
7. Owner approval is still separate; creative critics cannot grant publishing authority.

## Technical and accessibility inspection

- Verify dimensions, file type, byte size, color profile, transparency, animation/audio behavior, and content hash.
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

Store the brief/version, exact copy hash, ordered asset hashes, licenses, font/RTL checks, both frozen critic records, adjudication if any, approved candidate ID, and owner approval scope. Re-rendering or changing copy/assets invalidates the previous visual/owner approval until hashes are reviewed again.
