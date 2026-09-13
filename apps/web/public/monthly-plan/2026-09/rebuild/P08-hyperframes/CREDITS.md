# Sourced iPhone model and render component

## Required published credit

**“Apple iPhone 15 Pro Max Black” by polyman Studio (@Polyman_3D), licensed CC BY 4.0. Screen content, materials and lighting adapted for AURENDOR.**

- Model: https://sketchfab.com/3d-models/apple-iphone-15-pro-max-black-df17520841214c1792fb8a44c6783ee7
- Creator: https://sketchfab.com/Polyman_3D
- License: https://creativecommons.org/licenses/by/4.0/

Include the credit in the video description / social caption and the review page's credits. The model is a third-party visualization, not an official Apple asset or endorsement.

## Verified provenance

Downloaded `iphone-15-pro.glb` from https://github.com/quentin-pla/phone-mockup-studio/blob/main/source/apple_iphone_15_pro_max_black(2).glb on 10 September 2026. The mirror's CREDITS.md incorrectly associates this file with a different Sketchfab model/creator. We inspected the actual GLB JSON asset.extras: author **polyman (https://sketchfab.com/Polyman_3D)**, title **Apple iPhone 15 Pro Max Black**, source **df17520841214c1792fb8a44c6783ee7**, license **CC-BY-4.0**. We then checked the matching primary Sketchfab API model record. It confirms **polyman Studio**, **Creative Commons Attribution**, commercial use allowed, author must be credited. The raw API record is retained as `original-sketchfab-model-metadata.json`. The other model's metadata is retained only to document the mirror inconsistency.

Unmodified original geometry is retained, including lenses, frame, controls and rounded display. Changes: normalized transform, studio lighting, reduced front-glass reflections and real Bunyan application screenshot textures. The entire 390×748 app viewport is uniformly fit inside a 1179×2556 display texture, with top/bottom device chrome; no screenshot cropping or stretching.

## Code licensing

Three.js 0.185.1 MIT: bundled license `vendor/LICENSE`.
Quentin Pla's `phone-mockup-studio` MIT source informed screen UV transform and front reflection treatment. Its original license is retained as `UPSTREAM-MIT-LICENSE`, source read-only copy as `upstream-reference.html`, and original CREDITS as `UPSTREAM-CREDITS.md`.

`device.js` is the custom AURENDOR deterministic renderer. It has no requestAnimationFrame or playback clock; Hyperframes/GSAP controls every pose explicitly.


# Bunyan Pro film — music rights and production record

Music: **Games Music**, by **Grigoriy Nuzhny**, Mixkit catalog **706**.

- [Original stock-music listing](https://mixkit.co/free-stock-music/breakbeat/)
- [Original source recording](https://assets.mixkit.co/music/706/706.mp3)
- [Mixkit Stock Music Free License](https://mixkit.co/license/#musicFree)
- [Mixkit terms](https://mixkit.co/terms/)

The original AURENDOR license record is `aurendor-launch-1109/docs/music-license.md`, checked September 8, 2026. The original track listing and license page were rechecked September 10, 2026; the license landing page HTML is preserved alongside this document. The previous rights review records permission for edited music incorporated into commercial web/social video and online advertisements. It excludes standalone music distribution, music ownership claims and rights-management registration. Attribution to the composer remains intact. Do not upload these isolated stems as a music release.

This is a new 56.25-second edit of the licensed recording, not an original AI-composed score. The edit uses pitch-preserving Rubber Band time stretch from the 140 BPM source grid to 128 BPM, with five deliberate phrase edits, a financial-section recess, and an ending from the actual source outro. Original deterministic transition sounds are separately synthesized; no third-party SFX recordings are used. There is no narration.

`provenance.json` records the exact source hash and process. `beat-map.json` records source passages and every editorial beat. `signal-qa.json` records final mastering measurements. `../scripts/audio-build.py` reproduces the complete edit from the existing licensed source file.

No human listening was performed by this agent because audio perception is unavailable. The verification is signal-based; it must not be described as a listening review.
