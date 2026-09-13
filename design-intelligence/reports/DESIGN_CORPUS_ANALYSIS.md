# AURENDOR Design Corpus Analysis

Status: read-only inventory and triage complete  
Audit date: 2026-08-23  
Source: `/Users/muhammedjameel/Downloads/images_2026-07-25_05-56-32`

## Executive finding

The source contains **1,296 top-level primary reference images**. It also contains **1,295 quarantined JPEG derivatives** and **33 archive containers** under `_to_delete`. Those secondary layers are not additional professional references and must not inflate retrieval, clustering, sampling, or design-principle frequency.

The primary corpus is useful for studying broad concept, composition, hierarchy, palette, subject placement, and visual-family signals. It is not sufficient by itself for production-level study of micro-spacing, detailed typography, Arabic typesetting, fine texture, or final social-format behavior: every primary is landscape and almost all are low-resolution project-cover thumbnails.

The corpus is copyrighted reference material. Learn principles and relationships from it; never copy, trace, publish, redistribute, or reproduce identifiable compositions or graphics.

## Canonical corpus interpretation

| Layer | Files | Bytes | Operational role | Learning weight |
|---|---:|---:|---|---:|
| Top-level primary images | 1,296 | 108,183,294 | The only default design-analysis population | 1 before deduplication/review |
| `_to_delete/small` JPEGs | 1,295 | 33,483,050 | Quarantined resized/re-encoded derivatives | 0 |
| `_to_delete/_corpus.tar` | 1 | 109,189,120 | Package containing byte-identical copies of all primaries | 0 |
| `_to_delete/chunks/*.tar` | 16 | 109,271,040 | A second packaged partition of all primaries | 0 |
| `_to_delete/jchunks/*.tgz` | 16 | 32,812,898 | Packaged copies of all quarantined JPEGs | 0 |
| **Physical filesystem total** | **2,624** | **392,939,402** | Includes redundant packages | — |

The reconciliation is exact:

```text
1,296 primary images
+ 1,295 quarantined derivatives
+    33 archive containers
= 2,624 physical files
```

Archive verification was performed without extraction:

- `_corpus.tar` contains 1,296 files, all SHA-256-identical to their top-level counterparts.
- The 16 chunk TARs contain 1,296 files in total, all SHA-256-identical to their top-level counterparts.
- The 16 JPEG TGZs contain 1,295 files in total, all SHA-256-identical to `_to_delete/small` counterparts.
- There were zero archive member mismatches, missing members, unexpected members, or read failures.

Any ingestion code must therefore default to immediate top-level images and treat `_to_delete` as excluded/quarantined. Recursive ingestion would count encoded image instances repeatedly and corrupt all frequency-based conclusions.

## Integrity and format evidence

All 2,591 loose images passed structural verification and complete frame decoding. No corrupt or truncated image was found. Reading every archive member likewise completed without error.

### Primary files

| Evidence | Result |
|---|---:|
| Extension `.webp` | 1,289 |
| Extension `.gif` | 7 |
| Detected WebP payload | 1,288 |
| Detected GIF payload | 8 |
| Static single-frame images | 1,296 |
| RGB | 1,227 |
| RGBA | 61 |
| Palette mode | 8 |
| Corrupt/undecodable | 0 |

`Portfolio_2026_Derta_Raya.webp` has a `.webp` extension but a GIF payload. Consumers must sniff the decoded format rather than trusting the extension.

Primary byte sizes:

- minimum: 1,140 bytes;
- median: 73,154 bytes;
- P90: 162,083 bytes;
- maximum: 356,738 bytes.

Unusually small files decoded successfully; size alone is not evidence of corruption.

## Dimensions and aspect ratios

All 1,296 primary references are landscape.

| Dimensions | Count | Share |
|---|---:|---:|
| 808×632 | 936 | 72.2% |
| 800×600 | 320 | 24.7% |
| 400×300 | 25 | 1.9% |
| Other dimensions | 15 | 1.2% |

Additional evidence:

- width range: 400–1,601px;
- height range: 300–1,200px;
- median dimensions: 808×632;
- 936 images use the exact 101:79 ratio, approximately 1.278:1;
- 345 images are exactly 4:3 and 348 fall within 1.5% of 4:3;
- zero primary images are square, portrait, 4:5, or 9:16;
- only one primary exceeds roughly 800px in both practical scale and pixel count.

