---
name: aurendor-arabic-design-review
description: Review Arabic-first visual structure and rendered Arabic typography for AURENDOR social creative. Use for brief preflight or as the Arabic critic on current pixels; do not translate copy or approve alone.
---

# AURENDOR Arabic Design Review

## Exact job

Protect Arabic as a primary design language. At brief stage, test whether the proposed system is genuinely RTL and buildable. At render stage, inspect the current pixels and return the `ARABIC_DESIGN_REVIEWER` perspective for the professional critique panel.

## Required inputs

- Approved Arabic copy and exact line breaks, locale/register, and any bilingual tokens.
- Design brief or current rendered asset bytes plus verified SHA-256.
- Approved Arabic font and fallback policy.
- Platform dimensions, original/mobile views, safe zones, and sequence order.

## Brief preflight

Check that the concept begins RTL rather than mirroring an LTR layout. Require an explicit right-to-left eye path, Arabic headline scale/rhythm, optical alignment, focal relationship, line-break rationale, mixed-script strategy, and carousel progression. Block a brief that plans to “fit Arabic later.” A brief preflight never approves future pixels.

## Pixel review

Inspect original and mobile pixels for:

- Correct joining, ligatures, glyph forms, diacritics, punctuation, numerals, and mixed-direction ordering.
- No tracking, broken shaping, clipped ascenders/descenders, accidental kashida, or line-edge collisions.
- Natural line breaks and balanced rag; do not accept a grammatical line that is visually weak or a visually tidy line that breaks meaning.
- Optical alignment and density, not just mechanical box alignment.
- True RTL hierarchy and sequence; Latin tokens must not hijack the eye path.
- Arabic legibility at mobile size without shrinking it below the visual idea.
- Cultural and professional tone without ornamental clichés or pseudo-Arabic forms.

Use deterministic OCR/font checks as evidence, never as a substitute for inspecting pixels.

## Output

At brief stage, return explicit pass/block findings tied to brief fields. At render stage, return one `ProfessionalCritique` with `criticRole: ARABIC_DESIGN_REVIEWER`, the current hash, actual-pixels flag, original/mobile viewing scales, evidence regions, full 160-point scores, Arabic hard fails, anchor comparison, and restart advice. It joins—but cannot replace—the other independent critics.

## Hard boundaries

- Do not translate or rewrite approved copy to solve layout pressure.
- Do not infer correct shaping from source text, DOM direction, or font metadata.
- Do not approve a low-resolution thumbnail.
- Do not treat right alignment as proof of Arabic-first design.
- Do not let a high total override `UNREADABLE_ARABIC` or `POOR_TYPOGRAPHY`.

## Failure behavior

Block when exact text, current bytes/hash, approved font state, or a mobile view is missing. Route disputed wording to the Arabic copywriter. When the layout architecture is the cause, request concept/layout restart rather than endless font-size reduction.

## Eval cases

1. **Correct source text, broken render:** Hard fail from pixels.
2. **Right-aligned English layout:** Block at brief stage; it is not Arabic-first.
3. **One Latin acronym:** Pass only if bidi order and eye path remain intentional.
4. **Tiny but technically readable Arabic:** Score mobile communication/typography low; technical presence is not quality.
