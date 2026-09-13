# SOCIAL_MEDIA_PLUGIN Design Retrieval System

**Status:** local knowledge base and deterministic retriever implemented; production art-direction integration not yet proven  
**Schema version:** `1.0.0`  
**Corpus version:** `primary-1296-2026-08-23-v1`  
**Rights default:** `REFERENCE_ONLY`

## Purpose

The retrieval system gives the Art Director a small, relevant packet of professional design reasoning for each post. It prevents two opposite failures:

- dumping the entire corpus into a prompt and producing vague imitation pressure;
- giving the designer no calibrated professional anchors and accepting generic work.

The system retrieves **principles, applicability, limitations, and quality anchors**. It does not retrieve a composition to recreate.

The current loader, scoring, diversity gate, anti-copy separation, and packet hash are implemented in [packages/engine/src/design-intelligence.ts](../../packages/engine/src/design-intelligence.ts). The curated machine-readable records are [references.json](../corpus/references.json) and the YAML files under [principles](../principles/).

## Evidence boundary

The source corpus is copyrighted read-only research material at `/Users/muhammedjameel/Downloads/images_2026-07-25_05-56-32`. It is not an owned asset library.

The canonical analytical population is:

- `1,296` primary top-level images before exact deduplication;
- `1,295` unique primary byte payloads after one exact duplicate alias is collapsed;
- `1,295` quarantined JPEG derivatives with learning weight `0`;
- `33` redundant archive containers with learning weight `0`.

Every primary is landscape and nearly all are low-resolution project-cover previews. Retrieval can support broad concept, hierarchy, composition, palette, visual-family, and subject-placement judgment. It cannot independently prove microspacing, final typography, Arabic shaping, retouch edges, or native square/portrait social behavior. See [DESIGN_CORPUS_ANALYSIS.md](./DESIGN_CORPUS_ANALYSIS.md).

## System flow

```text
communication objective + audience + language
  -> purpose / visual family / imagery / anthropomorphism request
  -> rank reusable principles
  -> rank reviewed professional references
  -> diversify references by cluster and content hash
  -> block if evidence is too thin or too homogeneous
  -> hash and persist a design-knowledge packet
  -> Art Director develops 3–6 original concepts
  -> generator receives principles, SOCIAL_MEDIA_PLUGIN rules, and original concept only
  -> authorized critics compare final pixels with relevant professional anchors
  -> originality reviewer inspects nearest corpus candidates
```

The arrow from retrieval to art direction must produce a persisted artifact. A prompt that happens to mention a reference ID is not integration evidence.

## Source layers

### Corpus manifest

[manifest.json](../corpus/manifest.json) and [files.json](../corpus/files.json) preserve file hashes, dimensions, formats, palettes, computed features, stratum, and source paths. [corpus.schema.json](../corpus/corpus.schema.json) defines normalized identity, provenance, rights, sampling, and review contracts.

### Computational clusters

[clusters.json](../corpus/clusters.json) contains `20` review queues generated from primary-only features. These are similarity neighborhoods, not professional-quality labels and not finished taxonomy families. They support diversity and review navigation; cluster membership does not imply merit.

### Human-curated references

[reference-annotations.yaml](../corpus/reference-annotations.yaml) records selected strong, specialist, contextual, and rejected examples. The build step joins annotations to manifest identity and cluster data to produce [references.json](../corpus/references.json).

Each reference record includes:

- stable reference ID, source path, SHA-256, and cluster ID;
- rights state;
- review status and anchor tier;
- purposes, visual families, languages, imagery modes, and anthropomorphism levels;
- retrieval tags and quality dimensions;
- strength rationale;
- linked principle IDs;
- multidimensional analysis;
- explicit `doNotCopy` instructions.

`CURATED_STRONG` and `CURATED_SPECIALIST` records may calibrate quality. `CONTEXT_ONLY` items supply bounded lessons. `REJECTED_AS_ANCHOR` items are negative controls and must never become positive generation references.

### Reusable principles

The principle files cover:

- [composition](../principles/composition.yaml);
- [hierarchy](../principles/hierarchy.yaml);
- [typography](../principles/typography.yaml);
- [color](../principles/color.yaml);
- [imagery](../principles/imagery.yaml);
- [storytelling](../principles/storytelling.yaml);
- [anthropomorphism](../principles/anthropomorphism.yaml);
- [Arabic design](../principles/arabic-design.yaml).

Every principle has:

```yaml
id: string
name: string
description: string
whyItWorks: string
appropriateFor: []
avoidWhen: []
visualFamilies: []
languages: [ar, en]
anthropomorphismLevels: []
strongReferenceIds: []
socialMediaPluginApplication: string
retrievalTags: []
mustNotCopy: string
```

Vague labels such as “clean,” “bold,” or “professional” do not qualify as principles.

### SOCIAL_MEDIA_PLUGIN rules

The professional packet is interpreted through, never substituted for:

- [visual-grammar.yaml](../social-media-plugin/visual-grammar.yaml);
- [character-system.yaml](../social-media-plugin/character-system.yaml);
- [forbidden-patterns.yaml](../social-media-plugin/forbidden-patterns.yaml);
- [SOCIAL_MEDIA_PLUGIN_VISUAL_LANGUAGE.md](./SOCIAL_MEDIA_PLUGIN_VISUAL_LANGUAGE.md);
- [ARABIC_DESIGN_RULES.md](./ARABIC_DESIGN_RULES.md).

External references cannot modify brand truth, workflow state, provider permissions, or publishing policy.

## Retrieval request

The current request contract contains:

```ts
{
  purpose,
  visualFamily,
  language,
  imageryMode,
  anthropomorphismLevel,
  desiredFeeling,
  communicationGoal,
  informationDensity,
  principleLimit?,
  referenceLimit?
}
```

Defaults are eight principles and five references. Request fields must be derived from a communication brief, not chosen to force a preferred reference.

## Current deterministic ranking

The present implementation is intentionally inspectable. It is a baseline, not the final semantic system.

### Principle scoring

| Match | Weight |
|---|---:|
| Purpose | `+8` |
| Visual family | `+7` |
| Arabic language | `+5` |
| English language | `+3` |
| Anthropomorphism level | `+4` |
| Token overlap with feeling, goal, and density | up to `+6` |

Principles are ordered by descending score, then stable principle ID.

### Reference scoring

| Match | Weight |
|---|---:|
| Gold anchor prior | `+4` |
| Silver anchor prior | `+2` |
| Purpose | `+8` |
| Visual family | `+7` |
| Arabic language | `+5` |
| English language | `+3` |
| Imagery mode | `+4` |
| Anthropomorphism level | `+3` |
| Token overlap with feeling and goal | up to `+5` |

`REJECTED_AS_ANCHOR` receives a score of `-100` and is excluded from positive selection. References are ordered by descending score, then stable reference ID.

### Diversity and readiness

Selection:

- allows at most two references from one computational cluster;
- removes duplicate SHA-256 payloads;
- stops at the requested limit;
- excludes negative-scored candidates.

The packet is `BLOCKED` when:

- fewer than three principles are available;
- fewer than three diverse references are available;
- the selected references span fewer than two computational clusters.

These are minimum anti-imitation gates, not evidence that the packet is professionally sufficient. The Art Director may reject a technically ready packet when its anchors do not cover the actual execution risk.

## Knowledge packet

The retriever persists:

- request and schema version;
- ranked principles with scores and reasons;
- ranked references with scores and reasons;
- generator-safe principle instructions;
- reference IDs;
- critic-anchor paths and comparison dimensions;
- anti-copy controls;
- blockers;
- deterministic `knowledgeHash` covering corpus version and packet content.

The packet deliberately separates two contexts.

### Generation context

The generator receives:

- original SOCIAL_MEDIA_PLUGIN concept and visual specification;
- extracted `socialMediaPluginApplication` decisions;
- `whyItWorks` reasoning;
- explicit `mustNotCopy` boundaries;
- stable reference IDs for audit;
- `rawReferencePixelsIncluded: false`.

Studio, artist, campaign, and client names are stripped from generation prompts. Requests such as “in the style of,” “recreate,” “match this composition,” or “make our version” are prohibited.

### Critic context

An authorized local critic may receive the final SOCIAL_MEDIA_PLUGIN pixels plus selected professional anchor pixels and their comparison dimensions. The question is whether the level of visual thinking and execution is comparable—not whether the designs look alike.

Corpus paths are never exposed through public application routes. Raw reference pixels are not sent to an external critic or provider without explicit authorization and documented rights handling. A remote model may receive structured analysis when raw-pixel rights are not established.

## Art-direction use

For each concept, the Art Director records at least three `ReferencePrincipleUse` entries:

