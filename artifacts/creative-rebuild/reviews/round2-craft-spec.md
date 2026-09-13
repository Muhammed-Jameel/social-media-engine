# Round 2 Production Craft Specification

**Scope:** candidates `01`, `02`, `04`, `06`, `08`, `09`, `10`, and `11` only  
**Evidence basis:** `senior-graphic-designer-round1.json`, SHA-256 `1d73c237f80afed8bd81fa28a6e8f50ffa3ab32ed04b15d8a1750f8c535cea88`  
**Status:** production instructions, not a critique; no changed hash is scored or approved here

## Shared production tolerances

- Canvas stays `1080 × 1350`; mandatory review render stays `324 × 405` (`30%`). Keep live content inside `70 px` source margins (`21 px` mobile) unless a deliberate non-text crop crosses the edge.
- Use a 12-column grid with `70 px` outer margins and `24 px` gutters. Declare the focal box, type box, and negative-space job before rendering; do not center by default.
- Minimum final-pixel type sizes:

  | Role | Source minimum | 324 px review minimum | Rule |
  |---|---:|---:|---|
  | Primary display | `84 px` | `25 px` | Prefer `96–118 px` for Arabic covers; authored line breaks only |
  | Required support | `52 px` | `15.6 px` | Must remain readable without zoom |
  | Evidence/disclaimer | `42 px` | `12.6 px` | Do not use as footer texture; target `4.5:1` contrast |
  | Navigation/index | `36 px` | `10.8 px` | If comprehension-critical, promote to evidence size |
  | Bilingual logo lockup | `180 px` wide | `54 px` wide | Preserve clear space of at least one mark height |

- Key vector strokes must be at least `8 px` source (`2.4 px` mobile); noncritical hairlines at least `4 px` source (`1.2 px` mobile). No one-pixel mobile seams.
- Arabic roles: Ghroob Bold for the focal thesis, Ghroob Regular for support/evidence, explicit RTL containers, no tracking, and optical—not mechanical—right-edge alignment. Record exact font hashes and inspect dots, joins, diacritics, punctuation, and numerals in final pixels.
- Latin roles: Dh Ranclo is an identity accent, not the universal reading face. Use it for one short display signal only. Functional labels, evidence, disclaimers, and paragraphs require one approved, embedded, high-legibility companion sans with recorded license and hash; browser fallback is not release-safe.
- Across the rebuilt 12-post set, Dh Ranclo may dominate at most `3` feed tiles and never more than one adjacent tile. It must not typeset microcopy. Preserve one characteristic cut per word or phrase, not a cut in nearly every glyph.
- Accent green is a state signal. It may identify one transition, answer, selection, or control; it must not appear as an unrelated rule, dot, glow, and label in the same frame.

## Stop repeating the image-led skeleton

Round 1 repeatedly placed a full-bleed generated object below an upper headline with the logo in the opposite lower corner. Round 2 must obey all of these constraints:

1. Only `01` may use a full-bleed macro scene with an upper-right Arabic headline.
2. `02` must use a protected type bay and an architectural archive crop; it may not repeat `01`'s upper-right-type/lower-object silhouette.
3. Vary image depth: `01` is macro material contact; `02` is deep architectural retrieval. Do not add a third image-led route with the same shallow tabletop camera.
4. Vary the type-image relationship: `01` aligns type to the bridge axis; `02` separates type from texture and lets the evidence path cross zones. Do not float identical headline blocks over both scenes.
5. No image-led posts may be adjacent in feed simulation. A data, editorial, or announcement beat must separate them.

## Candidate specifications

### 01 — Context handoff

