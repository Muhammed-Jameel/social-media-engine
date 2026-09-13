# AURENDOR Creative Quality Rubric

**Status:** active benchmark specification; production enforcement still requires end-to-end workflow evidence  
**Scale:** `160` points, eight dimensions × `20`  
**Professional-candidate threshold:** `145/160` from **every** required critic  
**Precedence:** hard failures and professional-anchor comparisons override numeric totals

## Purpose

This rubric distinguishes professional visual judgment from technical validity.

The previous evaluator gave aesthetic credit for SVG tags, declared colors, font-family strings, copy length, and fixed constants. That can verify metadata presence, but it cannot see hierarchy, Arabic shaping, material craft, originality, or whether a composition looks like a generic template. The failure is documented in [CREATIVE_FAILURE_ANALYSIS.md](./CREATIVE_FAILURE_ANALYSIS.md).

The new contract requires independent critics to inspect the final rendered pixels at the exact current hash. The runtime schemas are implemented in [packages/schemas/src/index.ts](../../packages/schemas/src/index.ts), including `ProfessionalCreativeScoreSchema`, `ProfessionalCritiqueSchema`, `PairwiseCreativeComparisonSchema`, and `ProfessionalCritiqueSetSchema`.

## Evidence preconditions

No qualitative score is valid unless the critic receives and records:

- the final rendered asset ID and SHA-256;
- the original-resolution pixels;
- a representative mobile-size render;
- a thumbnail or feed view when relevant;
- the communication objective, audience, and selected design brief;
- active AURENDOR visual rules;
- `2–5` relevant professional anchors, selected for the dimensions being compared;
- asset, UI, photography, generated-image, and font provenance;
- the current revision lineage;
- independence from the design-generating role.

For Arabic, the exact-current-hash review also requires an Arabic Design Reviewer and the font/shaping evidence specified in [ARABIC_DESIGN_RULES.md](./ARABIC_DESIGN_RULES.md).

Any change to pixels, copy, line breaks, font file, weight, imagery, dimensions, or asset invalidates every prior visual approval.

## Technical preflight is separate

Deterministic checks produce binary facts, not aesthetic points. Preflight should verify, where applicable:

- dimensions, color mode, corruption, and file readability;
- expected copy visible through OCR or equivalent pixel evidence;
- clipping, safe zones, and minimum-size requirements;
- actual pixel contrast at relevant text/background regions;
- font files loaded and expected weights available;
- Arabic shaping and mixed-script order;
- provenance, license, watermark, and product-UI source state;
- exact hashes and revision lineage;
- structural/perceptual similarity candidates;
- required preview and critic artifacts present.

A failed technical preflight blocks qualitative release. A passed preflight says only that the asset can be judged.

## Scoring method

Each dimension is scored from `0–20` using visible evidence. A critic must cite regions and observations rather than infer quality from a prompt or source tree.

Use these common anchors:

| Score | Meaning |
|---:|---|
| `0–4` | Broken, absent, misleading, or fundamentally inappropriate |
| `5–9` | Major professional deficiencies; concept or execution requires restart |
| `10–13` | Functional but visibly generic, inconsistent, or underdeveloped |
| `14–16` | Strong in parts; credible revision candidate, still below the professional anchor |
| `17–18` | Professional candidate quality for this dimension, supported by evidence |
| `19–20` | Exceptional, highly resolved, and clearly above the relevant comparison bar |

A `20` is not “no obvious mistakes.” It represents unusually strong judgment and execution. Scores should not cluster at identical values across different designs without specific evidence.

## Eight dimensions

### 1. Concept — 20

Evaluate:

- specificity and originality of the central idea;
- relevance to the communication objective and audience tension;
- two-second visual takeaway;
- strength of metaphor, state change, evidence, or narrative;
- textless comprehension;
- how verbal and visual ideas complete rather than duplicate one another;
- whether the chosen medium strengthens the idea;
- whether anthropomorphism, if used, is necessary and truthful.

High score evidence: one observable, message-specific visual verb; a memorable tension or transformation; a professional reason for every major choice.

Low score evidence: aesthetic labels presented as concepts, copy placed on a background, generic AI shorthand, icon collections, or a story that disappears when the headline is hidden.

### 2. Composition — 20

Evaluate:

- focal dominance and center of gravity;
- first, second, and third fixation;
- balance, asymmetry, tension, and counterweight;
- eye path and element relationships;
- foreground, action plane, background, and purposeful depth;
- negative space with a declared role;
- crop, overlap, framing, perspective, and edge relationships;
- grid discipline and concept-earned grid breaks;
- resilience at original, mobile, and feed sizes.

High score evidence: the eye enters decisively, moves causally, and returns to the focal idea; space, scale, and depth explain the message.

Low score evidence: disconnected islands, arbitrary centering, dead space, equal cards, fixed template furniture, or an off-frame eye path.

