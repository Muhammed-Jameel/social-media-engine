# Source-backed cohort — Month 1 integration record

Integrated: 2026-08-31 (Asia/Baghdad)

## Decision

`SB-01` replaces the previous `SEP-12` cover and copy direction. `SB-05` replaces the previous `SEP-16` letter-collage cover with a quieter tactile mechanism that keeps every Arabic letter and dot clear. `SB-02` through `SB-04` remain approved evidence-bank candidates and are not inserted into Month 1, preserving the campaign's topic and publisher balance.

## Immutable pixel bindings

### SEP-12 / SB-01

- Candidate: `production/sb01-ar-payment-acceptance.png`
- Public file: `apps/web/public/monthly-plan/2026-09/month1-12-sb01.png`
- SHA-256: `9a23de5101ac86fb170a7a96284d283005227e5433851614f401ac66a350fcda`
- Previous public-cover SHA-256: `d90b49108521fc2a97f33c3f64edd67b3a61fff5c98cd7d1f4a51b88a6312fa`
- Dimensions: 1080×1350
- Dashboard URL: `/plans/2026-09`
- Next optimizer cache safety: the revised asset uses a new immutable filename rather than overwriting the old URL.

### SEP-16 / SB-05

- Candidate: `production/sb05-ar-repeated-decision.png`
- Public file: `apps/web/public/monthly-plan/2026-09/month1-16-sb05.png`
- SHA-256: `b4948afa548dc16912fc9f3511a034e99c1599144b83233f945338b3c827b2db`
- Dimensions: 1080×1350
- Dashboard URL: `/plans/2026-09`
- Next optimizer cache safety: the revised asset uses a new immutable filename rather than overwriting the old URL.
- Evidence source: UK Home Office Engineering Guidance, “Automate to eliminate manual steps,” updated 2026-02-13.
- Interpretation boundary: the five slots signify repetition; they do not claim five measured days or a quantified time saving.

## Verified state

- Desktop current sources: `month1-12-sb01.png` and `month1-16-sb05.png` at 256 px optimized width.
- Mobile current sources: `month1-12-sb01.png` and `month1-16-sb05.png` at 384 px optimized width.
- Desktop/mobile HTTP: 200.
- Desktop/mobile page errors: 0.
- Desktop/mobile console errors: 0.
- Actual horizontal root scroll: 0 at both viewports.
- Arabic card direction: RTL; heading tracking: normal/zero.
- SEP-16 Arabic letterforms, dots, question mark, source line, and foreground object have no collisions.
- The public manifest and both candidate production files have identical hashes.
- Final Month 1 contact sheet: `artifacts/monthly-plans/2026-09-structured-intelligence/MONTH1-BALANCED-FEED-v3.png`, SHA-256 `ea7e7225cbc593346a2b0c022983ac4506879006e9d33bfd0cdd38d9b00ee8fc`.
- `publicationEligible: false`; no scheduling or publishing action occurred.

Evidence lives in `dashboard-verification/verification.json`, `audit.json`, `manifest.json`, and the viewport/card screenshots.
