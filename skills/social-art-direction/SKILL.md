---
name: social-art-direction
description: Develop and tournament conceptually distinct, reference-informed SOCIAL_MEDIA_PLUGIN social directions, then issue a production-ready ProfessionalDesignBrief. Use before visual production; do not use for rendering or approval.
---

# SOCIAL_MEDIA_PLUGIN Art Direction v2

## Exact job

Turn approved strategy and exact copy into a strong visual idea, not a decorated layout. Retrieve design intelligence, answer the required art-direction questions, develop at least four radically different concepts, and select the professional choice through a recorded tournament.

Use the active FINAL 2026 identity and SOCIAL_MEDIA_PLUGIN visual grammar. References teach principles; they are never templates or generator inputs.

## Required inputs

- Approved content item, exact on-design copy, language, audience tension, perception shift, proof requirements, and desired action.
- Platform, dimensions, safe zones, sequence length, delivery constraints, and recent 3/9/12-post feed inventory.
- Effective brand tokens, typography, assets, licenses, and current visual-grammar/character-system versions.
- A design-intelligence retrieval result containing principle IDs, curated reference IDs, annotations, cluster IDs, relevance rationales, and rights state.
- Available production capabilities, including which bespoke asset modes can actually be rendered and edited.

If copy, evidence, or target format is provisional, stop with `needs_evidence`; do not build a concept around moving inputs.

## Design-intelligence retrieval

Query `design-intelligence` by purpose, visual family, language, imagery mode, anthropomorphism level, semantic tags, and target feed role. Retrieve only the smallest useful packet.

The packet must contain:

- At least three relevant references from more than one corpus cluster.
- For each reference: the learned principle, why it matters here, its limitation, and what must not be copied.
- Relevant composition, hierarchy, typography, Arabic, imagery, storytelling, color, and anthropomorphism principles.
- Current SOCIAL_MEDIA_PLUGIN visual grammar, forbidden patterns, and recent-feed repetition constraints.
- A deterministic knowledge/version hash.

If retrieval is sparse, use canonical SOCIAL_MEDIA_PLUGIN principles and record the gap. Never fill it by searching for one design to imitate.

Reference images remain local, read-only review evidence. Never attach corpus pixels to an image generator, expose corpus paths in a generation prompt, or include designer/studio/project names. Generation context may contain only sanitized learned principles and SOCIAL_MEDIA_PLUGIN-owned inputs.

## Fifteen decision questions

Answer all fifteen before selecting a concept. Keep the answers specific enough to reject a weak direction.

1. **Purpose:** What exact job is this post doing—education, proof, announcement, conversion, brand building, or another declared purpose?
2. **Audience tension:** What unresolved situation does the intended viewer already feel?
3. **Two-second takeaway:** What single meaning must survive a two-second mobile glance?
4. **Desired feeling:** What should the viewer feel, and what would be an off-brand emotional register?
5. **Single visual idea:** What one visual proposition carries the message without decorative explanation?
6. **Textless comprehension:** What can a viewer understand before reading, and what still requires copy?
7. **Metaphor:** What precise, message-specific metaphor makes an invisible system visible?
8. **Story mechanism:** What changes, reveals, resolves, contrasts, accumulates, or moves across the frame or sequence?
9. **Verbal–visual relationship:** Does the image demonstrate, counterpoint, complete, or reframe the words instead of repeating them?
10. **Focal architecture:** Where is the focal point, how much visual weight does it carry, and what is the eye path after it?
11. **Space and depth:** What are the foreground, middle ground, background, and purposeful negative-space zones?
12. **Typography:** What are the exact line breaks, display ratio, alignment, and interaction between type and imagery?
13. **Arabic decision:** For Arabic, how is the concept born RTL—including shaping, line rhythm, optical balance, and sequence order—rather than mirrored after the fact?
14. **Imagery and character:** Which imagery mode and licensed/original asset plan serve the idea, and what anthropomorphism level, if any, improves comprehension?
15. **Originality and feed role:** Which retrieved principles inform the direction, how is the result structurally different from every reference, and what 3/9/12-feed rhythm role does it fill?

## Concept exploration

Create **four to six** candidates. Four is a floor, not a target for cosmetic variants.

