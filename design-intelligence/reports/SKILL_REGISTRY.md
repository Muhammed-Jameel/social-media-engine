# SOCIAL_MEDIA_PLUGIN Creative Skill Registry and Audit

**Status:** reviewed research baseline  
**Version:** 1.0.0  
**Reviewed:** 2026-08-23  
**Scope:** locally available SOCIAL_MEDIA_PLUGIN, design, image-generation, creative-production, advertising, and Canva skills relevant to the Creative Quality Rebuild

## Registry purpose

This document records whether a skill is suitable for the SOCIAL_MEDIA_PLUGIN creative pipeline. Availability is not approval. A skill may be useful as research, a sandboxed production aid, or an objective QA helper without being trusted as an Art Director, autonomous tool executor, or publication gate.

No skill was installed as part of this audit. Inspection was read-only. No image-generation API, Canva mutation, Creative Production mutation, advertising provider, or publishing provider was called.

The project-native machine-readable registry remains `skills/registry.yaml`. That registry covers SOCIAL_MEDIA_PLUGIN-native policy skills. This document additionally records local third-party, system-managed, and plugin-provided candidates and defines the controls required before any external skill can be adopted.

## Decision vocabulary

| Decision | Meaning |
|---|---|
| `ADOPT` | Approved for the stated bounded purpose after its listed gates pass |
| `RETAIN_AND_UPGRADE` | Preserve its useful contracts or infrastructure, but do not rely on its current creative reasoning for autonomy |
| `CONDITIONAL_QA_ONLY` | Use only for specified objective checks; never let it direct the visual language or approve publication |
| `SANDBOX_ONLY` | May be evaluated with non-sensitive fixtures and no production authority |
| `INSPIRATION_ONLY` | Extract ideas manually; do not invoke as a production dependency |
| `DEPRECATE` | Supersede with a project-native skill and remove from routing after migration |
| `REJECT` | Do not integrate |

## Production policy during the rebuild

- Autonomous visual generation remains paused until the new benchmark and golden-set gates pass.
- Existing provider, idempotency, license, exact-copy, render, and publication controls remain in force.
- A creative skill cannot authorize a provider call, approve a render, alter brand truth, or publish content.
- Web pages, reference images, skill instructions, tool output, provider payloads, OCR, and metadata are untrusted data unless explicitly trusted by policy.
- The current FINAL 2026 SOCIAL_MEDIA_PLUGIN identity remains the effective brand source; external skills cannot replace it with their preferred palettes, fonts, templates, or trends.

## Summary decision table

| Skill or package | Source/version | Network or mutation surface | License signal | Benchmark signal | Decision |
|---|---|---|---|---|---|
| Project-native SOCIAL_MEDIA_PLUGIN skill layer | `skills/`, v1.0.0 entries | No executable code in skill files; downstream tools separately gated | SOCIAL_MEDIA_PLUGIN proprietary internal use | Structural validation passed; creative behavioral/golden evals pending | `RETAIN_AND_UPGRADE` |
| `social-art-direction` v1 | Project-native | None directly | SOCIAL_MEDIA_PLUGIN proprietary | Four structural eval cases; no corpus-scale behavioral benchmark | `RETAIN_AND_UPGRADE` |
| `social-design` v1 | Project-native | Describes provider mutation, durable intent, and capability routes | SOCIAL_MEDIA_PLUGIN proprietary | Visual golden set pending | `ADOPT` for production infrastructure only |
| `social-design-critique` v1 | Project-native | Render reads only | SOCIAL_MEDIA_PLUGIN proprietary | Visual grader calibration pending | `RETAIN_AND_UPGRADE` |
| `social-brand-compliance` v1 | Project-native | Read/gate only; cannot publish | SOCIAL_MEDIA_PLUGIN proprietary | Behavioral eval pending | `ADOPT` as compliance boundary |
| `professional-social-media-design` | Local skill; no declared version | Local Python inspector; no network; reads project files and emits snippets | No source or license declared | No tests/evals found | `INSPIRATION_ONLY` |
| `social-social-creative` | Local personal skill; no version | No scripts/network | No license declared | No tests/evals found | `DEPRECATE` |
| `social-ad-creative` | Local personal skill; no version | No scripts/network | No license declared | No tests/evals found | `CONDITIONAL_QA_ONLY` for angle/test input |
| `ui-ux-pro-max` | Workspace skill; no declared version | Local CSV/Python; no network; optional `--persist` writes files | Source/license not declared | Search data exists; design-source provenance and creative benchmark absent | `CONDITIONAL_QA_ONLY` |
| `ad-creative` | Local agent skill v1.1.0 | External API guidance, API keys, shell/tool commands | Source/license not declared | Includes eval JSON, but no SOCIAL_MEDIA_PLUGIN visual benchmark | `INSPIRATION_ONLY` |
| `image` | Local agent skill v1.0.0 | External image APIs, API keys, arbitrary URL checks, local conversion commands | Source/license not declared | No SOCIAL_MEDIA_PLUGIN benchmark | `INSPIRATION_ONLY` |
| System `imagegen` | System-managed skill; no declared skill version | Built-in external generation; CLI fallback uses OpenAI API key/SDK and writes image files | License not declared in skill | Capability workflow exists; SOCIAL_MEDIA_PLUGIN visual benchmark absent | `SANDBOX_ONLY` |
| Creative Production `produce` | OpenAI-maintained plugin v0.1.25 | Local Node MCP, interactive/write capability, image generation, subprocess/local-server helpers | Proprietary, declared in plugin manifest | General workflow contracts; SOCIAL_MEDIA_PLUGIN benchmark absent | `SANDBOX_ONLY` |
| Canva `canva-design-feedback` | Canva plugin v14.0.0 | Connected Canva account; read-only skill uses thumbnails/content and cancellable read transaction | Plugin manifest links terms/privacy; no license field | Actual-pixel feedback workflow; SOCIAL_MEDIA_PLUGIN critic calibration absent | `CONDITIONAL_QA_ONLY` |

