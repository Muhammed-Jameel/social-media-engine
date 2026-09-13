# AURENDOR Creative Failure Analysis

**Artifact status:** Active rebuild baseline  
**Audit date:** 2026-08-23  
**Brand version:** `final-2026.1`  
**Decision:** `PRODUCTION_VISUAL_GENERATION_BLOCKED`  
**Scope:** Current renderer, creative evaluator, workflow wiring, native creative skills, three current benchmarks, imported September output, canonical brand data, and the professional reference-corpus inventory.

## Executive finding

The current system is safe enough to prevent several technical mistakes, but it is not yet a professional creative system. The implemented path is a two-layout deterministic SVG template with metadata-based checks. It does not faithfully execute the design brief, generate or select competing concepts, retrieve professional design knowledge, create bespoke visual assets, perform real revisions, or run independent pixel-grounded critics.

The resulting work is usually legible and on-palette, yet it looks amateur because correctness has been mistaken for creative quality. A logo, canonical green, accessible SVG tags, short copy, and a technically valid canvas cannot establish concept, composition, Arabic typographic craft, depth, originality, or professional polish.

Normal visual production must remain paused until every release blocker in this report is closed with rendered evidence. Prompt wording alone cannot close any blocker.

## Evidence base

The findings below are grounded in the following repository evidence:

- Renderer and deterministic evaluator: [`packages/engine/src/creative.ts`](../../packages/engine/src/creative.ts)
- Renderer tests: [`packages/engine/src/creative.test.ts`](../../packages/engine/src/creative.test.ts)
- Workflow implementation: [`packages/engine/src/workflows.ts`](../../packages/engine/src/workflows.ts)
- Runtime schemas: [`packages/schemas/src/index.ts`](../../packages/schemas/src/index.ts)
- Imported-brief construction: [`packages/db/src/importer.ts`](../../packages/db/src/importer.ts)
- Native art-direction skill: [`skills/aurendor-art-direction/SKILL.md`](../../skills/aurendor-art-direction/SKILL.md)
- Native design-production skill: [`skills/aurendor-social-design/SKILL.md`](../../skills/aurendor-social-design/SKILL.md)
- Native critique skill: [`skills/aurendor-design-critique/SKILL.md`](../../skills/aurendor-design-critique/SKILL.md)
- Canonical visual system: [`data/brand/visual-system.yaml`](../../data/brand/visual-system.yaml)
- Previous rubric: [`data/brand/creative-rubric.yaml`](../../data/brand/creative-rubric.yaml)
- Benchmark manifest and review: [`artifacts/creative-benchmarks/manifest.json`](../../artifacts/creative-benchmarks/manifest.json), [`visual-review-2026-08-23.json`](../../artifacts/creative-benchmarks/visual-review-2026-08-23.json)
- Current benchmark rasters: [`01-ar-system-light.png`](../../artifacts/creative-benchmarks/01-ar-system-light.png), [`02-ar-ai-dark.png`](../../artifacts/creative-benchmarks/02-ar-ai-dark.png), [`03-en-operating-system-light.png`](../../artifacts/creative-benchmarks/03-en-operating-system-light.png)
- Imported production examples: [`apps/web/public/demo-content`](../../apps/web/public/demo-content)
- Reference-corpus inventory: [`design-intelligence/corpus/manifest.json`](../corpus/manifest.json), [`clusters.json`](../corpus/clusters.json), [`00-cluster-overview.jpg`](../corpus/contact-sheets/00-cluster-overview.jpg)

The corpus inventory records 1,296 primary top-level reference images and explicitly states that its computational clusters are similarity neighborhoods rather than finished design-taxonomy labels. The inventory is useful infrastructure, but inventory alone is not evidence that the production path has learned professional design principles.

## Failure chain

```text
content objective
  -> thin string-based brief
  -> most brief fields discarded
  -> one of two fixed SVG layouts
  -> source metadata validates itself
  -> identical 88.5 diagnostic score
  -> no current-hash independent pixel critics
  -> generic output remains uncorrected
```

