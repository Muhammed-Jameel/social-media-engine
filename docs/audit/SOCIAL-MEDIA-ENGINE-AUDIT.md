# Public plugin implementation audit

## Scope and outcome
The prior copy retained an internal, single-brand application's structure and assumptions.
The public release now has a native installable plugin, a self-contained brand-first
skill, and a small local runtime. The copied application is preserved in an ignored
local recovery archive. The protected original application was not modified.

This audit distinguishes implemented local behavior from account-dependent capabilities.
It does not certify live services or guarantee creative equivalence across models.

| Capability | Status | Implementation / evidence |
| :--- | :--- | :--- |
| Native plugin packaging | PASS, structural | Dual manifests, both marketplaces, official Codex/skill validators |
| Portable installation artifact | PASS, local | Allowlisted deterministic ZIP; isolated extracted-runtime test |
| Brand questionnaire and resume | PASS, local | Runtime/CLI and real dashboard browser exercise |
| Brand-specific context and assets | PASS, local | Brand isolation, approved hashes, asset rights/integrity tests |
| Monthly strategy and plans | PARTIAL | Detailed agent workflow and validated plan records; strategic judgment remains model/owner-dependent |
| Platform-specific writing | PARTIAL | Brand-bound variants, source/claim policy, deterministic caption constraints; quality requires real review |
| Image/carousel/video production | PASS for technical local samples; tools-dependent generally | Real PNGs and MP4 rendered in browser exercise, no external generation service certified |
| Professional creative quality | UNVERIFIED for new customers | Creative methodology and review gates included; genuine owner calibration still required |
| Review dashboard | PASS, local | Actual previews, ordered carousel, mobile layout, brand approval and feedback |
| Review/approval/revisions | PASS, local | Hash-bound roles, stale context, owner feedback invalidation, revision history |
| Postiz account discovery/upload/send | PASS against fake HTTP provider | Actual request shape, multipart upload, explicit gates, receipts |
| Live scheduling/publication | UNVERIFIED | Requires safe account credentials and current provider capabilities |
| Duplicate/ambiguous-write handling | PASS, local integration | Durable intents, no blind retry, receipt and reconciliation tests |
| Remote schedule edits/cancellation | PARTIAL | Provider UI/tool workflow; not an implemented remote cancel endpoint |
| Analytics | PARTIAL | Provenance-labelled imports and reporting instructions; real data requires authorized sources |
| Unified comments/DM inbox | NOT INCLUDED in local runtime | Use discovered authorized host/platform tools; never imply universal API access |
| Feedback learning | PASS for persistence/enforcement | Scoped approval, expiry/retirement, deterministic caption rules; natural-language visual rules require review |
| Multi-brand | PASS, trusted local workspace | Explicit brand keys and cross-brand isolation tests |
| Public multi-user hosting | NOT INCLUDED | Needs separate authentication, authorization, isolation and operations |
| Licence/distribution cleanup | PASS for new artifact | MIT code, no bundled customer assets/fonts/legacy dependencies |
| Original repository safety | PASS for task access boundary and recorded commit | Access was read-only; no original writes or credential use; local integrity report documents scope |

## Important design correction
The plugin runs inside the AI host instead of embedding a renamed internal application.
This avoids dependence on one brand's database, workstation paths, design defaults,
provider credentials or model subscription. It preserves the disciplined production
sequence but does not claim that installing instructions alone guarantees professional
outputs from every model.

See the implementation map in ../ARCHITECTURE.md and test procedure in ../TESTING.md.
See SOCIAL-MEDIA-ENGINE-GAPS.md for external acceptance work that must remain explicit.