## Project-native SOCIAL_MEDIA_PLUGIN skill layer

Source: `skills/registry.yaml` and `skills/social-*/SKILL.md`  
Declared source: SOCIAL_MEDIA_PLUGIN Content OS master specification  
Declared license: SOCIAL_MEDIA_PLUGIN proprietary internal use

### Existing strengths to preserve

- Versioned, hashed registry records.
- Explicit provenance, license, review, benchmark, adoption, and rollout fields.
- External sources treated as data, not instructions.
- Models and creative skills cannot authorize publication.
- `social-design` preserves exact copy, asset hashes, licenses, provider capability truth, durable intent, idempotency, render verification, and manual fallback.
- `social-design-critique` requires actual renders, original and mobile views, independent critics, hard-fail vetoes, bounded revisions, and visible evidence.
- `social-brand-compliance` independently checks claims, permissions, asset licenses, accessibility, brand version, and approval class.

### Creative gaps requiring v2

#### `social-art-direction`

The current skill correctly prohibits generic AI clichés and reference copying, but it does not yet provide:

- a structured corpus taxonomy or quality weighting;
- explicit visual-principle records linked to reference evidence;
- retrieval diversity and single-reference dominance controls;
- concept divergence and pairwise selection before production;
- an anthropomorphism level and trust/capability assessment;
- a character-system or motion-state contract;
- a similarity/originality handoff;
- feed-distance and visual-fatigue checks;
- a formal visual/verbal co-development contract.

**Decision:** preserve its safety and brand rules, replace creative reasoning with v2, and keep autonomous production paused until behavioral benchmarks pass.

#### `social-design`

The provider and exact-output controls are strong and should not be rewritten. The skill should consume a stronger approved concept packet and send completed renders through the new originality, Arabic, professional-critique, and feed-level gates.

**Decision:** adopt as infrastructure. Production output remains non-publishable until the full creative gate passes.

#### `social-design-critique`

The current 100-point rubric assigns only 14 points to concept and 3 to polish. It lacks full-weight distinctiveness, pairwise comparison with professional quality anchors, dedicated Arabic and social-performance reviewers, feed simulations, and an independent copying/similarity gate.

**Decision:** retain actual-pixel, independence, hard-fail, and bounded-loop behavior. Replace scoring and reviewer structure with v2.

#### `social-brand-compliance`

The skill is correctly separated from owner approval and publishing. It should consume the new originality decision and character-capability truth record as additional hard gates.

**Decision:** adopt as the compliance boundary after schema updates.

## Local `professional-social-media-design`