This distribution strongly indicates a project-cover/preview corpus, not a set of individual social deliverables. It should not be used to infer that AURENDOR production output should be landscape 4:3. Format-specific professional references are still required for square posts, 4:5 feed posts, 9:16 stories/reels, carousels, and bilingual Arabic layouts.

## Derivative relationship evidence

There are 1,295 shared filename stems between the primary layer and `_to_delete/small`. The JPEGs are resized/re-encoded versions, not independent work:

- median 128-bit difference-hash distance: 1;
- median resized RGB mean absolute error: 3.756 on a 0–255 scale;
- 1,085 pairs have identical 64-bit perceptual hashes;
- 1,293 of 1,295 pairs have perceptual-hash distance no greater than 4;
- 25 JPEGs upscale 400×300 primaries to 520×390 and add no information.

Filename stems are not safe identifiers. Both `PORTFOLIO.gif` and `PORTFOLIO.webp` exist at the top level and are visually different. The single `PORTFOLIO.jpg` derivative matches the GIF, leaving the WebP without a JPEG counterpart. Identity and derivative relationships must be hash- and similarity-based, with filenames retained only as evidence.

## Exact duplicates

SHA-256 found one exact duplicate pair among primaries:

- `Bostal_Logo_Modern_Letter_B_for_Branding_Tech_agen.webp`
- `Bostal_Logo_Modern_Letter_B_for_Branding_Tech_arro.webp`

The corresponding two JPEG derivatives are also exact duplicates. This explains the generated manifest values:

- 2,591 decoded loose files;
- 2,589 unique encoded loose payloads;
- two exact-duplicate groups across both strata;
- one redundant primary and one redundant derivative.

After exact primary-only deduplication, the default analysis population is **1,295 unique primary byte payloads**. Preserve aliases and source paths; do not delete source material.

## Perceptual and template-similarity evidence

All 839,160 possible primary pairs were compared with a 64-bit perceptual hash during the independent audit:

| Maximum distance | Candidate pairs |
|---:|---:|
| 0 | 1 |
| 4 | 2 |
| 6 | 4 |
| 8 | 6 |
| 10 | 15 |
| 12 | 31 |

Fixed perceptual-hash or difference-hash thresholds are unsafe for automatic deletion. Sparse centered-logo covers create false positives: unrelated minimal covers can have low Hamming distance because their large backgrounds and centered silhouettes dominate the hash.

Manual review did identify two useful repeated presentation-shell families:

1. `Dental_health_social_media_poster_design_ad_design.webp`, `Robot_Social_media_poster_design_ad_design_design_.webp`, and `manipulation_Social_media_ed_tech_design_juice_des.webp`.
2. `Study_In_Finland_Social_Media_Banner_Design.webp`, `Study_in_Australia_Educational_Social_Media_Post_D.webp`, and `University_of_East_London_Admission_Campaign_Desig.webp`.

These contain different creative content inside closely repeated mockup/presentation layouts. Their appropriate relationship is `template-sibling`, not `exact-duplicate`, and they should be downweighted as a family rather than discarded.

The generated `near-duplicates.json` reports 1,284 hash-connected groups because it compares both primary and derivative strata. Most groups represent the expected primary/JPEG relationship or unreviewed low-level hash candidates. That number must **not** be interpreted as 1,284 duplicate families among the 1,296 primary references.

## Corpus bias and filename signals

Filename signals overlap and are discovery hints, not verified taxonomy labels:

| Signal | Primary matches |
|---|---:|
| Social media | 366 |
| Brand identity/branding | 240 |
| AI/technology | 213 |
| UI/UX/product/web | 147 |
| Portfolio | 121 |
| Logo | 109 |
| Advertising | 73 |
| Campaign | 61 |
| Sports/gaming | 58 |
| Food/hospitality | 56 |
| Poster | 49 |
| Health/beauty | 32 |
| Arabic-region signal | 23 |
| Illustration/character/mascot | 20 |
| Education | 19 |
| Packaging | 13 |
| 3D | 10 |
| Editorial | 3 |