- **Geometry/crop:** retain the diagonal macro crop. Keep the bridge focal box approximately `x 390–700 / y 590–880`; protect a clean Arabic field at `x 490–1010 / y 70–470`. The bridge should occupy `20–28%` of canvas width, not become a tiny center detail.
- **Type roles:** Ghroob Bold thesis at `96–108 px`; Ghroob Regular support at `52–58 px`. Align one headline edge or the single green state rule to the bridge axis. Remove any unearned micro-label.
- **Material contacts:** retouch both crystal sockets at `200%`. The left cavity needs a crisp manufactured lip; the right fork needs unambiguous front/back slot depth. Preserve continuous refraction and a centered green filament through both materials.
- **Mobile proof:** headline, support, and crystal junction must remain distinct at `324 × 405`; logo width at least `54 px` mobile. No subtitle over paper shadow.
- **Difference duty:** this is the sole upper-right-type/full-bleed macro image in the round.

### 02 — RAG evidence archive

- **Geometry/crop:** allocate the archive to the right `58–64%` of the canvas and a stable upper-left type bay to `32–36%`. Preserve the foreground evidence tag and one uninterrupted diagonal retrieval path. Crop closer on the archive; do not let the headline cross a shelf edge.
- **Type roles:** Ghroob Bold thesis at `88–100 px`; required support at `52–58 px`. Remove distressed Latin micro-labels or reset the single necessary `RAG` island in the approved companion sans at evidence size.
- **Material contacts:** every transparent riser must visibly support a slab; no unexplained terminations. The green cord needs plausible tension, curved bends, and explicit front/behind relationships at every shelf crossing. The evidence tag must show a credible attachment point and contact shadow.
- **Mobile proof:** test the protected type bay independently from the image. Required support must be at least `15.6 px` mobile and may not cross changing luminance.
- **Difference duty:** architectural depth and a separate type bay must make this silhouette visibly unlike `01`.

### 04 — Decision question

- **Geometry/crop:** keep the RTL thesis in the upper-right half, but convert the oversized question mark into one active state change that travels into or resolves at the decision phrase. Use one semantic mark only; remove the disconnected equals sign and/or neon dot.
- **Type roles:** Ghroob Bold at `100–118 px`; support at `52–56 px`. Preserve the current meaning-based line breaks and optical right edge.
- **Vector craft:** outline stroke at least `8 px` source and consistent through crop; joins, terminals, and the state-change contact must remain clean at mobile scale.
- **Mobile proof:** the punctuation mechanism must still be understood with support copy hidden. Support must not fall below `15.6 px` mobile.
- **Difference duty:** treat this as a dark typographic breath, not another object-over-background hero.

### 06 — Four places to one path

- **Geometry/crop:** keep the right-to-left reduction across an unequal split, approximately `52%` dark / `48%` light. Pair each numeral and statement as one optical unit. The transition arrow must cross the seam and point unmistakably from `٤` to `١`.
- **Type roles:** numerals may remain oversized; statements require Ghroob Bold at `60–70 px`; disclaimer at least `42 px`. No Latin display face.
- **Vector craft:** align the arrow shaft to the visual center of both states; maintain `8–12 px` key strokes and crisp seam edges. Any added notation must encode state, not decorate.
- **Mobile proof:** numeral, statement, and arrow must form one three-beat read. The illustrative disclaimer must remain readable at `12.6 px` mobile.
- **Difference duty:** this is the information-density beat; do not add photography, cards, or soft glow.

### 08 — Field Notes announcement

- **Geometry/crop:** retain the offset frame and title interruption, but activate the empty upper aperture with one useful field-note artifact: date/index, evidence tab, or issue marker. Keep frame thickness `30–36 px` source and one controlled neon offset.
- **Type roles:** Dh Ranclo may remain only in the two-word masthead, with fewer cuts and verified word recognition. Set subtitle, issue metadata, and announcement line in the approved companion sans. Masthead `150–176 px`; subtitle `52–60 px`; metadata/evidence `42 px` minimum when meaningful.
- **Vector craft:** title must cross the frame deliberately without clipped letter joints. Frame, pale field, and neon offset share one grid; no arbitrary second shadow.
- **Mobile proof:** `FIELD NOTES`, subtitle, and issue marker must all survive at `324 × 405`; nonessential footer copy should be removed rather than miniaturized.
- **Difference duty:** this is the sole dominant Latin-display tile in this round.