Path: `/Users/muhammedjameel/.codex/skills/professional-social-media-design`  
Declared version: none  
Declared source: none  
Declared license: none

### Useful material

- References are treated as design-DNA sources rather than templates.
- It includes concrete hierarchy, grid, typography, color, image-treatment, mobile, Arabic, and asset-license reminders.
- It rejects Pinterest, watermarks, unclear licenses, unrelated trademarks, celebrity images, copied campaigns, and low-resolution assets.
- The project inspector is Python-standard-library only and makes no network calls.

### Risks and gaps

- Named directions such as "dark high-tech SaaS" can become style shortcuts.
- Output recipes still rely on vague agency-quality adjectives.
- The quality gate evaluates the prompt/spec more than the rendered pixels.
- No concept tournament, professional pairwise comparison, anthropomorphic system, feed audit, or originality metric exists.
- No version, upstream repository, author, license, content hash, or benchmark is declared.
- `inspect_brand_context.py` recursively reads selected project files and emits snippets. It skips common build directories but has no robust secret-pattern redaction or explicit path allowlist. A sensitive file with a brand-related name could appear in output.

**Decision:** `INSPIRATION_ONLY`. Reimplement useful principles inside versioned SOCIAL_MEDIA_PLUGIN-native skills. Do not copy the skill into the runtime or invoke its inspector on sensitive roots without redaction and an allowlist.

## Local `social-social-creative`

Path: `/Users/muhammedjameel/.codex/skills/social-social-creative`  
Declared version/source/license: none

The skill has no scripts, dependencies, network behavior, or provider mutations. Its instructions are safe but only cover a concept, format, overlay copy, prompt, checklist, and variants. It lacks the corpus, visual grammar, Arabic composition, anthropomorphism, originality, multi-critic, rendered-pixel, and benchmark requirements of the rebuild.

**Decision:** `DEPRECATE` after its safe mobile-legibility and purpose-first reminders are incorporated into the project-native v2 system.

## Local `social-ad-creative`

Path: `/Users/muhammedjameel/.codex/skills/social-ad-creative`  
Declared version/source/license: none

The skill usefully separates strategic test angles and asks each concept to test one hypothesis. It has no executable code or network behavior. It is not an art-direction or visual-craft system.

**Decision:** `CONDITIONAL_QA_ONLY` for strategy/experiment inputs. It must not generate the final visual grammar or approve creative.

## Workspace `ui-ux-pro-max`

Path: `/Users/muhammedjameel/Documents/SOCIAL_MEDIA_PLUGIN-Codex/.codex/skills/ui-ux-pro-max`  
Declared version/source/license: none

### Technical inspection

- Python scripts use local CSV data and standard-library modules.
- No network or subprocess behavior was found in the scripts inspected.
- `--persist` can create or overwrite design-system Markdown files in the active project.
- The dataset provides UI styles, palettes, font pairs, UX checks, chart guidance, and stack rules, but its source and license provenance are not declared.

### Fit

The skill is aimed at web/mobile interfaces rather than social art direction. Its accessibility, responsive, contrast, and spacing checks can support objective QA. Its preselected styles, palettes, and font pairings must not influence FINAL 2026 or substitute for the professional corpus.

**Decision:** `CONDITIONAL_QA_ONLY`; use read-only searches only after provenance review. Never call `--persist` inside the Social Media Engine unless the specific write is authorized.

## Local `ad-creative` v1.1.0

Path: `/Users/muhammedjameel/.agents/skills/ad-creative`

### Technical and security signals

- Declares version 1.1.0 but no upstream source or license.
- Includes external image, video, voice, and advertising provider guidance.
- Reference material contains `curl` examples, API-key environment variables, installation commands, and local/external service endpoints.
- Platform specifications and price/model comparisons are temporally unstable and require official-source verification before use.
- Its focus is paid copy variation and performance iteration, not visual craft.

**Decision:** `INSPIRATION_ONLY`. Reuse the idea of distinct hypotheses and documented iteration, not its commands, provider choices, prices, or platform claims.

## Local `image` v1.0.0

Path: `/Users/muhammedjameel/.agents/skills/image`

### Technical and security signals

- Declares version 1.0.0 but no source or license.
- Recommends Gemini, Flux, Ideogram, OpenAI and other external APIs and asks about API keys.
- Includes web `curl` checks and local image-conversion commands.
- Its design advice is primarily tool selection, dimensions, prompt scaffolding, and optimization.
- Several model, cost, format, and platform assertions are time-sensitive.