Twenty-five normalized filename-collision groups cover 94 files. Generic names such as `Portfolio_2026`, `logo_design`, and underscore-only filenames make filename-only joins unreliable.

Seventy-three primaries contain XMP metadata, but only seven retain a useful non-namespace creator/source URL: four files point to Dribbble profiles, two to Behance profiles, and one to Facebook. The other references do not have verifiable file-level provenance in embedded metadata. A filename or corpus-level statement that work came “primarily from Behance” is not sufficient rights metadata.

## Sampling and weighting policy

### Machine-analysis population

1. Include every `primary-top-level` image in metadata and feature extraction.
2. Assign quarantined derivatives and archive containers a learning weight of zero.
3. Collapse exact duplicates to one analytical representative while preserving every path as an alias.
4. Never collapse a perceptual-hash candidate automatically.
5. Mark reviewed repeated presentation shells as `template-sibling`; cap their total contribution so one mockup system does not masquerade as a recurring design principle.

A practical initial weighting rule is:

```text
primary, unique, unreviewed                 1.0
exact-duplicate alias                      0.0
quarantined derivative                     0.0
archive container/member                   0.0
confirmed template-sibling family          total family weight <= 1.0
rejected/unusable reference                0.0
```

Professional merit must not be inferred from inclusion, file size, cluster centrality, or filename keywords. Human art-direction review decides quality and AURENDOR suitability.

### Deep-review sample

Build a reviewed sample of approximately 180–240 primaries after exact deduplication:

- use visual-embedding clusters rather than the current low-dimensional statistics alone;
- separate semantic/content similarity from layout/presentation-shell similarity;
- choose at least one medoid and one boundary/outlier candidate per validated visual family;
- include all scarce Arabic-region, character/mascot, 3D, and editorial candidates unless a reviewer rejects them;
- oversample social, AI/technology, enterprise, data, systems, conceptual advertising, and premium editorial candidates relevant to AURENDOR;
- include both strong and weak examples so the critic learns failure boundaries;
- prevent one creator, campaign, filename family, or mockup shell from dominating the sample.

The current computational clusters are review queues, not finished design-taxonomy families. Cluster labels remain pending until multimodal and art-director review.

## What this corpus can and cannot support

### Suitable now

- broad composition and center-of-gravity analysis;
- focal-scale and hierarchy hypotheses;
- palette, saturation, contrast, and density comparisons;
- conceptual, imagery, and subject-placement research;
- preliminary visual-family discovery;
- finding repeated presentation conventions and weak template patterns.

### Requires better source material

- precise typeface, tracking, leading, and line-length judgments;
- Arabic typography and bilingual composition rules;
- micro-spacing, optical alignment, fine strokes, grain, and texture;
- carousel narrative and slide-to-slide rhythm;
- native 1:1, 4:5, and 9:16 composition behavior;
- production-safe logo clear space or exact color extraction;
- claims about original creator, license, project context, or campaign performance.

Obtain full project imagery and source URLs for selected high-value references before treating micro-detail conclusions as professional thresholds.

## Durable artifacts and handling

Generated metadata and contact sheets currently live under `design-intelligence/corpus/`:

- `manifest.json`
- `files.json`
- `clusters.json`
- `exact-duplicates.json`
- `near-duplicates.json`
- `corrupt-files.json`
- `contact-sheets/`
- `corpus.schema.json`

The full original references were not copied into the repository. Contact sheets are derived previews containing copyrighted pixels and are **internal reference-only**. Do not expose them through the web application, publish them, package them in public releases, or redistribute them. Keep source paths, hashes, provenance, and rights restrictions attached to all downstream analyses.

`corpus.schema.json` defines the normalized contract for file records, logical references, similarity decisions, provenance/rights, sampling weights, and structured design review. Exact identity is content-based; derivative and template relationships require explicit evidence and review state.

## Required next actions

1. Make primary-only filtering the default for all retrieval and corpus statistics.
2. Treat generated near-duplicate groups as candidates until relation review is recorded.
3. Add visual and layout embeddings with versioned model metadata.
4. Build the 180–240-item stratified review set and record why each item was selected.
5. Recover creator/project URLs and rights context for every golden reference.
6. Supplement selected references with full-resolution project images and native social formats.
7. Run multimodal art-direction analysis only after those selection and provenance gates.

