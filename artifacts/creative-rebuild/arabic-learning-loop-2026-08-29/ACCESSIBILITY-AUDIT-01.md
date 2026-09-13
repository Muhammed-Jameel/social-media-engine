# Accessibility Audit 01 — Arabic Type and Brand Pairs

**Scope:** benchmark pixels in the Arabic learning loop; this is not a claim of platform-level WCAG conformance.

## Measured sRGB contrast

| Foreground / background | Ratio | WCAG 2.2 normal text | WCAG 2.2 large text |
|---|---:|---:|---:|
| Paper `#F4F8F5` / deep green `#003F35` | 11.12:1 | Pass | Pass |
| Pale green `#77FF70` / deep green `#003F35` | 9.26:1 | Pass | Pass |
| Neon green `#0EDB23` / deep green `#003F35` | 6.34:1 | Pass | Pass |
| Support green `#CBE2D2` / deep green `#003F35` | 8.71:1 | Pass | Pass |
| Muted green `#315548` / paper `#F4F8F5` | 7.76:1 | Pass | Pass |
| Accent green `#08783F` / paper `#F4F8F5` | 5.20:1 | Pass | Pass |

Thresholds used: 4.5:1 for normal text and 3:1 for large text. Ratios were calculated from the exact hexadecimal colors using WCAG relative luminance.

## Iteration 13 pixel checks

- HTML root is `lang="ar"` and `dir="rtl"`.
- The copy block is right aligned and keeps Arabic reading order even though the block sits on the left half of the canvas.
- Headline line-height is 1.10; support line-height is 1.42.
- Ghroob Arabic regular and bold report loaded before capture.
- Exact copy is present in the DOM and the measured copy region stays inside the 1080×1350 canvas.
- At 324×405, the dots and diacritics in `يُفهَم`, `يُنفّذ`, and `صُغْه` remain distinguishable in a dedicated pixel inspection.

## Limits and next improvement

Contrast ratios do not test reading comprehension, platform compression, alternative text, caption quality, or assistive-technology behavior. The next accessibility-led post should shorten its support copy and raise its effective mobile size while retaining the same minimum contrast discipline.
