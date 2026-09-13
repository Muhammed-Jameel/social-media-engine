# Bunyan Pro — 58-second feature tour

The user accepted the 18-second pilot's energy and motion, then requested more reading time, a complete iPhone mockup, correctly proportioned app pages, and broader feature coverage within 50–60 seconds. This export implements that revision. It is for creative review; it is not scheduled or published.

## What changed

- Exactly 58 seconds: 3-second opening, ten 5-second feature chapters, 5-second ending.
- Each chapter's title and supporting line remain visible throughout its five seconds. They contain 7–10 words together, rather than long explanatory paragraphs.
- The device settles within the first half-second of each chapter. Screen changes happen within the phone; the editorial caption stays in place.
- The complete iPhone body, side buttons, top and bottom remain inside the composition. The main frame is 550 pixels wide, with substantial surrounding space in the 1080×1920 canvas.
- Nineteen fresh complete app viewports appear in the film. Each is 390×748 and is scaled uniformly inside the mockup. No viewport is stretched, enlarged into a fragment, or replaced with fictional UI.
- The soundtrack extends the approved licensed recording through distinct musical passages, with accents aligned to chapter arrivals and a deliberate quieter finance arrival.

## Source and production

The captures were made through the available CUA browser tools from a new isolated copy of the actual React application. Its UI components and styles match the canonical working copy. Only authentication/data adapters and synthetic fixture records differ; no credentials were copied. A real local stage update from60% to65% was exercised, and the before/after states were captured. These assets are screenshots composed in Remotion, not a new native Recordly screen recording.

The complete phone shell is adapted from [Devices.css by Yan Zhu](https://github.com/picturepan2/devices.css), under its [MIT license](https://github.com/picturepan2/devices.css/blob/master/LICENSE). Original geometry, notices and source are retained in `remotion/public/vendor/devices-css`. Its390×830 screen contains the390×748 app viewport plus54px top and28px bottom device chrome. The mockup does not imply Apple endorsement.

Ghroob Arabic ITF and Dh Ranclo remain the editorial fonts. The application keeps its real native typography and AURENDOR Build interface branding; screenshots were not repainted to conceal that naming difference. Existing AURENDOR architectural artwork and logos are reused.

The licensed music is Games Music by Grigoriy Nuzhny, Mixkit706. The source rights, edit intervals, stems and level checks are in `audio/AUDIO-HANDOFF.md`. Final58second music master:−17.00LUFS,−7.87dBTP, no clipped samples. No voiceover was added. Signal measurement does not substitute for listening review.

## Review evidence

- Actual Remotion composition rendered to1740frames,1080×1920,30fps; final H.264/AAC video fully decoded without errors.
- Fifty-eight checkpoints include every chapter boundary, settled reading states, both screen states, opening and ending.
- All340 visible text nodes passed actual-font and safe-area checks; zero fallback fonts.
- Full-device bounds and unaltered screen aspect ratio passed every checkpoint.
- Rendered opening, every feature state and ending were inspected as images, including mobile contact views.
- The broad workflow coverage and exact source evidence are in `FEATURE-COVERAGE.md`; chapter wording/timing and adaptations are in `brief.json`. `editorial-captions.srt` is manually authored on-screen copy, not an audio transcription.

## Claim boundaries

This is a tour of the main working product features, not a demonstration of every account setting, legal page or underlying infrastructure. Public share-token generation and real push delivery require a connected backend and are not simulated. The film does not claim payment processing, AI-generated project decisions, warehouse management, certified signatures or business-result metrics. Media examples are existing licensed illustrative photographs, not customer work. Client approval records and financial balances retain the qualifications in the full caption.

Reproduce with `node content-system-v7/remotion/scripts/render-complete.cjs`. Editable composition: `remotion/src/films/P08Complete.tsx`; reusable mockup: `remotion/src/components/CompleteIPhone.tsx`.
