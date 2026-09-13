# AURENDOR Arabic Design Rules

**Status:** active design specification; benchmark validation pending  
**Brand version:** `final-2026.1`  
**Default:** Arabic-first, RTL-composed, final-pixel reviewed  
**Release rule:** every Arabic candidate requires an independent Arabic Design Reviewer

## Core rule

Arabic is not an English layout with replaced strings or mirrored coordinates.

The Arabic verbal idea, line breaks, reading entry, image relationship, optical edges, mixed-script behavior, and density must be established while the concept is being designed. Arabic and English may express one idea and belong to one brand system, but they do not need the same line count, width, scale, crop, or element placement.

The machine-readable principles live in [arabic-design.yaml](../principles/arabic-design.yaml). These rules interpret them for production.

## Authority and evidence boundary

The current local corpus contains useful Arabic-market concept references, but it is overwhelmingly low-resolution landscape project-cover imagery. It cannot prove fine joining, microspacing, font loading, punctuation, or native `1:1`, `4:5`, and `9:16` behavior. See [DESIGN_CORPUS_ANALYSIS.md](./DESIGN_CORPUS_ANALYSIS.md).

Therefore:

- corpus references calibrate hierarchy, composition, and concept;
- specialist sources inform script behavior;
- only AURENDOR's final rendered pixels can prove production Arabic quality.

