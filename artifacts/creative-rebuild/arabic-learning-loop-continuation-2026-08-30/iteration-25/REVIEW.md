# Iteration 25 — Pixel and Evidence Review

## Verdict

**PASS — nuanced Iraq-specific documentary editorial.**

Art direction 156, graphic design 155, social strategy 156, Arabic 155. Integrated score: **156/160**. No hard fail; benchmark-only.

## Why it passes

- The message acknowledges a verified national threshold while refusing a triumphalist “problem solved” framing.
- `التقدّم حقيقي / لكنه غير مكتمل` creates a strong Arabic hook and keeps the report's own progress/inequality tension intact.
- The full-bleed civic-campus scene gives human scale without using a landmark, flag, public figure, staged handshake, luxury workplace, or heroic portrait.
- Foreground people remain observational and small relative to the environment; background people deepen the lived context without becoming subjects of a claim.
- The source appears on a photographic lower fade rather than repeating the previous right-aligned institutional footer stack.
- At 324×405, headline, 12 px support, approximately 10.2 px source, and pale logo remain readable.

## Evidence audit

- Primary sources: Iraq National Human Development Report 2025 and the Government of Iraq/UNDP launch release.
- Post retains: high-human-development category, 2024 date, uneven progress across governorates, and inequality between women and men.
- Post omits the 0.712 value deliberately to avoid repeating the large-stat format and making the index number the whole story.
- Post does not add: causal explanation, forecast, client contribution, universal progress, governorate ranking, or claim that the pictured people participated in the report.

## Image and rights audit

- Source image is an original built-in generation with no reference images.
- All people are fictional; no identity, public figure, source photograph, report art, or professional campaign pixel was used.
- Exact Arabic, source, and canonical logo were added after generation in HTML/CSS.
- Source image SHA-256 is recorded in the manifest.

## Arabic audit

- Arabic-only visible copy, RTL order, shadda, hamza, punctuation, `٢٠٢٤`/`٢٠٢٥`, line breaks, and shaping: pass.
- `التنمية البشرية المرتفعة` matches the report category without implying “very high” development.

## Rejected first composite

The first composite ended the pale top fade at 8% opacity, producing a visible horizontal seam across the photograph. The final render extends the fade to 700 px and reaches complete transparency; desktop/mobile pixels and hashes were regenerated.

## Hard-fail audit

- Exact copy, Ghroob, bounds, contrast, logo, dimensions, hashes, and source attribution: pass.
- No landmark, flag, map, giant statistic, report artwork, imported photo, generated writing, or reference pixel: pass.
- Production publication: disabled.

## Residual risk

The generated scene is illustrative. Captions must preserve that status and must not describe the people or location as report participants, a named Baghdad campus, beneficiaries, or proof of the measured index.