The system therefore fails upstream at concept development, in the middle at visual production, and downstream at evaluation. Moving elements or strengthening a prompt cannot repair the whole chain.

## Evidence-linked root causes

### CF-01 — The production renderer discards the design brief

**Severity:** Critical

`DeterministicSvgProvider.create()` maps the first copy line to a headline, joins remaining lines as support, truncates the communication goal into a kicker, derives only light/dark mode, and passes dimensions. It ignores the focal point, hierarchy, image direction, typography direction, whitespace target, reference IDs, mobile constraints, forbidden clichés, and most of the visual concept (`creative.ts`, approximately lines 480–495).

**Visible consequence:** Different strategies resolve to the same poster skeleton. The design cannot express a product story, conceptual metaphor, data narrative, character scene, case study, before/after transformation, or content-specific visual mechanism.

**Required systemic control:** Persist and execute a structured scene/art-direction plan. Production must prove that every selected concept, composition zone, hierarchy weight, imagery requirement, reference principle, and Arabic rule was either implemented or explicitly blocked.

### CF-02 — The renderer is a template, not a design system

**Severity:** Critical

`renderSocialSvg()` supports only `editorial` and `system_map`. Both share a fixed outer frame, logo placement, top metadata, kicker and underline, headline/support zones, rounded action rail, plus icon, and bottom metadata (`creative.ts`, approximately lines 226–307).

**Visible consequence:** Copy and color change, but the composition remains recognizable as the same template. Fixed decorative furniture consumes attention without responding to message or purpose.

**Required systemic control:** Replace the monolithic template with a scene graph and constrained layout families. A family supplies grammar, not coordinates. Candidate concepts must be materially different before a family is selected.

### CF-03 — Revision is a no-op

**Severity:** Critical

`revise()` creates a new ID and stores revision instructions, but it preserves the previous SVG unchanged (`creative.ts`, approximately lines 498–503).

**Visible consequence:** Critique cannot improve the pixels. Revision lineage can appear to advance while the actual asset remains unchanged.

**Required systemic control:** A revision must mutate the scene graph or regenerate the concept, produce a new raster hash, and include a pixel diff plus resolved/unresolved critique findings. Two unsuccessful targeted revisions must force concept restart.

### CF-04 — Creative workflow steps are labels, not executed agents

**Severity:** Critical

The workflow names `art-direction`, `design`, `render`, and `dual-critique`, but the default executor returns the same offline-safe note and lets steps advance without the required artifacts (`workflows.ts`, approximately lines 7–12 and 75–80). The native skills describe strong processes, but no runtime service wires them to artifact-producing step handlers.

**Visible consequence:** The existence of skill files creates the appearance of a professional pipeline without changing the output.

**Required systemic control:** Each workflow step must have a typed executor, required input refs, persisted output artifact, model/provider version, and blocking failure behavior. A missing adapter or critic must produce `BLOCKED`, never successful completion.

### CF-05 — The evaluator scores metadata rather than pixels

**Severity:** Critical

The current evaluator awards full hierarchy when expected SVG role strings exist, full typography when font-family names appear, full composition when a content group exists, full brand distinctiveness when palette metadata and a logo fingerprint exist, and full whitespace from copy length (`creative.ts`, approximately lines 400–457). Concept originality, graphic quality, and polish are constants. All three benchmarks therefore receive the same `88.5` diagnostic score.

Contrast is calculated from self-declared SVG metadata rather than foreground/background pixels. Copy presence is inferred from a self-declared hash rather than OCR or visible glyphs. Font validation proves declaration, not loading or embedding.

**Visible consequence:** A generic or visually broken composition can score strongly when its source contains the expected tags.

**Required systemic control:** Deterministic QA must become binary technical preflight only. Aesthetic scoring must inspect original-resolution and mobile-scale pixels. Source metadata may help locate evidence but cannot be evidence of visual quality.