The [W3C Arabic and Persian Layout Requirements](https://www.w3.org/TR/alreq/) is used as a technical QA reference for bidirectionality, shaping, ligatures, diacritics, numerals, punctuation, spacing, line breaking, justification, and baselines. It is a W3C Group Draft Note, not a finished aesthetic standard. Specialist precedents and limitations are recorded in [ANTHROPOMORPHIC_RESEARCH.md](./ANTHROPOMORPHIC_RESEARCH.md#arabic-first-anchors).

## Arabic-first workflow

### 1. Author the Arabic idea

Write the Arabic thesis for the intended audience. Do not begin from a word-for-word English translation. Record:

- communication objective;
- two-second takeaway;
- intended emotional register;
- short cover thesis;
- evidence phrase, if needed;
- product names, acronyms, numerals, URLs, and other mixed-script content;
- dialect or Modern Standard Arabic decision;
- linguistic reviewer when the copy is consequential.

The cover should normally carry one short thesis and at most one evidence phrase. The caption or next slide handles surplus explanation.

### 2. Author line breaks

Store headline lines explicitly. Break at complete meaning units. Protect short prepositions, attached particles, emphatic words, and phrase units from visual or semantic orphaning. Never let a JavaScript character count or a generic auto-wrap decide display lines.

The line shape is part of the composition. Test alternatives in the loaded production font while the image and focal mass are still flexible.

### 3. Compose from the RTL entry

Set the intended first, second, and third fixation from the Arabic reading entry. Position focal mass, evidence, motion, gaze, and negative space around that path. A visual subject may sit left, center, or in depth; the choice must create a meaningful counterweight to the right-side entry.

Do not reverse an LTR grid mechanically. Photographs, people, products, maps, charts, timelines, interface states, and symbolic actions may have an inherent direction that must be respected or deliberately re-authored.

### 4. Typeset with actual glyph metrics

Use the approved Ghroob Arabic ITF production file only when its license, exact file, requested weight, and load state are verified. Measure shaped glyph bounds rather than string length. Record exact font-file hashes and do not synthesize unavailable weights.

### 5. Render and inspect

Inspect exact-current-hash pixels at:

- original export size;
- representative mobile feed size;
- thumbnail or feed context;
- `3/9/12`-post simulations when the item is part of a series.

Source strings, DOM nodes, SVG family names, provider metadata, and browser smoke tests cannot approve Arabic aesthetics.

## Typesetting rules

### Direction and shaping

- Set the primary reading direction to RTL at the text container and document level where appropriate.
- Use a shaping-capable rendering path and wait for fonts before measurement or export.
- Preserve contextual forms, joining behavior, ligatures, marks, and diacritics.
- Reject disconnected joins, tofu, fallback glyphs, synthetic weight, clipped dots or diacritics, and exporter-dependent substitution.
- Do not convert Arabic to outlined paths unless the approved workflow requires it and the final text remains verifiable, accessible where needed, and bound to a source string.

### No tracking on connected Arabic

Never apply Latin-style letter spacing to connected Arabic. It can break joins and distort native rhythm. Create emphasis with an approved weight, scale, color, placement, or script-aware alternate. Latin acronyms may use their own tracking inside isolated LTR runs.

### Semantic line breaks

Each display line must preserve meaning and produce a deliberate silhouette. Check:

- orphaned one-word lines;
- stranded particles or short prepositions;
- separated paired concepts;
- punctuation stranded on the wrong visual edge;
- overly similar adjacent line lengths that flatten hierarchy;
- a single long line forcing an undersized display face.

When a line does not fit, rewrite or recompose. Do not shrink every line to preserve a fixed template.

### Optical right edge

Arabic glyphs, dots, diacritics, punctuation, and terminal shapes do not create a mechanically uniform edge. Measure browser glyph bounds, then make a documented optical correction. Align perceived letterform mass, not just the text box.

### Hierarchy and scale

Use steep separation between thesis, support, evidence, and metadata. A perceived display-to-support ratio near `3:1` is a starting point only; tune it for word shape, weight, contrast, format, and mobile preview.

The first read should normally contain three beats at most:

1. Arabic focal thesis or concept-bearing image;
2. clarifying image, phrase, or evidence;
3. quiet signature or action.

Tiny footers, dense disclaimer blocks, and equal-weight bilingual copy are not acceptable ways to fit more information.

### Measure and leading

Body and evidence copy needs a deliberate measure and leading appropriate to the selected Arabic font and size. Avoid narrow columns that create jagged one- or two-word lines. Avoid lines so wide that the RTL return becomes difficult at mobile scale.

Do not reuse Latin line-height values blindly. Test joins, ascenders, descenders, dots, and diacritics across multiple lines and weights.

### Punctuation and numerals

Choose punctuation and numeral treatment intentionally for the audience and content. Verify:

- punctuation remains attached to the intended phrase;
- percent signs, currency, dates, decimals, ranges, and units read in the intended order;
- Arabic-Indic or Western numerals are used consistently according to the language and brand decision;
- parentheses and mirrored punctuation render correctly;
- line breaks do not separate values from units or labels.

Do not assume a correct source string will survive bidirectional layout unchanged.

## Mixed Arabic and English

Product names, URLs, Latin acronyms, code, and numerals are controlled directional islands.

- Isolate each LTR run explicitly with bidi-aware markup or Unicode isolation appropriate to the renderer.
- Keep punctuation inside the intended directional run where possible.
- Do not scatter many English labels through an Arabic headline field.
- Prefer a stable Arabic term plus one controlled Latin product name over repeated bilingual duplication.
- Test all mixed lines in the exact exporter; browser, SVG, canvas, and design-tool behavior may differ.

In web markup, semantic `<bdi>`/directional spans can isolate runs. In SVG or raster pipelines, use an equivalent renderer-tested isolation strategy. The implementation method is secondary to correct final pixels.

## Bilingual composition

Arabic and Latin should share concept and brand behavior, not geometric equality.

### Optical baseline

Calibrate Ghroob and Dh Ranclo by perceived body mass and baseline response rather than identical CSS point sizes. Record size and vertical-offset relationships for each role. A visually equal bilingual lockup may use unequal numeric values.

### Language priority

For Arabic-first social work, Arabic owns the primary hierarchy. Latin supports product naming, international context, evidence, or a genuinely bilingual requirement. If both scripts compete at the same scale, the communication needs a deliberate dual-language concept—not an accidental compromise.

### Separate art direction when needed

If the Arabic and English versions require different line shapes, crops, eye paths, or text-image relationships, produce separate compositions within the same visual system. Do not force one master layout to accommodate both.

## Arabic and imagery

Develop headline and image together. The copy should name the insight while the image supplies proof, twist, action, or consequence. Avoid literal illustration of every noun in the headline.

- Protect glyph edges from high-frequency texture, bloom, and low-contrast imagery.
- Use negative space as an authored Arabic field, not leftover canvas.
- Keep faces, hands, real UI, and proof-bearing product detail intact when cropping.
- Make scene direction, subject gaze, and movement support the RTL eye path without mechanically flipping reality.
- Do not use generic “regional” arches, calligraphic ornaments, mashrabiya patterns, desert scenes, or heritage symbols unless the subject genuinely requires them.
- Do not extract or imitate lettering, patterns, or culturally specific graphics from references.

## Arabic carousels

An Arabic educational carousel assigns one cognitive job to each slide:

1. cover thesis or question;
2. tension or context;
3. mechanism or explanation;
4. evidence, example, or limitation;
5. resolution, action, or next step.

This sequence is adapted to the content; it is not a fixed five-slide template. Composition, scale, and image relationship should change with each cognitive job while material, typographic voice, and charged state maintain coherence.

Every slide needs:

- authored Arabic line breaks;
- a declared focal point and reading path;
- mobile-safe type;
- no repeated decorative furniture;
- stable navigation only when it genuinely helps sequence comprehension;
- a next-slide relationship that is visible before the caption.

## Production evidence record

An Arabic render is not reviewable without:

```yaml
language: ar
copy_source: string
copy_review_status: string
headline_lines: []
direction: rtl
mixed_script_runs: []
numeral_policy: string
font_family: Ghroob Arabic ITF
font_file_sha256: string
font_weight: string
font_load_proven: true
shaping_engine: string
fallback_used: false
rendered_asset_sha256: string
original_preview: string
mobile_preview: string
arabic_critic_id: string
arabic_critic_asset_sha256: string
```

Any change to copy, line breaks, font file, weight, imagery, dimensions, or raster invalidates the prior Arabic approval.

## Arabic critic checklist

The independent reviewer must inspect and cite pixel regions for:

### Language and meaning

- the wording is natural for the intended audience;
- headline breaks preserve meaning;
- CTA and evidence phrases are unambiguous;
- product and technical terms are consistent.

### Script integrity

- contextual shaping and joins are correct;
- no Latin-style tracking damages Arabic;
- dots, diacritics, punctuation, and terminal forms are intact;
- no fallback font or synthetic weight is visible;
- mixed-script order is correct;
- numerals, units, percentages, dates, and currency read correctly.

### Visual design

- RTL entry and eye path are intentional;
- the optical right edge is calm;
- Arabic owns the intended hierarchy;
- line silhouettes interact with imagery deliberately;
- body measure and leading are professional;
- display and support scales remain clear at mobile size;
- the composition is not a mirrored English layout;
- cultural cues and humor are appropriate.

### Export quality

- no clipping, overlap, low contrast, or aliasing;
- busy texture or light does not weaken glyphs;
- original, mobile, and feed views share the same approved hash lineage.

## Automatic rejection

Reject the candidate if any of the following appears:

- unreadable, disconnected, substituted, or clipped Arabic;
- character-count wrapping or unapproved automatic display line breaks;
- Latin-style tracking on connected Arabic;
- Arabic pasted into or mirrored from an English composition;
- mixed-script punctuation or numerals in the wrong order;
- equal-weight copy blocks with no clear first, second, and third read;
- tiny body or footer text used to preserve a template;
- a declared font without load and hash evidence;
- Arabic reviewed only in source code or metadata;
- no independent Arabic critic on the exact current raster hash;
- reference lettering, copy, or composition imitated too closely.

These failures map to `FP-TYPE-001` through `FP-TYPE-004`, `FP-EVAL-002`, and `FP-REFERENCE-001` in [forbidden-patterns.yaml](../aurendor/forbidden-patterns.yaml). Numeric scores cannot override them.

## Acceptance standard

An Arabic design may become a professional candidate only when every required critic—including the Arabic Design Reviewer—scores the exact current raster at least `145/160`, records no hard fail, and finds it comparable to the relevant professional anchors. It must also pass technical preflight, originality, rights, mobile, and feed checks.

Passing bidirectional tests alone is not professional Arabic design. Passing one attractive Arabic benchmark does not validate the system. The benchmark must prove repeatable quality across several Arabic purposes and formats before normal production resumes. See [CREATIVE_QUALITY_RUBRIC.md](./CREATIVE_QUALITY_RUBRIC.md) and [GOLDEN_SET.md](./GOLDEN_SET.md).
