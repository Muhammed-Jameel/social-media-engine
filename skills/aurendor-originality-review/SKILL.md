---
name: aurendor-originality-review
description: Check an AURENDOR concept or render for structural originality against retrieved references and recent work. Use before production selection and before professional approval; do not generate replacement art.
---

# AURENDOR Originality Review

## Exact job

Determine whether a candidate learned transferable principles or drifted into imitation, template reuse, or self-repetition. Originality is assessed structurally, not by asking whether pixels are identical.

## Required inputs

- Candidate concept/brief or current rendered asset and verified hash.
- Its declared reference-principle uses and `mustNotCopy` boundaries.
- Nearest retrieved references with reviewer-only pixels and annotations.
- Recent AURENDOR posts at 3/9/12-feed scope.

## Review dimensions

Compare independently:

- Core metaphor and storytelling mechanism.
- Focal topology, center of gravity, eye path, depth, and negative-space shape.
- Type scale, line-break silhouette, alignment, and type–image interaction.
- Hero subject, crop, perspective, material, lighting, and color behavior.
- Character silhouette/face/gesture when applicable.
- Sequence cadence and reveal structure.
- Repeated AURENDOR layout fingerprints across recent work.

Shared genre conventions or brand tokens are not automatically copying. A combination becomes unsafe when multiple distinctive relationships align closely enough that an informed viewer could identify the source solution.

## Decision

- **CLEAR:** principles are traceable, but composition and expression are independently resolved.
- **REVISE_DISTANCE:** one or more structural relationships are too close but the core concept can be re-authored.
- **REFERENCE_TOO_CLOSE:** distinctive composition/artwork/character/campaign logic is substantially reproduced; this is a critique hard fail and requires concept restart.
- **SELF_REPETITION:** the work is independent of external references but repeats a recent AURENDOR template/fingerprint without feed intent.

At brief stage, populate `nearestReferenceIds`, `reviewerRequired`, and a concrete rationale in `ProfessionalDesignBrief.originalityCheck`. At render stage, add visible evidence to the professional critique and use `REFERENCE_TOO_CLOSE` when warranted.

## Security boundary

Reference pixels are for authorized local review only. Never attach them to generators or expose source paths, filenames, designer/studio/project names, or imitation language in revision prompts. Rewrite feedback as general structural changes: alter topology, depth, crop logic, story mechanism, or type relationship.

## Quality gate

Pass only after comparing at least three structural dimensions against the nearest references and recent feed. Pixel hashes/perceptual hashes may find candidates but never decide originality alone.

## Failure behavior

If the candidate’s declared reference uses are missing, retrieve them before review. If reference pixels cannot be inspected, report reduced confidence and block a professional originality pass when similarity risk is material.

## Eval cases

1. **Different colors, same composition:** Not clear; color substitution does not create originality.
2. **Same brand grid, new story topology:** May be clear when distinctive reference relationships are absent.
3. **Perceptual hash says close:** Inspect visually before deciding.
4. **Unsafe result:** Restart concept without telling generation which named design to avoid copying.
