# Iteration 30 — Pixel, Experiment, and Scope Review

## Verdict

**PASS — two versions share one controlled comparison space.**

Art direction 157, graphic design 156, social strategy 156, Arabic 156. Integrated score: **156/160**. No hard fail; benchmark-only.

## Why it passes

- `ابدأ بفرضية، ثم قارن نسختين` is a clear experiment sequence without making “test everything” or “change one thing” claims the source does not support.
- The outlined original and filled variant are live Arabic layers; their overlap enacts comparison without screenshots, cards, or a simulated experiment dashboard.
- Separate labels preserve comprehension even where the two display words deliberately interfere.
- The support keeps randomization and the preselected success measure visible rather than hiding them in a caption.
- At 324×405, headline is approximately 30.6 px, labels 10.2 px, display layers 69 px, continuation 24 px, support 13.2 px, and reference 10.2 px.

## Experiment audit

- Evidence-based hypothesis: stated as the starting point.
- Original control and alternative variant: explicitly labeled.
- Random allocation: stated in the support.
- Primary measure chosen before comparison: stated in the support.
- No sample result, winner, uplift, statistical-significance claim, or AURENDOR/client experiment claim appears.

## Arabic audit

- Arabic-only visible copy, RTL order, `ابدأ` hamza, `قسّم` shadda, `عشوائيًا` tanwīn, `حدّد` shadda, punctuation, line breaks, labels, and overprint shaping: pass.
- The repeated `نسخة` remains identifiable at mobile scale despite intentional overlap.

## Hard-fail audit

- Exact copy, Ghroob regular/bold, canvas bounds, contrast, logo, original/mobile dimensions, hashes, and reference legibility: pass.
- No Latin experiment labels, split-screen UI, cards, screenshots, dashboard, sticky notes, generated image, external visual asset, or professional reference pixel: pass.
- Production publication: disabled.

## Residual risk

Random comparison does not guarantee a useful or ethical experiment. Production use must plan sample size and duration, protect privacy and accessibility, monitor guardrail outcomes, avoid unsafe or manipulative variants, check statistical uncertainty, and report inconclusive or negative results without metric switching.
