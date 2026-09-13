# Month 1 balanced-feed audit

Audited: 2026-08-31 (Asia/Baghdad)

## Result

The complete 20-post September feed passes the final visual-coherence review. It preserves the supplied benchmark collection's premium Arabic editorial language without collapsing into one repeated layout.

- Final contact sheet: `MONTH1-BALANCED-FEED-v3.png`
- Dimensions: 1408×2165
- SHA-256: `ea7e7225cbc593346a2b0c022983ac4506879006e9d33bfd0cdd38d9b00ee8fc`
- Formats: 10 single images, 9 carousels, 1 reel storyboard
- Creative balance: 5 photographic, 6 tactile-object, 4 typographic, 1 evidence/data, 2 interactive diagram, 1 abstract, 1 mixed-media
- Image-led / graphic-led balance: 11 / 9
- Publication eligible: `false`

## Feed rhythm

- Light and dark fields alternate without a mechanical checkerboard.
- Human documentary scenes are separated by graphic or tactile posts, preventing the month from looking like a stock-photo campaign.
- Tactile objects are materially distinct: ribbon path, decision record, payment acceptance, account usage, repeated decision, and knowledge continuity.
- Native graphic posts vary their mechanism: oversized typography, evidence registration, taxonomy, an interactive two-question dial, comparison paths, and a hypothesis specimen.
- Neon green is used as a decision or emphasis signal, not as a default background on every tile.

## Arabic and production checks

- Visible Arabic is RTL with zero letter tracking.
- Headlines retain clear dot and diacritic space at feed and mobile-card sizes.
- No line, foreground object, crop, or shape intersects Arabic letters or dots in the two final replacements.
- SEP-12 and SEP-16 use immutable public filenames, preventing stale optimized-image cache reuse.
- Desktop and mobile dashboard checks return HTTP 200 with zero console errors, zero page errors, and zero actual root horizontal scroll.

## Final replacements

- `SEP-12`: the payment-acceptance still life replaces a weaker generic payment graphic and ties the idea to the Central Bank of Iraq financial-inclusion strategy.
- `SEP-16`: five limestone slots and one green decision block replace the previous crowded letter collage. The protected upper copy field keeps Arabic fully readable, while the physical repetition metaphor remains clear without making a quantitative claim.

## Safety boundary

The feed is ready for owner review, not publication. `DRY_RUN=true`, `PRODUCTION_PUBLISHING_ENABLED=false`, and `publicationEligible=false` remain in force. No scheduling or provider publication action occurred during this audit.