### CF-06 — Near-duplicate detection is exact-hash detection

**Severity:** High

`duplicateCreativeFingerprints()` compares full SVG SHA-256 values. Any changed text, color, or minor coordinate produces a different hash, even when the composition is visibly the same. This contradicts the existing rubric, which lists unjustified near-duplicate creative as a hard failure.

**Visible consequence:** Repeated templates pass the anti-duplication gate and create feed fatigue.

**Required systemic control:** Store text/color-independent structural signatures plus perceptual and visual embeddings. Compare candidates with the recent 30-post window and evaluate 3-, 9-, and 12-post feed simulations.

### CF-07 — The current brief schema cannot carry professional art direction

**Severity:** High

The runtime `DesignBriefSchema` is primarily free-form strings and lists (`packages/schemas/src/index.ts`, approximately lines 168–186). It cannot represent multiple concept candidates, the one-second takeaway, visual metaphor, element relationships, focal weights, eye path, explicit grid zones, authored line breaks, foreground/midground/background, materials, lighting, anthropomorphism level, micro-craft, or reference-safe transfer principles.

The normative skill output document and runtime schema also use materially different field vocabulary, creating contract drift.

**Visible consequence:** Even a capable art director cannot transmit enough structured intent to a renderer, evaluator, or revision engine.

**Required systemic control:** Version a richer brief contract and reject under-specified briefs before rendering.

### CF-08 — Professional references are not yet interpreted or retrieved per post

**Severity:** High

The deterministic corpus inventory now exists and preserves the reference library as read-only. Its own limitations correctly state that clusters require art-director interpretation. There is not yet evidence of curated exceptional references, multi-dimensional professional annotations, reusable principles, golden quality anchors, or per-post retrieval wired into production.

**Visible consequence:** The system has no calibrated answer to “why does this design work?” and defaults to generic notions such as a systems motif or editorial field.

**Required systemic control:** Complete multimodal/human interpretation, store principles with applicability and contraindications, select golden anchors, and retrieve 3–10 relevant references by purpose, composition, density, language, and visual family. References must supply principles, never compositions to recreate.

### CF-09 — Arabic handling is directional, not typographic

**Severity:** High

Arabic is detected by a Unicode regex. Text is wrapped by JavaScript character count, headline size has only two states, and RTL lines use a computed center anchor rather than an authored Arabic composition (`creative.ts`, approximately lines 132–170 and 248–282). Benchmark SVGs declare the fonts but do not embed them.

**Visible consequence:** Arabic line breaks, rhythm, punctuation, numerals, optical alignment, weight, and balance are incidental. A browser smoke check can prove shaping in one renderer but not professional Arabic typography.

**Required systemic control:** Use loaded and embedded production fonts, glyph-aware measurement, deliberate line breaks, orphan checks, punctuation/numeral rules, true RTL eye paths, and an independent Arabic design reviewer.

### CF-10 — The brand system supplies tokens but not a complete visual world

**Severity:** High

The canonical system provides strong palette, grid, typography, and personality constraints, while imagery is still marked `founder-direction-not-final` and falls back to illustrations or system diagrams (`data/brand/visual-system.yaml`, approximately lines 45–54).

**Visible consequence:** The renderer mistakes green, logo, frames, cards, and systems linework for brand distinctiveness. There is no durable grammar for visual storytelling, materials, lighting, depth, character behavior, image treatment, or anthropomorphism.

**Required systemic control:** Define AURENDOR’s visual grammar and a premium hybrid anthropomorphic system before adopting a permanent mascot. Brand recognition must survive logo removal.

### CF-11 — The rubric underweights the missing qualities

**Severity:** High

The prior 100-point rubric gives only 6 points to graphic quality and 3 to polish. It does not independently weight professional plausibility or distinctiveness at the level required by the rebuild mission.