### 3. Typography — 20

Evaluate:

- type choice and proven production rendering;
- display and support hierarchy;
- authored line breaks and line silhouettes;
- scale contrast, weight, leading, measure, and optical alignment;
- one coherent emphasis logic;
- type–image interaction;
- punctuation, numerals, and mixed-script behavior;
- Arabic joins, shaping, RTL composition, and cultural fluency when relevant;
- readability at mobile size.

High score evidence: type is inseparable from the composition, loaded from verified files, and remains clear at every review scale.

Low score evidence: metadata-only font proof, character-count wrapping, fallback glyphs, cramped copy, equal weights, arbitrary tracking, or Arabic pasted into an LTR shell.

### 4. Visual craft — 20

Evaluate:

- masks, edges, contacts, occlusion, and cutouts;
- perspective, scale, light direction, shadow, reflection, and depth of field;
- alignment, spacing rhythm, strokes, radii, and optical corrections;
- material and texture consistency;
- generated-image anatomy and artifact integrity;
- product UI or data fidelity;
- image resolution, grading, and compositing;
- character construction and recurrence consistency;
- whether micro-detail reinforces evidence or atmosphere.

High score evidence: boundary regions remain physically coherent under original-resolution inspection; small decisions support the concept without clutter.

Low score evidence: halos, floating contacts, broken hands, fake UI, inconsistent light, random grain, soft low-resolution assets, arbitrary decorative controls, or uncorrected generator artifacts.

### 5. Brand — 20

Evaluate:

- AURENDOR recognizability with the logo hidden;
- fit with Operational Intelligence and Digital Civilization;
- material, light, color-state, and typographic behavior;
- Arabic authority and regional credibility;
- sophistication, trust, precision, ambition, and technological depth;
- correct active brand version, logo, type, and palette;
- feed-level consistency without a repeated layout.

High score evidence: the world feels AURENDOR before the mark; the logo acts as a quiet signature.

Low score evidence: brand quality depends on green and logo presence, archived systems are mixed, or a provider's generic style overwhelms AURENDOR.

### 6. Communication — 20

Evaluate:

- message comprehension within roughly two seconds;
- audience relevance and emotional fit;
- claim/evidence distinction;
- readability and information density;
- clear role of CTA, if one is needed;
- platform and format suitability;
- carousel or sequence progression;
- honest capability boundaries and source claims;
- usefulness after the novelty of the image is removed.

High score evidence: the viewer understands what changed, why it matters, and what to do next without reading a caption to decode the visual.

Low score evidence: topic labeling, excessive copy, unsupported metrics, irrelevant CTA, missing evidence, or a visually impressive scene that communicates the wrong promise.

### 7. Professional polish — 20

Ask: **Could an experienced designer or agency plausibly have produced and presented this as final work?**

Evaluate the integrated result:

- resolution of large and micro decisions;
- absence of unfinished or accidental regions;
- consistency across type, image, material, light, spacing, and export;
- restraint and confidence;
- quality at original and mobile sizes;
- plausibility beside the relevant professional anchors;
- whether revision findings were actually resolved in the current pixels.

High score evidence: no weak seam betrays the process; execution elevates the concept.

Low score evidence: technically clean but synthetic output, template polish without judgment, one refined region beside several unfinished ones, or revision notes without changed pixels.

### 8. Distinctiveness — 20

Ask: **Was this designed specifically for AURENDOR and this message, or could it be generic AI/Canva/SaaS content?**

Evaluate:

- ownability of the visual mechanism;
- originality relative to recent AURENDOR work and nearest references;
- AURENDOR-specific use of operational behavior, Arabic voice, material, and charged state;
- difference in focal geometry and structure from the recent feed;
- resistance to category clichés;
- absence of copied compositions, characters, motifs, or trade dress.

High score evidence: the composition cannot accept unrelated copy without losing its logic and remains recognizable with the logo hidden.

Low score evidence: swap-ready template, generic premium-tech glow, common AI symbols, repeated feed silhouette, or reference-specific expression recolored for AURENDOR.

## Decision bands

| Total | Individual critic decision | Meaning |
|---:|---|---|
| `<120` | `REJECT` | Concept or execution is below the rebuild bar; restart is normally required |
| `120–134` | `MAJOR_REVISION` | Material problems remain; one bounded revision may be appropriate |
| `135–144` | `INSUFFICIENT` | Strong or “good,” but not professional enough for release |
| `145–151` | `PROFESSIONAL_CANDIDATE` | May advance only if every other gate and critic also passes |
| `152–160` | `EXCELLENT` | Exceptional candidate; still subject to hard fails, rights, originality, hash, and owner approval |

A high average is insufficient. For a critique set to be `PROFESSIONAL_CANDIDATE` or `EXCELLENT`, **every required critic** must independently:

- score at least `145`;
- record no hard fail;
- inspect the exact current hash;
- compare the asset as `comparable` or `above` the relevant professional anchors.

Professional quality cannot be awarded by rounding, averaging away a specialist failure, or substituting owner approval for creative critique.

## Automatic hard failures

Any hard failure forces `REJECT`, regardless of total:

- `OBVIOUS_TEMPLATE_APPEARANCE`
- `GENERIC_AI_ROBOT`
- `UNREADABLE_ARABIC`
- `ARBITRARY_ICON`
- `POOR_TYPOGRAPHY`
- `WEAK_HIERARCHY`
- `EXCESSIVE_TEXT`
- `RANDOM_GRADIENT`
- `MEANINGLESS_DECORATION`
- `LOW_RESOLUTION_IMAGERY`
- `BROKEN_PERSPECTIVE`
- `AI_ARTIFACT`
- `INCONSISTENT_CHARACTER`
- `LOGO_MISUSE`
- `NO_FOCAL_POINT`
- `NO_VISUAL_CONCEPT`
- `CHILDISH_ANTHROPOMORPHISM`
- `REFERENCE_TOO_CLOSE`
- `UNLICENSED_ASSET`

Pipeline-level failures—such as metadata self-approval, a missing current-hash critic, or an unverified font—produce `BLOCKED`, not a provisional creative score. The detailed observable patterns and controls are in [forbidden-patterns.yaml](../aurendor/forbidden-patterns.yaml).

## Required independent critics

### Senior Art Director

Primary emphasis: concept, storytelling, relevance, originality, brand world, capability truth, and whether execution serves the idea.

### Senior Graphic Designer

Primary emphasis: composition, grid, typography, spacing, craft, materials, edge integrity, and export finish. Must cite at least two high-risk boundary regions for image-led work.

### Social Performance Strategist

Primary emphasis: first-frame attention, two-second comprehension, format behavior, sequence logic, CTA role, mobile legibility, and likely feed fatigue. Engagement prediction cannot override brand quality.

### Arabic Design Reviewer

Required for every Arabic asset. Primary emphasis: language naturalness, line breaks, shaping, RTL hierarchy, mixed-script behavior, optical balance, cultural fit, and final-pixel typography.

Critic roles must be unique and independent. The implementer or generating agent cannot be the only reviewer.

## Evidence format

Every individual critique records:

- critic role and critique ID;
- rendered asset ID and SHA-256;
- viewing scales;
- all eight dimension scores and recomputed total;
- at least four region-specific evidence observations;
- strengths and weaknesses;
- hard failures;
- `2–5` professional anchor IDs;
- `materially-below`, `below`, `comparable`, or `above` anchor verdict;
- observable comparison differences;
- bounded revision instructions;
- whether the concept must restart;
- final decision.

Evidence should name visible locations such as “upper-right Arabic headline,” “foreground object contact,” or “mobile-size lower evidence line.” Vague statements such as “make it more premium” are invalid.

## Pairwise evaluation

Absolute scoring is supplemented with blind or semi-blind pairwise comparisons:

- candidate A vs candidate B;
- tournament winner vs alternate concept;
- new-engine output vs old-engine output on the identical brief;
- candidate vs relevant professional anchor for quality, not stylistic similarity.

The record must name a winner for each rubric dimension and at least three reasons. `tie-neither-professional` is required when neither candidate clears the bar; a forced winner must not be mistaken for approval.

The rebuilt engine must win the old-vs-new comparison decisively across concept, hierarchy, typography, polish, originality, brand fit, and communication before autonomy resumes.

## Revision policy

A revision is valid only when it:

- addresses named evidence observations;
- changes the rendered pixels and SHA-256;
- records a pixel diff or equivalent region evidence;
- identifies resolved and unresolved finding IDs;
- invalidates old critiques;
- triggers fresh original/mobile review.

Allow at most two targeted revisions of one concept. Repeated failure, a hard fail, or a weak central idea forces concept rejection and return to art direction. Moving, resizing, or recoloring the same weak composition indefinitely is prohibited.

## Feed-level quality gate

Review candidates inside `3`, `9`, and `12`-post simulations. Evaluate:

- repeated structural silhouette;
- center-of-gravity and crop variety;
- color-field and intensity balance;
- information-density rhythm;
- anthropomorphism-level variety;
- content-purpose diversity;
- recognition without logo dependence;
- cumulative visual fatigue.

A post that passes alone may still fail the feed. Exact SHA inequality does not prove structural variety.

## Golden-set admission

An asset can enter the AURENDOR golden set only after it passes this entire contract, decisively beats the old engine on an identical brief, and receives separate owner approval bound to the current hash. No present AURENDOR output has passed that standard. The distinction between professional reference anchors and original AURENDOR gold is maintained in [GOLDEN_SET.md](./GOLDEN_SET.md).