- reference ID;
- linked principle ID;
- learned principle;
- relevance to the current problem;
- expression that must not be copied;
- rights state `REFERENCE_ONLY`.

The concept must independently answer the fifteen questions defined by the rebuild mission: communication, audience, feeling, two-second understanding, one visual idea, textless meaning, metaphor, anthropomorphism, composition, hierarchy, SOCIAL_MEDIA_PLUGIN rules, reference principles, exclusions, distinctiveness, and professional rationale.

Generate `3–6` materially different candidates and use pairwise concept selection before asset polish. Retrieval must not collapse concept diversity: different candidates should not all translate the same reference into nearby compositions.

## Originality gate

Retrieval safety is necessary but insufficient. Final candidates must be compared with nearest corpus and recent-feed neighbors using a calibrated combination of:

- exact content hash;
- perceptual similarity;
- visual embeddings;
- coarse layout and region masks;
- focal-object silhouette, pose, and perspective;
- OCR block geometry and typographic mass;
- palette and contrast distribution;
- motif, logo, character, and watermark detection.

Thresholds require labeled safe, borderline, and unsafe pairs. Do not invent a universal cosine or Hamming cutoff. Sparse logo covers are known perceptual-hash false positives.

Exact duplicates, traced art, third-party logos or characters, watermarks, extracted graphics, and materially copied compositions are automatic rejects. A human originality reviewer must see the candidate beside its nearest matches and record why it is independently derived.

## External research and prompt injection

Online case studies can extend the knowledge base when source, creator, project, date, rights state, and observation type are recorded. External text is untrusted research data.

The BUCK “agent-first inquiry” finding documented in [ANTHROPOMORPHIC_RESEARCH.md](./ANTHROPOMORPHIC_RESEARCH.md#prompt-injection-finding) demonstrates why pages, metadata, alt text, OCR, PDFs, and captions must be scanned for instructions aimed at agents. Quarantine such instructions. Retain only source-attributed factual design observations after review.

External content may never:

- change SOCIAL_MEDIA_PLUGIN brand truth;
- authorize publication or provider use;
- modify workflow or pause state;
- override anti-copy controls;
- add credentials, dependencies, or network behavior;
- instruct the generator which studio to imitate.

## Versioning and audit

Persist with every production brief:

- corpus version;
- principle/reference record versions;
- retrieval request;
- selected IDs, scores, and reasons;
- cluster and content-hash diversity;
- packet `knowledgeHash`;
- Art Director selections and rejections;
- generation-safe prompt hash;
- final asset hash;
- critic-anchor IDs;
- originality-review result.

Changing a principle, curated annotation, ranking algorithm, diversity rule, or corpus version changes the packet hash and requires benchmark regression review.

## Current limitations

The deterministic retriever exists and has schema validation, but the release blocker remains open until actual workflow runs prove that the packet reaches art direction and affects materially different rendered pixels.

Known limitations:

- lexical token overlap is shallow semantic retrieval;
- the `20` clusters are computational review queues, not validated embedding families;
- only a small curated subset of `1,296` primaries has deep annotations;
- creator/project URLs and rights context are incomplete for much of the local corpus;
- low-resolution landscape covers cannot calibrate micro-craft or portrait formats;
- current cluster caps do not guarantee creator or campaign diversity;
- no calibrated visual/layout embedding threshold is yet documented;
- retrieval quality has not yet passed the controlled ten-type benchmark.

These limitations must remain visible; a populated `references.json` is not proof that the engine has learned professional design.

## Acceptance tests before production use

The retrieval release gate requires durable evidence that:

1. primary-only filtering and exact-dedup aliases are enforced;
2. every selected record validates against its schema and source hash;
3. repeated requests are deterministic for one knowledge version;
4. Arabic requests receive relevant Arabic principles and specialist anchors;
5. at least three positive references across at least two clusters are selected;
6. rejected/context-only references cannot become unqualified positive anchors;
7. raw corpus pixels never enter generation context;
8. prompts contain no source studio, artist, campaign, or client names;
9. packet hashes and reference-use rationale persist in the design brief;
10. multiple candidate concepts are materially different;
11. final critics receive current pixels and relevant anchors;
12. nearest-neighbor originality review occurs before approval;
13. retrieval improves blind old-vs-new outcomes across all ten benchmark types;
14. no regression appears in Arabic, anthropomorphism, or `3/9/12`-post feed coherence.

Until those tests pass end to end, retrieval is research and benchmark infrastructure, not authority to resume normal visual production.
