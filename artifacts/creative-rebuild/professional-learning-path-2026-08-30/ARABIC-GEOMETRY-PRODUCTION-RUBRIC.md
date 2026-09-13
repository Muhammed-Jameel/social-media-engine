# Arabic + Geometry Production Rubric

## Purpose

This gate supplements `EXTRAORDINARY-RUBRIC.md` whenever Arabic text shares a frame with lines, circles, wedges, paths, borders, masks, or perspective geometry. A concept cannot be production-ready if a dot, diacritic, ligature, or terminal glyph visually touches or disappears into a shape.

## Research basis

- W3C Arabic Layout Requirements: Arabic layout must respect cursive shaping, ijam dots, combining marks, and script-specific presentation. https://www.w3.org/International/alreq/
- Microsoft OpenType GPOS: Arabic marks use mark-to-base, mark-to-ligature, mark-to-mark, and contextual positioning; visible clearance must therefore be judged from rendered glyph ink, not a Latin baseline assumption. https://learn.microsoft.com/en-us/typography/opentype/spec/gpos
- Microsoft Arabic script development: Arabic letters have contextual glyph forms and may carry marks above or below base glyphs. https://learn.microsoft.com/en-gb/typography/script-development/arabic
- Adobe pixel-perfect artwork: horizontal/vertical segments and anchor points should use pixel-aligned positions; shape transformations must preserve crisp edges. https://helpx.adobe.com/uk/illustrator/using/pixel-perfect.html

## Non-negotiable gates

1. **Full-ink clearance:** measure from the outermost rendered dot, hamza, shadda, vowel mark, descender, and terminal—not from the CSS line box or baseline.
2. **No accidental tangency:** a shape may overlap Arabic only when the overlap is the explicit concept and a separate knockout layer preserves every glyph component. Otherwise, zero contact.
3. **Quiet-zone minimum:** display Arabic requires at least 24 px desktop clearance from unrelated geometry (7.2 px at the exact 30% mobile render). Small labels require at least 18 px desktop (5.4 px mobile).
4. **No rotated Arabic by default:** keep Arabic horizontal unless rotation is conceptually essential and exact glyph-level review proves all dots and marks remain clear.
5. **Protected text zones:** reserve a stable region inside wedges, rings, bands, and perspective fields; never place text where a sloped edge changes the available height across the word.
6. **Circle integrity:** circles use equal width/height, one center, integer radii, and consistent stroke alignment. Do not stretch a circle through CSS scaling.
7. **Line integrity:** use integer coordinates/widths for primary screen geometry, intentional line caps, consistent dash rhythm, and no almost-touching endpoints.
8. **Intersection hierarchy:** crossing shapes need one dominant layer, one subordinate layer, and a deliberate junction. Avoid ambiguous near-tangencies.
9. **Optical—not merely numeric—centering:** Arabic visual mass is inspected after shaping; bounding-box centering alone is insufficient.
10. **Three-scale review:** inspect 1080×1350, exact 324×405, and a 200–400% crop of every text/shape junction.
11. **Adversarial words:** explicitly inspect words containing multiple dots or marks, including `تتكرّر`, `القرار`, `إشارة`, `قِس`, `صغيرًا`, and `نقطة`.
12. **Fail closed:** if a dot or mark appears hidden, merged, crowded, or ambiguous at mobile size, reject and rerender. Do not rationalize the contact as intentional after the fact.

## Scoring supplement — 20 points

- Arabic full-ink clearance: 0–5.
- Shape construction precision: 0–5.
- Optical alignment and spacing: 0–5.
- Mobile junction survival: 0–5.

Production-ready requires 20/20. Any accidental contact is an automatic fail regardless of the total.