**Decision:** `INSPIRATION_ONLY`. Official provider documentation must replace its changing claims. It is not an acceptable Art Director or critic.

## System `imagegen`

Path: `/Users/muhammedjameel/.codex/skills/.system/imagegen`  
Declared version/license: none in `SKILL.md`

### Technical and security signals

- The preferred built-in route uses an external image-generation capability without requiring a locally supplied API key.
- The explicit CLI fallback uses `OPENAI_API_KEY`, the OpenAI Python SDK, optional Pillow, network access, and local file writes.
- The inspected CLI script is approximately 995 lines, validates output formats and paths, refuses overwrite unless forced, decodes API output, and writes image assets.
- The skill supports reference-image style/composition input, which is inappropriate for unlicensed professional-corpus files.

### Bounded role

Use only after an approved original SOCIAL_MEDIA_PLUGIN concept and art-direction packet exist. Generate bespoke raster ingredients, not brand decisions or final exact typography. Do not send raw Behance/reference-corpus images unless SOCIAL_MEDIA_PLUGIN owns or has an explicit transformation license for them.

**Decision:** `SANDBOX_ONLY` until it passes the controlled benchmark, provenance capture, Arabic handoff, similarity gate, and output-rights review.

## Creative Production `produce` v0.1.25

Installed package: `/Users/muhammedjameel/.codex/plugins/cache/openai-curated-remote/creative-production/0.1.25`  
Declared repository: [OpenAI maintained plugins — Creative Production](https://github.com/openai/oai-maintained-plugins/tree/main/plugins/creative-production)  
Declared license: Proprietary  
Declared capabilities: Interactive, Write

### Technical and security signals

- Runs a local Node MCP server.
- Manages a persistent creative board and generation state.
- Contains helper scripts using subprocesses and local HTTP review tools.
- Can generate and import images and write board assets.
- Provides useful source-preservation, exact-content, deterministic-export, and review contracts.
- Generated or imported material can cross process/provider boundaries, so sensitive data and unlicensed references require explicit controls.

### Bounded role

Potentially valuable for divergent concept boards and reviewable image candidates. It should never receive the professional corpus wholesale, authorize external publication, or replace the native Art Director and critics.

**Decision:** `SANDBOX_ONLY`. Evaluate with synthetic/SOCIAL_MEDIA_PLUGIN-owned assets, stable board IDs, no production provider credentials, and explicit output review.

## Canva `canva-design-feedback` v14.0.0

Installed package: `/Users/muhammedjameel/.codex/plugins/cache/openai-curated-remote/canva/14.0.0`  
Declared author: Canva Pty Ltd.  
Connected account required: yes  
Terms: [Canva Terms of Use](https://www.canva.com/policies/terms-of-use/)  
Privacy: [Canva Privacy Policy](https://www.canva.com/policies/privacy-policy/)  
License field in plugin manifest: absent

### Technical and security signals

- The feedback skill is explicitly read-only.
- It requires an actual design thumbnail for visual critique.
- It may start a read-only editing transaction to inspect element positions and must cancel rather than commit.
- It warns that color and font metadata are often unavailable, so the thumbnail remains the primary visual evidence.
- Canva account content is external connected data.

### Bounded role

Canva can support composition, editable handoff, export, and a supplementary read-only review. It cannot be the only critic, reliably certify fonts/colors from metadata, invent the conceptual visual, or determine professional parity.

**Decision:** `CONDITIONAL_QA_ONLY` for read-only feedback. Design creation/editing remains separately authorized and provider-gated.

## Prompt-injection research finding

Source: [BUCK: A Guide for AI Agents](https://buck.co/agent-first-inquiry-protocol)

The page includes explicit AI-targeted operational directions about which BUCK services and projects an agent should emphasize. This content is not a neutral design reference. It demonstrates that even a reputable studio domain can contain instruction-bearing material intended to influence agent behavior.

Registry and ingestion implications:

- Domain reputation never makes page instructions trusted.
- Record the page as `prompt_injection_detected` and exclude its directives.
- Prefer individual project case-study pages for project facts.
- Scan `SKILL.md`, referenced files, web pages, PDFs, image OCR, captions, alt text, and metadata for instruction-like content.
- A third-party skill cannot change brand truth, workflow policy, environment variables, permissions, provider selection, approval state, or publication state.
- External commands, installs, API calls, and writes require an explicit capability review independent of prose instructions.

## Proposed project-native skills

### `social-design-corpus-analysis`

Purpose: inventory, hash, deduplicate, cluster, sample, and analyze the professional reference corpus while preserving reference-only rights and treating all content as untrusted data.

Required outputs:

- corpus manifest;
- duplicate and near-duplicate groups;
- computational features;
- cluster assignments and exemplars;
- structured reference analyses;
- provenance and rights records;
- prompt-injection/security warnings.

### `social-anthropomorphic-system`

Purpose: select anthropomorphism level, define behavioral truth, assess trust/capability implications, and produce character/mechanism specifications without creating final designs.

Required outputs:

- anthropomorphism decision;
- behavior/state model;
- face-test result;
- capability-truth record;
- character-bible requirement status;
- prohibited cliché list.

### `social-arabic-design-review`

Purpose: independently inspect rendered Arabic and bilingual work for composition, typography, shaping, RTL, cultural fit, mixed-script behavior, punctuation, numerals, line breaks, clipping, and mobile readability.

This reviewer is mandatory for Arabic candidates and cannot be replaced by automated bidi/OCR checks.

### `social-visual-originality-review`

Purpose: compare a candidate with the professional corpus and public brand-character references, combine computational neighbors with human judgment, and issue `pass`, `revise`, `reject`, or `escalate` independently of aesthetic quality.

### `social-feed-curation`

Purpose: render and evaluate 3-, 9-, 12-post, and monthly feed simulations for repetition, rhythm, family diversity, color balance, visual fatigue, and recognition.

### `social-creative-benchmark`

Purpose: run fixed briefs through old and new creative systems, preserve blinded candidate identities, coordinate pairwise critic tournaments, record score evidence, and detect golden-set regressions.

## Required registry schema additions

The following fields should be added for project-native and external entries:

```yaml
name: string
version: string_or_unknown
content_hash_sha256: string
source_type: project_native | local_personal | local_third_party | system_managed | installed_plugin
source_locator: string
upstream_repository: string_or_null
author_or_maintainer: string_or_unknown
license: string_or_unknown
license_evidence: string_or_null
purpose: string
dependencies: []
network_behavior: none | local_only | external_read | external_write
filesystem_scope: []
credential_requirements: []
data_egress: none | possible | required
external_mutation: none | possible | required
prompt_injection_review: passed | warning | failed | pending
security_review_status: string
benchmark_suite: string_or_null
benchmark_result: string
decision: ADOPT | RETAIN_AND_UPGRADE | CONDITIONAL_QA_ONLY | SANDBOX_ONLY | INSPIRATION_ONLY | DEPRECATE | REJECT
rollout_state: paused | draft | sandbox | shadow | production | deprecated
reviewer: string
last_reviewed_date: date
next_review_date: date
rejection_or_constraint_reason: string_or_null
```

Unknown is a real state. Missing source, license, version, or network evidence must never be converted to an assumption.

## Adoption gates

A creative skill cannot progress beyond `SANDBOX_ONLY` or `RETAIN_AND_UPGRADE` until it passes:

1. Complete source and referenced-file inspection.
2. Dependency and executable-code review.
3. Network, credential, filesystem, and data-egress review.
4. License and production-asset rights review.
5. Prompt-injection and untrusted-data tests.
6. Exact-copy, brand-version, Arabic, and accessibility fixtures.
7. Corpus non-copying and nearest-neighbor originality fixtures.
8. Rendered-pixel professional-quality benchmark.
9. Old-versus-new blind comparison.
10. Feed-level diversity benchmark.
11. Failure, timeout, retry, and manual-handoff behavior.
12. Owner review before production rollout.

Passing structural validation or unit tests is necessary but not sufficient for creative adoption.

## Immediate decisions

- Keep current autonomous visual production paused.
- Preserve provider, approval, exact-copy, license, render, and publication safety infrastructure.
- Build the new design-research, anthropomorphism, Arabic-review, originality, feed, and benchmark capabilities as project-native skills.
- Use external skills only within the bounded decisions recorded above.
- Do not install additional third-party skills until a missing capability is demonstrated by benchmark evidence and the candidate passes the full audit.

