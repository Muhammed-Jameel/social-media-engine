# Image-led cohort — asset plan

## Correction

The previous abstract cohort is not the requested deliverable. This cohort replaces it with twenty image-led posts in which photography or a tactile photographic still life carries the primary idea.

## Assets

1. **Original generated photography and still life**
   - Source: built-in image generation, one distinct prompt per post.
   - Use: people, places, service moments, workshops, material objects, documentary work, and editorial still life.
   - Rights boundary: no stock downloads, no professional-reference pixels, no unrelated trademarks, and no recognizable third-party branding.
   - Production rule: generated sources contain no Arabic text, captions, logos, UI, or watermarks. Exact language is added in the deterministic renderer.
2. **AURENDOR brand assets**
   - Source: project Ghroob Arabic fonts and canonical horizontal logo.
   - Use: all visible Arabic typography and restrained brand signature.
   - Production rule: correct RTL shaping, no Arabic tracking, small isolated logo.
3. **Supporting design elements**
   - Source: original HTML/CSS composition.
   - Use: crop windows, editorial rules, index marks, pale panels, subtle gradients, and caption tabs.
   - Production rule: elements support the image and hierarchy; they never replace the image or collide with Arabic dots, marks, or glyphs.

## Image families

- Iraqi workplace documentary: `01`, `02`, `03`, `07`, `08`, `09`, `12`, `13`, `17`, `18`, `19`, `20`.
- Crafted object and material still life: `04`, `05`, `10`, `11`, `14`, `15`, `16`.
- Engineering and technical practice: `06`.

Every source image is stored in `source-images/`, hashed in `manifest.json`, and consumed from the workspace—not from the image generator's default storage.

