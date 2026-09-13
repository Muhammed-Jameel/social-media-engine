# Source-backed Arabic cohort — research evidence

Accessed: 2026-08-31 (Asia/Baghdad)

This file preserves the evidence boundary for four new creative candidates. Sources inform the claims and design-review rules only. No source artwork or third-party campaign pixels are used in generation.

## SB-01 — payment acceptance

- Claim: An e-money account does not create practical usage on its own; adoption also depends on places and equipment that accept non-cash payment.
- Evidence: The Central Bank of Iraq's National Financial Inclusion Strategy reports very limited household e-money usage and identifies lack of payment equipment as the main barrier to non-cash payments.
- Source: Central Bank of Iraq, *National Financial Inclusion Strategy 2025–2029*, section “Digital Financial Services and Channels.”
- URL: https://cbi.iq/static/uploads/up/file-175032973296039.pdf
- Visible-copy boundary: the post states the operating implication and names the source; it does not invent a measured AURENDOR result.

## SB-02 — service time

- Claim: Digital transformation should be judged by a concrete service outcome, not the addition of another screen.
- Evidence: UNDP Iraq documents an Iraqi police-service case in which retrieving an old complaint file changed from an hours-long expectation to completion in less than one minute after an integrated automation system was introduced.
- Source: UNDP Iraq, *What used to take hours… is now done in just one minute*, 2025-12-21.
- URL: https://www.undp.org/iraq/stories/what-used-take-hours-now-done-just-one-minute
- Visible-copy boundary: the time comparison is explicitly attributed to the documented case and is not generalized to every digital project.

## SB-03 — technology, governance, and trust

- Claim: Digital services can reduce friction and improve traceability, but durable trust also depends on wider governance reform.
- Evidence: UNDP Iraq's 2025 CPI analysis says technology helps while cautioning that digitalisation contributes to credibility only when embedded in broader governance reform.
- Source: UNDP Iraq, *Iraq’s CPI 2025: From Starting Reform to Earning Trust*, 2026.
- URL: https://www.undp.org/iraq/blog/iraqs-cpi-2025-starting-reform-earning-trust
- Visible-copy boundary: the design presents a two-part principle, not a causal performance statistic.

## SB-04 — data visibility

- Claim: Data scarcity limits visibility into needs and opportunities, weakening the basis for decisions.
- Evidence: UNDP Iraq's iDATA account describes data scarcity across Iraqi sectors as leaving stakeholders with limited visibility into ecosystem needs and opportunities.
- Source: UNDP Iraq, *Unlocking Iraq’s Innovation Potential Through Data: The iDATA Local Solution*, 2025-04-21.
- URL: https://www.undp.org/iraq/blog/unlocking-iraqs-innovation-potential-through-data-idata-local-solution
- Visible-copy boundary: the design uses a qualitative visibility metaphor and no fabricated values.

## Arabic pixel-review standard

- Rule: Arabic is rendered as semantic Unicode text in an Arabic-capable font, with `dir="rtl"`, no tracking, protected line height, manual line breaks, and separation between glyph dots/diacritics and foreground graphics.
- Source: W3C Internationalization Working Group, *Arabic & Persian Layout Requirements*.
- URL: https://www.w3.org/TR/alreq/
- Applied checks: direction, language, contextual shaping via browser text, loaded font hashes, zero/normal letter spacing, exact copy presence, bounded copy regions, overflow detection, foreground-intersection detection, and 30% mobile review pixels.

## SB-05 — repeated manual decision

- Claim: recurring manual steps consume operating time, increase error exposure, and should be identified early for removal or responsible automation.
- Evidence: the UK Home Office Engineering Guidance says manual processes increase operating cost, introduce human error, and slow teams, and recommends eliminating toil through early automation design.
- Source: UK Home Office Engineering Guidance and Standards, *Automate to eliminate manual steps*, updated 2026-02-13.
- URL: https://engineering.homeoffice.gov.uk/principles/automate-to-eliminate-manual-steps/
- Visible-copy boundary: the post asks the team to identify and measure a repeated decision. It promises no time saving before a baseline and controlled change exist.
