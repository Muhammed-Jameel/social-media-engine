# Source-backed Arabic cohort — design asset plan

## Direction

Arabic premium institutional: restrained editorial compositions, one semantic visual mechanism per post, strong RTL hierarchy, quiet negative space, and the FINAL 2026 AURENDOR palette.

## System

- Canvas: 1080×1350 (4:5), with a 72 px content safe margin.
- Mobile review: exact 30% raster at 324×405.
- Grid: six-column logic, 24 px gutters, 8 px base rhythm.
- Palette: `#003F35`, `#00302A`, `#0EDB23`, `#77FF70`, `#F4F8F5`, `#0B201B`.
- Arabic: Ghroob Arabic ITF; no letter spacing; RTL; deliberate line breaks; generous line height.
- Logo: canonical horizontal mark, small and optically isolated in the lower-left corner.
- Accent rule: neon is a signal, not a large background fill or body-copy color.

## Assets

1. Asset type: original textless payment-acceptance still life
   - Source: built-in OpenAI image generation; local file `source-images/sb01-payment-acceptance-base.png`.
   - Why it fits: turns the missing merchant acceptance point into one physically legible absence without a generic phone or card cliché.
   - Rights caution: generated for this project; retain prompt and source hash; no third-party marks or source pixels.
   - Composition use: full-canvas photographic base with the Arabic copy confined to the calm upper field.

2. Asset type: original textless archive-to-service photograph
   - Source: built-in OpenAI image generation; local file `source-images/sb02-service-time-base.png`.
   - Why it fits: gives the service-time claim a specific operational mechanism instead of a decorative illustration.
   - Rights caution: generated for this project; retain prompt and source hash; no third-party marks or source pixels.
   - Composition use: full-canvas photographic base, with right-to-left archival flow and a protected upper-right headline zone.

3. Asset type: canonical AURENDOR logo and local Arabic font
   - Source: repository-native brand assets and Ghroob font files.
   - Why it fits: exact brand fidelity and reliable Arabic shaping.
   - Rights caution: internal brand use only.
   - Composition use: small lower-left signature; all Arabic remains editable HTML before raster export.

4. Asset type: deterministic data/typographic mechanisms
   - Source: original HTML/CSS authored in this repository.
   - Why it fits: preserves exact pixels, avoids generated text, and creates feed contrast beside the photographic posts.
   - Rights caution: no external assets.
   - Composition use: foreground graphics remain outside protected Arabic glyph regions.

5. Asset type: original repeated-decision still life
   - Source: built-in OpenAI image generation; local file `source-images/sb05-repeated-decision-base.png`.
   - Why it fits: five physically repeated slots replace the old overlapping-letter device with an immediately readable operating metaphor.
   - Rights caution: generated for this project; retain prompt and source hash; no third-party marks or reference pixels.
   - Composition use: full-canvas light photographic base with a protected upper Arabic field and no decorative foreground geometry.

## Avoid

- Generated Arabic text, logos, numerals, or source citations inside imagery.
- Decorative shapes that touch letters, dots, diacritics, or punctuation.
- Generic fintech phones, glowing brains, fake interfaces, floating objects, and invented performance data.
- Source artwork, stock photography, Pinterest imagery, watermarks, and unclear licenses.
- Publishing or scheduling: every candidate remains `publicationEligible: false`.