**Visible consequence:** Technically clean template work can approach a strong band without professional craft, conceptual storytelling, or AURENDOR-specific visual thinking.

**Required systemic control:** Use the 160-point professional rubric: concept, composition, typography, visual craft, brand, communication, professional polish, and distinctiveness at 20 points each. Numeric scores remain subordinate to hard failures and pairwise evidence.

## Current benchmark observations

### `01-ar-system-light`

- The right-side thesis, left-side process boxes, support copy, and action rail read as separate islands.
- “Decide–execute–measure” is a generic process diagram rather than a visual answer to the tension between disconnected tools and one operating system.
- The diagram improves balance relative to the earlier empty counter-field but adds information rather than a memorable visual story.
- Latin operational labels compete with an Arabic-first composition without an explicit bilingual hierarchy.

### `02-ar-ai-dark`

- The large counter-field is visually inactive.
- Nested rounded lines are decorative; they do not demonstrate decision speed, execution quality, or evidence.
- The visual idea is essentially “dark green technology poster,” not operational AI made visible.
- The plus icon and slogan rail have no meaningful semantic relationship.

### `03-en-operating-system-light`

- It reuses the editorial structure and nested motif from `02`.
- The motif does not explain how strategy, product, data, and AI connect.
- Large empty zones lack productive tension, a focal object, or a second layer of discovery.
- It is clear and readable but indistinguishable from a restrained SaaS template.

The dated review correctly leaves the current hashes at `REVISE`, with zero independent current-hash critics complete. This is an explicit release block, not a documentation detail.

## Old-output observations

The imported September work is not a single failure mode. It contains both reusable lessons and systemic problems.

### Repetition and template signals

A read-only structural comparison of the first PNG from each of 29 imported post/story directories used 27×34 grayscale samples. It found:

- a nine-cover near-identical composition cluster at normalized RMSE `<= 0.08`;
- a five-story near-identical cluster at normalized RMSE `<= 0.05`.

This is a diagnostic heuristic, not a final perceptual taxonomy, but it matches pixel inspection. The repeated cover family uses the same header/logo, category label, oversized Arabic headline, short body line, `اسحب` pill, pale rounded icon tray, corner treatment, and footer. The icons and words change while the visual grammar does not.

Examples include the first slides of `W1-P3`, `W2-P1`, `W2-P3`, `W2-P4`, `W3-P1`, `W3-P2`, `W3-P3`, `W4-P1`, and `W4-P3`.

### Craft and communication failures

- `W3-P5` is the known hard-fail example: overcrowded comparison cards, weak edge safety, poor rhythm, and insufficient hierarchy.
- Several covers use generic outline icons as content substitutes. The icon rows describe topics but do not tell stories.
- “Swipe” pills and repeated frames behave like permanent template furniture rather than message-driven affordances.
- Some text blocks approach edges or collide optically with panels, indicating layout by static coordinates rather than measured type.
- Repetition across carousels and stories creates feed fatigue even when individual slides remain legible.

### Useful positive evidence

- `W1-P1`, `W1-P4`, and `W2-P2` gain relevance from product-interface context, dimensional crop, and a message-specific visual anchor.
- `W4-P6-brand` has one dominant 3D object, stronger atmosphere, and a clearer first-glance focal point.

These examples are not professional golden references and should not be copied. They demonstrate useful principles: real product context, one dominant object, deliberate crop, depth, and atmosphere outperform generic icon trays and empty system geometry.

## Required systemic controls

