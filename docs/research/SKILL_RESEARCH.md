# Skill Research and Adoption Record

**Reviewed:** 2026-08-23

## Adoption rule

No third-party skill or script executes merely because it exists. Adoption requires a named purpose, source/license review, permission review, injection/exfiltration check, pinned version where possible, and a measurable quality or reliability benefit on an AURENDOR fixture.

## Skills used during implementation

| Skill | Source | Decision | Reason and boundary |
|---|---|---|---|
| AURENDOR Marketing Team Lead | Local AURENDOR skill | Adopted for build coordination | Enforces brand/evidence/execution quality and specialist routing; no external scripts |
| UI/UX Pro Max | Local project skill/database | Partially adopted | Accessibility, responsive, interaction, and QA rules adopted. Its generic rose/blue palette and Lora/Raleway recommendation were rejected because they conflict with FINAL 2026. |
| OpenAI Docs | Official OpenAI system skill | Adopted for current API/model research | Restricts research to official OpenAI sources and preserves the requested model |
| Next.js | Installed Vercel plugin skill | Adopted for application architecture | Applied App Router, Server Component, Server Action, route-handler, runtime, font, image, and error-boundary guidance |

## Project-native skill suite

The engine vendors small AURENDOR-specific skills under `skills/aurendor-*`: brand intelligence, content strategy, Arabic copy, English copy, art direction, social design, design critique, brand compliance, social publishing, social analytics, experimentation, monthly retrospective, and next-month planning.

These are internal project assets, versioned in `skills/registry.yaml`, and must reference versioned schemas rather than passing prose blobs between workflow steps.

## Deferred candidates

- Canva-specific execution skills remain deferred until OAuth and plan entitlement are known. Provider documentation informed the adapter contract; it is not treated as a skill.
- Third-party Arabic copy/design prompts were not installed because the authoritative AURENDOR brand and current social design system already provide stronger task-specific evidence, and no candidate has yet demonstrated benchmark lift.
- Provider SDK examples are treated as code/documentation sources and must pass normal dependency and contract review.

## Benchmark policy

Every adopted or revised skill runs against the relevant fixture in `evals/datasets`. Results record exact skill version, model policy, prompt version, score, hard failures, and pairwise winner. A skill moves from `draft` to `benchmark`, `shadow`, and `production` only after no regression in brand compliance, factuality, Arabic naturalness, and reliability.

