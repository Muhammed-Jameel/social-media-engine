#!/usr/bin/env python3
"""Build reviewer-only nearest-neighbor evidence for round-three renders.

The output deliberately does not make an originality decision. Perceptual and
feature ranks only route a human reviewer to plausible external and recent-feed
neighbors. Reference pixels are written solely to clearly marked internal audit
sheets and are never supplied to generation.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "artifacts" / "creative-rebuild" / "benchmarks-v2-round3"
OUTPUT = ROOT / "artifacts" / "creative-rebuild" / "originality"
SHEET_DIRECTORY = OUTPUT / "round3-reviewer-only-neighbors"
CORPUS_FILES = ROOT / "design-intelligence" / "corpus" / "files.json"
ANALYZER_PATH = ROOT / "scripts" / "analyze-design-corpus.py"


def load_analyzer() -> Any:
    spec = importlib.util.spec_from_file_location("aurendor_corpus_analyzer", ANALYZER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load {ANALYZER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def hamming(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def rank(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values, kind="stable")
    ranks = np.empty_like(order)
    ranks[order] = np.arange(1, len(values) + 1)
    return ranks


def reviewer_sheet(candidate_path: Path, neighbors: list[dict[str, Any]], destination: Path) -> None:
    columns, cell_width, image_height, label_height = 3, 360, 320, 68
    rows = 2
    canvas = Image.new("RGB", (columns * cell_width, 64 + rows * (image_height + label_height)), "#DCE7E0")
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    draw.text((18, 20), "INTERNAL ORIGINALITY REVIEW ONLY - reference pixels never supplied to generation", fill="#003F35", font=font)
    entries = [(candidate_path, f"CANDIDATE  {candidate_path.stem}")] + [
        (Path(neighbor["_sourcePath"]), f"NEIGHBOR  {neighbor['referenceId']}") for neighbor in neighbors[:5]
    ]
    for index, (path, label) in enumerate(entries):
        row, column = divmod(index, columns)
        x, y = column * cell_width, 64 + row * (image_height + label_height)
        with Image.open(path) as opened:
            opened.seek(0)
            image = ImageOps.fit(ImageOps.exif_transpose(opened).convert("RGB"), (cell_width, image_height), method=Image.Resampling.LANCZOS)
        canvas.paste(image, (x, y))
        draw.rectangle((x, y + image_height, x + cell_width, y + image_height + label_height), fill="#F4F8F5")
        draw.text((x + 12, y + image_height + 13), label, fill="#003F35", font=font)
        if index:
            draw.text((x + 12, y + image_height + 36), "Compare structure; hash rank is not a verdict", fill="#526B5F", font=font)
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, format="PNG", optimize=True)


def main() -> None:
    analyzer = load_analyzer()
    manifest_path = ARCHIVE / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    corpus_payload = json.loads(CORPUS_FILES.read_text(encoding="utf8"))
    corpus_records = [record for record in corpus_payload["files"] if record["sourceStratum"] == "primary-top-level"]
    if not corpus_records:
        raise RuntimeError("No primary corpus records are available for originality routing.")

    corpus_vectors = np.asarray([record["featureVector"] for record in corpus_records], dtype=np.float64)
    means = corpus_vectors.mean(axis=0)
    deviations = corpus_vectors.std(axis=0)
    deviations[deviations < 1e-8] = 1.0
    normalized_corpus = (corpus_vectors - means) / deviations

    candidates: list[dict[str, Any]] = []
    candidate_vectors: list[np.ndarray] = []
    for creative in manifest["creatives"]:
        path = ARCHIVE / creative["file"]
        with Image.open(path) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
            width, height = image.size
            _, feature_vector = analyzer.image_features(image, width, height)
            perceptual_hash = analyzer.dhash(image)
        vector = np.asarray(feature_vector, dtype=np.float64)
        normalized = (vector - means) / deviations
        candidate_vectors.append(normalized)
        feature_distances = np.linalg.norm(normalized_corpus - normalized, axis=1) / np.sqrt(normalized_corpus.shape[1])
        hash_distances = np.asarray([hamming(perceptual_hash, record["perceptualHash"]) for record in corpus_records], dtype=np.float64)
        aspect_distances = np.asarray([abs(np.log((width / height) / record["aspectRatio"])) for record in corpus_records], dtype=np.float64)
        fused = 1.0 / (60 + rank(feature_distances)) + 1.0 / (60 + rank(hash_distances)) + 1.0 / (60 + rank(aspect_distances))
        ordered = np.argsort(-fused, kind="stable")[:8]
        neighbors: list[dict[str, Any]] = []
        for index in ordered:
            record = corpus_records[int(index)]
            neighbors.append(
                {
                    "referenceId": record["referenceId"],
                    "sha256": record["sha256"],
                    "perceptualHashDistance": int(hash_distances[index]),
                    "normalizedFeatureDistance": round(float(feature_distances[index]), 6),
                    "aspectLogDistance": round(float(aspect_distances[index]), 6),
                    "reciprocalRankFusionScore": round(float(fused[index]), 9),
                    "_sourcePath": record["sourcePath"],
                }
            )
        sheet_path = SHEET_DIRECTORY / f"{creative['id']}-nearest-5.png"
        reviewer_sheet(path, neighbors, sheet_path)
        candidates.append(
            {
                "renderedAssetId": creative["id"],
                "renderedAssetSha256": sha256(path),
                "perceptualHash64": perceptual_hash,
                "declaredReferenceIds": creative["referenceIds"],
                "declaredPrincipleIds": creative["principleIds"],
                "nearestCorpusCandidates": [{key: value for key, value in neighbor.items() if key != "_sourcePath"} for neighbor in neighbors],
                "reviewerOnlySheet": str(sheet_path.relative_to(ROOT)),
                "automatedDecision": "REVIEWER_REQUIRED",
            }
        )

    candidate_matrix = np.asarray(candidate_vectors)
    for index, candidate in enumerate(candidates):
        distances = np.linalg.norm(candidate_matrix - candidate_matrix[index], axis=1) / np.sqrt(candidate_matrix.shape[1])
        hash_distances = np.asarray(
            [hamming(candidate["perceptualHash64"], other["perceptualHash64"]) for other in candidates],
            dtype=np.float64,
        )
        distances[index] = np.inf
        hash_distances[index] = np.inf
        nearest = np.lexsort((distances, hash_distances))[:3]
        candidate["nearestRecentFeedCandidates"] = [
            {
                "renderedAssetId": candidates[int(other)]["renderedAssetId"],
                "perceptualHashDistance": int(hash_distances[other]),
                "normalizedFeatureDistance": round(float(distances[other]), 6),
            }
            for other in nearest
        ]

    output = {
        "schemaVersion": "1.0.0",
        "generatedAt": datetime.now(UTC).isoformat(),
        "purpose": "Reviewer routing only; automated similarity never establishes copying or clearance.",
        "securityBoundary": "Reference pixels remain in reviewer-only audit sheets and were never supplied to image generation.",
        "candidateManifest": str(manifest_path.relative_to(ROOT)),
        "candidateManifestSha256": sha256(manifest_path),
        "corpusIndex": str(CORPUS_FILES.relative_to(ROOT)),
        "corpusIndexSha256": sha256(CORPUS_FILES),
        "corpusPrimaryCount": len(corpus_records),
        "rankingMethod": "Reciprocal-rank fusion of 64-bit dHash, standardized structural feature distance, and aspect distance; no pass threshold.",
        "candidates": candidates,
    }
    OUTPUT.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT / "round3-candidate-neighbors.json"
    destination.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"Wrote {destination.relative_to(ROOT)} and {len(candidates)} reviewer-only contact sheets.")


if __name__ == "__main__":
    main()