| Control | Enforcement evidence |
|---|---|
| Typed creative step executors | Every workflow step persists its required schema-valid artifact or blocks. |
| Multi-concept gate | At least three materially different concepts for benchmark/important posts; pairwise selection recorded before polish. |
| Professional-reference retrieval | 3–10 task-relevant principle records with rationale and anti-copy instruction. |
| Scene-graph production | Selected concept and composition relationships survive into the generated source. |
| Bespoke asset route | Conceptual illustration, real UI, 3D, photography, or image generation used when the idea requires it. |
| Production typography proof | Embedded/loaded font hashes, measured bounds, authored line breaks, and mobile raster evidence. |
| Pixel-grounded technical QA | OCR, clipping, dimensions, actual contrast, safe zones, corruption, and licenses checked on exports. |
| Independent professional critics | Art director, graphic designer, social strategist, plus Arabic reviewer when relevant. |
| 160-point rubric | Visible evidence for every dimension; hard failures override scores. |
| Pairwise professional calibration | Candidate-vs-candidate and candidate-vs-relevant-professional-anchor decisions with reasons. |
| Structural repetition control | Text-independent structure plus perceptual similarity across recent posts and feed simulations. |
| Bounded revision loop | Targeted revisions mutate pixels; repeated failure regenerates the concept. |
| Hash-bound approval | Any pixel/copy/font/asset change invalidates prior visual approval. |

## Explicit release blockers

The visual-generation workflow may not resume normal production while any blocker remains open.

1. **RB-01 — Production pause is not technically enforced.** Add an auditable creative-generation pause that still permits research and isolated benchmark experiments.
2. **RB-02 — Corpus interpretation is incomplete.** Inventory/clustering exists; exceptional-reference review, professional taxonomy, principle extraction, and golden-anchor selection remain required.
3. **RB-03 — Reference retrieval is not wired into art direction.** Demonstrate per-post retrieval and reference-safe use in persisted briefs.
4. **RB-04 — Art direction is not an executable service.** Produce structured, schema-valid multiple concepts and selected rationale through the actual workflow.
5. **RB-05 — Renderer ignores most creative intent.** Demonstrate materially different concepts, families, imagery, depth, and compositions from identical copy.
6. **RB-06 — Revision does not change pixels.** Tests must prove targeted revision and concept restart create new, causally explained raster hashes.
7. **RB-07 — Arabic typography is not production-safe.** Embed fonts, measure glyphs, inspect mobile rasters, and obtain an independent Arabic design review.
8. **RB-08 — Qualitative evaluation is metadata-based.** Remove qualitative release authority from the deterministic evaluator and implement original-resolution pixel critics.
9. **RB-09 — The professional 160-point rubric is not enforced.** Implement evidence-citing critics, automatic rejection rules, pairwise comparison, and calibrated thresholds.
10. **RB-10 — Near-duplicate and feed-fatigue controls are absent.** Validate structural/perceptual similarity and 3-/9-/12-post feed rhythm.
11. **RB-11 — AURENDOR visual grammar and anthropomorphic direction are incomplete.** Approve a coherent premium system without prematurely fixing one mascot.
12. **RB-12 — Controlled benchmark has not passed.** Generate multiple candidates across the ten required content types, reject weak concepts, iterate strong ones, and inspect final rendered pixels.
13. **RB-13 — Old-vs-new improvement is unproven.** A blind or semi-blind comparison on identical briefs must decisively favor the rebuilt engine in concept, hierarchy, typography, craft, distinctiveness, brand fit, and communication.
14. **RB-14 — No approved AURENDOR golden set exists.** Select original, hash-bound outputs only after they pass professional comparison and all current-hash critics.

## Release decision rule

Passing tests, creating a corpus index, generating an image, exporting from Canva, or improving a prompt is not sufficient. Release requires:

1. all `RB-*` blockers closed with durable evidence;
2. no automatic-rejection pattern from [`forbidden-patterns.yaml`](../aurendor/forbidden-patterns.yaml);
3. all required critics reviewing the exact current raster hashes;
4. a professional-candidate score of at least `145/160`, with no hard fail;
5. a decisive blind old-vs-new win;
6. owner approval remaining separate from creative approval.

If the work would still look immediately amateur beside the relevant professional anchors, the release decision remains `BLOCKED` regardless of schedule, cost, or prior iteration count.