### 09 — Carousel cover: locate the decision

- **Geometry/crop:** replace the generic centered crosshair capsule with an off-center decision fork, threshold, or committed state. Let one path remain pale and one selected path charge green. Use deliberate asymmetry so the mechanism leads into slide `10`.
- **Type roles:** Ghroob Bold thesis at `100–118 px`. Keep a support line only if the mechanism cannot communicate without it; if retained, use `52 px` minimum.
- **Vector craft:** nodes and rails use `8–12 px` source strokes; the chosen and rejected states require different geometry, not color alone.
- **Mobile proof:** hide the support line during QA; a viewer must still identify “find the decision” from headline plus mechanism.
- **Sequence duty:** this is the only carousel tile shown in feed simulations. Slides `10` and `11` belong in a sequence contact sheet, not as separate feed posts.

### 10 — Carousel mechanism: define boundaries

- **Geometry/crop:** preserve the input/output opposition and lower-right resolution, but replace the central soft gradient with a precise boundary: aperture, gate, transparent membrane, or hard-edged processing layer. Show one observable input-to-output change.
- **Type roles:** panel questions `64–72 px`; resolution `76–88 px`; navigation at least `36 px`. Maintain authored Arabic breaks and isolated numeral order.
- **Vector/material craft:** panel borders and boundary contacts must be crisp. Remove the two short lower rules unless they encode real status. If translucency is used, its overlap and edge refraction must remain physically consistent.
- **Mobile proof:** both questions and the transformed state must read before the resolution sentence. Do not use glow to recover weak contrast.
- **Sequence duty:** inherit one incoming path behavior from `09` and hand one output state to `11`; do not repeat the cover layout.

### 11 — Carousel resolution: human stop

- **Geometry/crop:** keep the horizontal sequence, but end it at one unmistakable authorization/stop control—not a switch-eye hybrid. Connect the rail to a precise port or threshold; eliminate the dangling diagonal line.
- **Type roles:** Ghroob Bold question at `100–116 px`. Consolidate the two small support tiers into one `52–58 px` line or two-line block.
- **Vector craft:** show a visible pre-stop and stopped state through geometry plus charge. All node diameters, rail caps, and contact tangencies require optical correction at source and mobile sizes.
- **Mobile proof:** the control must read as human authority with the headline hidden; support copy must remain at least `15.6 px` mobile.
- **Sequence duty:** resolve the path introduced in `09` and transformed in `10`; the final slide should close the visual action rather than introduce a new symbol language.

## Feed and sequence ordering

- Do not represent the three carousel slides as three adjacent feed tiles. The feed receives `09` as the cover; review `09 → 10 → 11` separately as one carousel sequence.
- For the six standalone/feed-visible round-two items, use this first simulation rhythm:

  | Row | Left | Center | Right |
  |---|---|---|---|
  | 1 | `01` material macro | `04` dark editorial breath | `08` announcement frame |
  | 2 | `06` data reduction | `09` carousel cover | `02` dark architectural image |

- This order separates `01` and `02`, prevents all image-led work from occupying one row, and avoids consecutive tiles with the same center of gravity.
- When the four restart routes re-enter the 12-post set, enforce a repeating rhythm of `material/narrative → breath/editorial → evidence/data`; never place two dominant Dh Ranclo tiles, two upper-right hero silhouettes, or two equally dark high-density tiles adjacent.

## Asset and preflight boundary

- Round 2 may use only original generated assets, owned brand files, native vectors, or an explicitly licensed and hash-recorded companion font. Reference-corpus pixels remain critique-only and must not enter the render.
- For `01` and `02`, capture full-resolution crops of every material contact, transparent edge, cord/filament crossing, shadow contact, and text-image boundary before review.
- Produce new original, mobile, carousel-sequence, and feed renders with new SHA-256 values. Any changed pixel invalidates round-one critique.
- Do not assign scores until final pixels, font-load evidence, Arabic shaping evidence, provenance, and all new hashes are present. This specification grants no professional or golden status.