The set must use at least three visual families and three imagery modes. Change the metaphor, storytelling mechanism, focal architecture, depth model, and verbal–visual relationship—not just colors, crops, or type placement. A concept is ineligible when another candidate could be produced by swapping its hero asset or background.

Each candidate must specify the full `CreativeConceptCandidate` body, including:

- Two-second takeaway, textless comprehension, metaphor, story mechanism, and verbal–visual relationship.
- Visual family and imagery mode.
- Focal weight, center of gravity, eye path, grid, zones, depth, and negative-space purpose.
- Exact headline lines and Arabic-specific decision when applicable.
- Asset plan with provenance/license state.
- Anthropomorphism level, humanized behavior, face test, emotional register, comprehension benefit, capability boundary, and childishness risk.
- Three to six cluster-diverse `REFERENCE_ONLY` principle uses and an explicit anti-copy rationale.
- Professional-choice rationale, forbidden additions, and execution risks.

Disqualify any concept that depends on generic AI robots/brains, random gradients, arbitrary icons, meaningless decoration, an unlicensed asset, unsupported visual proof, a copied reference structure, or a permanent mascot introduced without approval.

## Concept tournament

1. Freeze candidate descriptions before comparison.
2. Run a diversity gate; merge or reject look-alike candidates before scoring.
3. Compare candidates pairwise under blind candidate IDs for concept strength, communication, distinctiveness, SOCIAL_MEDIA_PLUGIN fit, Arabic integrity, professional potential, asset feasibility, and feed contribution.
4. Record at least a semifinal and final comparison; use a round-robin when candidates are close.
5. Select one winner, or at most two when production must resolve a genuine execution uncertainty.
6. Record why every non-winner lost. “Less preferred” is not a reason.
7. Run `social-originality-review` on the winner. For anthropomorphic work, also run `social-anthropomorphic-art-direction`; for Arabic, run `social-arabic-design-review` at brief stage.

If no candidate is professionally promising, return to concept exploration. Do not crown the least weak option.

## Production brief

Return `ProfessionalDesignBrief` from `@social-media-plugin/schemas` (`packages/schemas/src/index.ts`) and follow [ProfessionalDesignBrief](../references/output-contracts.md#professionaldesignbrief-packagesschemassrcindexts).

The winning brief must preserve the tournament, knowledge version, exact line breaks, reference-principle uses, originality check, recent-feed constraints, buildable composition zones, asset plan, and alternate route for any uncertain capability. Production receives sanitized principles and owned/licensed assets—not corpus files, source names, or imitation instructions.

## Hard boundaries

- Do not copy a reference’s composition, artwork, character, type treatment, distinctive crop, or campaign system.
- Do not provide raw corpus pixels, filenames, local paths, studio names, or project names to a generator.
- Do not let the FINAL 2026 palette substitute for a visual concept.
- Do not ask production to invent, translate, or paraphrase approved text.
- Do not force every post into one template family; coherence comes from grammar, not repeated geometry.
- Do not make photography canonical while its brand status remains unresolved.
- Do not approve a future render from a brief.

## Quality gate

Pass only when all fifteen questions are answered, at least four candidates are materially distinct, the tournament has a defensible winner, every reference use is principle-level and anti-copy, Arabic is composed natively when present, the asset plan is feasible, and the selected direction improves the recent feed rather than repeating it.

## Failure behavior

Block on provisional copy, unresolved rights, unsupported claims encoded visually, or missing target dimensions. If retrieval returns fewer than three safe and relevant references, continue from canonical principles and flag reduced retrieval confidence. If two revision cycles later reveal that the concept itself is weak, reopen the tournament or generate new candidates; do not keep patching the losing idea.

## Eval cases

1. **One idea in four palettes:** Fail; the candidates are not structurally distinct.
2. **Single admired reference:** Pass only if retrieval diversifies the evidence and the concept cannot be mistaken for that reference.
3. **Arabic carousel:** Pass only if Question 13 drives grid, hierarchy, line breaks, and sequence from the start.
4. **Weak field:** Pass only if the tournament rejects every weak candidate instead of selecting by default.
5. **Generator prompt:** Pass only if it contains learned principles and SOCIAL_MEDIA_PLUGIN-owned direction, with no corpus pixel/path/name leakage.
