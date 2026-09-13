#!/usr/bin/env python3
"""Build a read-only visual inventory of the professional reference corpus.

The script never writes to the source tree. It emits content-addressed metadata,
perceptual duplicate groups, visual-feature clusters, and low-resolution review
contact sheets inside design-intelligence/corpus.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps


DEFAULT_SOURCE = Path("/Users/muhammedjameel/Downloads/images_2026-07-25_05-56-32")
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "design-intelligence" / "corpus"
SUPPORTED_EXTENSIONS = {
    ".avif",
    ".bmp",
    ".gif",
    ".heic",
    ".jpeg",
    ".jpg",
    ".png",
    ".tif",
    ".tiff",
    ".webp",
}


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def path_id(relative_path: str) -> str:
    return hashlib.sha256(relative_path.encode("utf-8")).hexdigest()[:10]


def percentile(values: Iterable[float], value: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = min(len(ordered) - 1, max(0, round(value * (len(ordered) - 1))))
    return float(ordered[index])


def rgb_to_hex(rgb: np.ndarray) -> str:
    bounded = np.clip(np.rint(rgb * 255), 0, 255).astype(np.uint8)
    return "#" + "".join(f"{int(channel):02X}" for channel in bounded)


def dominant_palette(rgb: np.ndarray, clusters: int = 5) -> list[dict[str, Any]]:
    pixels = rgb.reshape(-1, 3)
    if len(pixels) > 2304:
        indexes = np.linspace(0, len(pixels) - 1, 2304, dtype=int)
        pixels = pixels[indexes]
    first = pixels[len(pixels) // 2]
    centers = [first]
    for _ in range(1, min(clusters, len(pixels))):
        distances = np.min(
            np.stack([np.sum((pixels - center) ** 2, axis=1) for center in centers]),
            axis=0,
        )
        centers.append(pixels[int(np.argmax(distances))])
    center_array = np.asarray(centers, dtype=np.float32)
    labels = np.zeros(len(pixels), dtype=np.int32)
    for _ in range(10):
        distances = np.sum((pixels[:, None, :] - center_array[None, :, :]) ** 2, axis=2)
        labels = np.argmin(distances, axis=1)
        next_centers = center_array.copy()
        for index in range(len(center_array)):
            members = pixels[labels == index]
            if len(members):
                next_centers[index] = np.mean(members, axis=0)
        if np.allclose(center_array, next_centers, atol=1e-4):
            break
        center_array = next_centers
    counts = Counter(labels.tolist())
    total = max(1, len(labels))
    ordered = sorted(range(len(center_array)), key=lambda index: counts[index], reverse=True)
    return [
        {"hex": rgb_to_hex(center_array[index]), "share": round(counts[index] / total, 4)}
        for index in ordered
    ]


def dhash(image: Image.Image) -> str:
    gray = image.convert("L").resize((9, 8), Image.Resampling.LANCZOS)
    values = np.asarray(gray, dtype=np.int16)
    bits = values[:, 1:] > values[:, :-1]
    packed = 0
    for bit in bits.flatten():
        packed = (packed << 1) | int(bit)
    return f"{packed:016x}"


def image_features(image: Image.Image, width: int, height: int) -> tuple[dict[str, Any], list[float]]:
    sample = image.convert("RGB").resize((96, 96), Image.Resampling.LANCZOS)
    rgb = np.asarray(sample, dtype=np.float32) / 255.0
    maximum = np.max(rgb, axis=2)
    minimum = np.min(rgb, axis=2)
    chroma = maximum - minimum
    saturation = np.divide(chroma, maximum, out=np.zeros_like(chroma), where=maximum > 1e-6)
    luminance = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    gradient_x = np.abs(np.diff(luminance, axis=1, prepend=luminance[:, :1]))
    gradient_y = np.abs(np.diff(luminance, axis=0, prepend=luminance[:1, :]))
    gradient = np.sqrt(gradient_x**2 + gradient_y**2)
    border = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]), axis=0)
    border_color = np.median(border, axis=0)
    border_distance = np.sqrt(np.sum((rgb - border_color) ** 2, axis=2))
    whitespace_mask = (border_distance < 0.085) & (gradient < 0.035)
    visual_mass = gradient + np.abs(luminance - np.median(luminance)) * 0.35
    mass_total = float(np.sum(visual_mass))
    yy, xx = np.mgrid[0:96, 0:96]
    center_x = float(np.sum(xx * visual_mass) / mass_total / 95) if mass_total else 0.5
    center_y = float(np.sum(yy * visual_mass) / mass_total / 95) if mass_total else 0.5
    luma_cells: list[float] = []
    edge_cells: list[float] = []
    for row in range(4):
        for column in range(4):
            y0, y1 = row * 24, (row + 1) * 24
            x0, x1 = column * 24, (column + 1) * 24
            luma_cells.append(float(np.mean(luminance[y0:y1, x0:x1])))
            edge_cells.append(float(np.mean(gradient[y0:y1, x0:x1])))
    p05 = float(np.quantile(luminance, 0.05))
    p95 = float(np.quantile(luminance, 0.95))
    aspect = width / height if height else 1.0
    metrics = {
        "meanLuminance": round(float(np.mean(luminance)), 4),
        "luminanceContrast": round(p95 - p05, 4),
        "meanSaturation": round(float(np.mean(saturation)), 4),
        "colorfulness": round(float(np.std(rgb[:, :, 0] - rgb[:, :, 1]) + np.std(rgb[:, :, 1] - rgb[:, :, 2])), 4),
        "edgeDensity": round(float(np.mean(gradient > 0.075)), 4),
        "approximateWhitespace": round(float(np.mean(whitespace_mask)), 4),
        "visualCenter": {"x": round(center_x, 4), "y": round(center_y, 4)},
        "dominantPalette": dominant_palette(rgb),
    }
    vector = [
        math.log(max(0.2, min(5.0, aspect))),
        metrics["meanLuminance"],
        metrics["luminanceContrast"],
        metrics["meanSaturation"],
        metrics["colorfulness"],
        metrics["edgeDensity"],
        metrics["approximateWhitespace"],
        center_x,
        center_y,
        *luma_cells,
        *edge_cells,
    ]
    return metrics, [round(float(item), 6) for item in vector]


def infer_aspect_family(width: int, height: int) -> str:
    ratio = width / height if height else 1
    options = {
        "portrait-4:5": 4 / 5,
        "portrait-3:4": 3 / 4,
        "story-9:16": 9 / 16,
        "square-1:1": 1,
        "landscape-4:3": 4 / 3,
        "landscape-16:9": 16 / 9,
    }
    name, target = min(options.items(), key=lambda item: abs(math.log(max(ratio, 1e-6) / item[1])))
    return name if abs(math.log(max(ratio, 1e-6) / target)) < 0.16 else ("portrait-other" if ratio < 1 else "landscape-other")


def filename_signals(name: str) -> list[str]:
    normalized = name.lower().replace("-", "_")
    vocabulary = {
        "social-campaign": ("social", "campaign", "instagram", "facebook", "post"),
        "editorial-poster": ("poster", "editorial", "magazine", "cover"),
        "identity-branding": ("branding", "identity", "brand_", "logo"),
        "technology-ai": ("tech", "digital", "software", "platform", " ai_", "artificial", "robot"),
        "product-commercial": ("product", "shop", "commerce", "gadget", "food", "real_estate"),
        "character-illustration": ("character", "illustration", "mascot", "cartoon", "3d"),
        "typography": ("typography", "typeface", "lettering", "font"),
        "data-information": ("data", "infographic", "report", "statistic", "dashboard"),
        "event-announcement": ("event", "festival", "conference", "announcement"),
    }
    return [label for label, terms in vocabulary.items() if any(term in normalized for term in terms)]


def deterministic_kmeans(vectors: np.ndarray, cluster_count: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    means = vectors.mean(axis=0)
    scales = vectors.std(axis=0)
    scales[scales < 1e-6] = 1
    normalized = (vectors - means) / scales
    centers = [normalized[int(np.argmax(np.linalg.norm(normalized, axis=1)))]]
    for _ in range(1, cluster_count):
        distance = np.min(
            np.stack([np.sum((normalized - center) ** 2, axis=1) for center in centers]),
            axis=0,
        )
        centers.append(normalized[int(np.argmax(distance))])
    center_array = np.asarray(centers)
    labels = np.zeros(len(normalized), dtype=np.int32)
    for _ in range(40):
        distances = np.sum((normalized[:, None, :] - center_array[None, :, :]) ** 2, axis=2)
        next_labels = np.argmin(distances, axis=1)
        next_centers = center_array.copy()
        for index in range(cluster_count):
            members = normalized[next_labels == index]
            if len(members):
                next_centers[index] = np.mean(members, axis=0)
        if np.array_equal(labels, next_labels) and np.allclose(center_array, next_centers, atol=1e-6):
            labels = next_labels
            center_array = next_centers
            break
        labels = next_labels
        center_array = next_centers
    distances = np.linalg.norm(normalized - center_array[labels], axis=1)
    return labels, distances, center_array


class UnionFind:
    def __init__(self) -> None:
        self.parent: dict[str, str] = {}

    def find(self, item: str) -> str:
        self.parent.setdefault(item, item)
        if self.parent[item] != item:
            self.parent[item] = self.find(self.parent[item])
        return self.parent[item]

    def union(self, left: str, right: str) -> None:
        left_root, right_root = self.find(left), self.find(right)
        if left_root != right_root:
            self.parent[right_root] = left_root


def hamming_distance(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()


def near_duplicate_groups(records: list[dict[str, Any]], threshold: int = 6) -> tuple[list[dict[str, Any]], int]:
    buckets: dict[tuple[int, str], list[int]] = defaultdict(list)
    union = UnionFind()
    comparisons: set[tuple[int, int]] = set()
    for index, record in enumerate(records):
        hash_value = record["perceptualHash"]
        aspect_bucket = round(math.log(max(record["aspectRatio"], 1e-6)) * 5)
        candidates: set[int] = set()
        for band in range(4):
            part = hash_value[band * 4 : (band + 1) * 4]
            for nearby_bucket in (aspect_bucket - 1, aspect_bucket, aspect_bucket + 1):
                candidates.update(buckets[(nearby_bucket * 4 + band, part)])
        for candidate in candidates:
            pair = (candidate, index)
            comparisons.add(pair)
            other = records[candidate]
            if abs(math.log(max(record["aspectRatio"], 1e-6) / max(other["aspectRatio"], 1e-6))) > 0.12:
                continue
            distance = hamming_distance(hash_value, other["perceptualHash"])
            if distance <= threshold and record["sha256"] != other["sha256"]:
                union.union(record["referenceId"], other["referenceId"])
        for band in range(4):
            part = hash_value[band * 4 : (band + 1) * 4]
            buckets[(aspect_bucket * 4 + band, part)].append(index)
    grouped: dict[str, set[str]] = defaultdict(set)
    by_id = {record["referenceId"]: record for record in records}
    for item in union.parent:
        grouped[union.find(item)].add(item)
    output: list[dict[str, Any]] = []
    for group in grouped.values():
        if len(group) < 2:
            continue
        ids = sorted(group)
        anchor = ids[0]
        output.append(
            {
                "groupId": f"near_{hashlib.sha256('|'.join(ids).encode()).hexdigest()[:12]}",
                "referenceIds": ids,
                "maximumDistanceFromAnchor": max(hamming_distance(by_id[anchor]["perceptualHash"], by_id[item]["perceptualHash"]) for item in ids),
            }
        )
    return sorted(output, key=lambda group: (-len(group["referenceIds"]), group["groupId"])), len(comparisons)


def fit_thumbnail(path: Path, size: tuple[int, int]) -> Image.Image:
    with Image.open(path) as image:
        image.seek(0)
        flattened = ImageOps.exif_transpose(image).convert("RGB")
        return ImageOps.fit(flattened, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))


def create_contact_sheet(
    records: list[dict[str, Any]],
    destination: Path,
    title: str,
    columns: int = 4,
    rows: int = 3,
) -> None:
    cell_width, image_height, label_height = 280, 220, 62
    header_height = 62
    canvas = Image.new("RGB", (columns * cell_width, header_height + rows * (image_height + label_height)), "#F4F8F5")
    draw = ImageDraw.Draw(canvas)
    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 24)
        label_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 15)
    except OSError:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
    draw.text((18, 16), f"INTERNAL REFERENCE ONLY · {title}", fill="#003F35", font=title_font)
    for index, record in enumerate(records[: columns * rows]):
        row, column = divmod(index, columns)
        x, y = column * cell_width, header_height + row * (image_height + label_height)
        try:
            thumbnail = fit_thumbnail(Path(record["sourcePath"]), (cell_width, image_height))
            canvas.paste(thumbnail, (x, y))
        except Exception:
            draw.rectangle((x, y, x + cell_width, y + image_height), fill="#CFDDD4")
            draw.text((x + 12, y + 96), "UNREADABLE", fill="#003F35", font=label_font)
        metrics = record["visualMetrics"]
        label = f"{record['referenceId']}  {record['width']}×{record['height']}\nedge {metrics['edgeDensity']:.2f}  space {metrics['approximateWhitespace']:.2f}"
        draw.multiline_text((x + 10, y + image_height + 8), label, fill="#0B201B", font=label_font, spacing=3)
        draw.rectangle((x, y, x + cell_width - 1, y + image_height + label_height - 1), outline="#B7C9BE", width=1)
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "JPEG", quality=86, optimize=True)


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--clusters", type=int, default=20)
    parser.add_argument("--representatives", type=int, default=12)
    arguments = parser.parse_args()
    source = arguments.source.resolve()
    output = arguments.output.resolve()
    if not source.is_dir():
        raise SystemExit(f"Corpus directory does not exist: {source}")
    if output == source or source in output.parents:
        raise SystemExit("Output must not be inside the read-only corpus.")

    all_files = sorted((path for path in source.rglob("*") if path.is_file()), key=lambda path: str(path.relative_to(source)).casefold())
    records: list[dict[str, Any]] = []
    corrupt: list[dict[str, str]] = []
    ignored: list[dict[str, str]] = []
    for ordinal, path in enumerate(all_files, start=1):
        relative = str(path.relative_to(source))
        if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            ignored.append({"relativePath": relative, "reason": "unsupported-extension"})
            continue
        try:
            digest = file_sha256(path)
            with Image.open(path) as opened:
                frame_count = int(getattr(opened, "n_frames", 1))
                opened.seek(0)
                image = ImageOps.exif_transpose(opened).convert("RGB")
                width, height = image.size
                metrics, vector = image_features(image, width, height)
                perceptual_hash = dhash(image)
                detected_format = opened.format or path.suffix.removeprefix(".").upper()
            records.append(
                {
                    "fileId": f"file_{path_id(relative)}",
                    "referenceId": f"ref_{digest[:16]}",
                    "sha256": digest,
                    "sourcePath": str(path),
                    "sourceRelativePath": relative,
                    "sourceStratum": "primary-top-level" if len(path.relative_to(source).parts) == 1 else "quarantined-derived",
                    "bytes": path.stat().st_size,
                    "format": detected_format,
                    "extension": path.suffix.lower(),
                    "width": width,
                    "height": height,
                    "megapixels": round(width * height / 1_000_000, 4),
                    "aspectRatio": round(width / height, 6),
                    "aspectFamily": infer_aspect_family(width, height),
                    "frameCount": frame_count,
                    "perceptualHash": perceptual_hash,
                    "filenameSignals": filename_signals(path.name),
                    "visualMetrics": metrics,
                    "featureVector": vector,
                    "scanOrdinal": ordinal,
                }
            )
        except Exception as error:
            corrupt.append({"relativePath": relative, "errorType": type(error).__name__, "message": str(error)[:300]})

    by_sha: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        by_sha[record["sha256"]].append(record)
    exact_duplicates = [
        {
            "sha256": digest,
            "referenceId": items[0]["referenceId"],
            "fileIds": [item["fileId"] for item in items],
            "sourceRelativePaths": [item["sourceRelativePath"] for item in items],
        }
        for digest, items in by_sha.items()
        if len(items) > 1
    ]
    unique_records = [items[0] for _, items in sorted(by_sha.items())]
    primary_records = [record for record in unique_records if record["sourceStratum"] == "primary-top-level"]
    near_duplicates, comparison_count = near_duplicate_groups(unique_records)
    primary_near_duplicates, primary_comparison_count = near_duplicate_groups(primary_records)
    primary_exact_duplicates = [
        group
        for group in exact_duplicates
        if all(not relative_path.startswith("_to_delete/") for relative_path in group["sourceRelativePaths"])
    ]
    vectors = np.asarray([record["featureVector"] for record in primary_records], dtype=np.float64)
    cluster_count = min(max(2, arguments.clusters), len(primary_records))
    labels, distances, _ = deterministic_kmeans(vectors, cluster_count)
    cluster_records: list[dict[str, Any]] = []
    representative_records: list[dict[str, Any]] = []
    for cluster_index in range(cluster_count):
        member_indexes = np.where(labels == cluster_index)[0].tolist()
        ranked_indexes = sorted(
            member_indexes,
            key=lambda index: (
                float(distances[index]) - min(primary_records[index]["megapixels"], 8) * 0.015,
                primary_records[index]["referenceId"],
            ),
        )
        selected_indexes = ranked_indexes[: arguments.representatives]
        selected = [primary_records[index] for index in selected_indexes]
        representative_records.extend(selected[:1])
        members = [primary_records[index] for index in member_indexes]
        aspect_counts = Counter(member["aspectFamily"] for member in members)
        signal_counts = Counter(signal for member in members for signal in member["filenameSignals"])
        mean_metrics = {
            key: round(float(np.mean([member["visualMetrics"][key] for member in members])), 4)
            for key in ("meanLuminance", "luminanceContrast", "meanSaturation", "edgeDensity", "approximateWhitespace")
        }
        palette_counter: Counter[str] = Counter()
        for member in members:
            for color in member["visualMetrics"]["dominantPalette"][:3]:
                palette_counter[color["hex"]] += max(1, round(color["share"] * 100))
        cluster_id = f"cluster_{cluster_index + 1:02d}"
        for index in member_indexes:
            primary_records[index]["clusterId"] = cluster_id
            primary_records[index]["distanceToClusterCenter"] = round(float(distances[index]), 6)
        contact_sheet = f"contact-sheets/{cluster_id}.jpg"
        create_contact_sheet(selected, output / contact_sheet, f"{cluster_id} · computational representatives")
        cluster_records.append(
            {
                "clusterId": cluster_id,
                "method": "standardized visual-statistics k-means; requires art-director interpretation",
                "memberCount": len(members),
                "meanMetrics": mean_metrics,
                "aspectFamilies": dict(aspect_counts.most_common()),
                "filenameSignals": dict(signal_counts.most_common(8)),
                "approximatePaletteSignals": [color for color, _ in palette_counter.most_common(8)],
                "representativeReferenceIds": [record["referenceId"] for record in selected],
                "contactSheet": contact_sheet,
                "humanLabel": None,
                "humanInterpretationStatus": "pending-multimodal-review",
            }
        )

    create_contact_sheet(
        representative_records,
        output / "contact-sheets" / "00-cluster-overview.jpg",
        "Corpus overview · one computational representative per cluster",
        columns=5,
        rows=math.ceil(cluster_count / 5),
    )

    format_counts = Counter(record["format"] for record in records)
    aspect_counts = Counter(record["aspectFamily"] for record in records)
    bytes_values = [record["bytes"] for record in records]
    megapixel_values = [record["megapixels"] for record in records]
    generated_at = datetime.now(timezone.utc).isoformat()
    manifest = {
        "schemaVersion": "1.0.0",
        "generatedAt": generated_at,
        "source": {
            "root": str(source),
            "mode": "read-only-reference-material",
            "filesWereCopied": False,
            "warning": "Reference files are copyrighted research material. Use extracted principles, never compositions or graphics.",
        },
        "method": {
            "deterministic": True,
            "imageDecoder": f"Pillow {Image.__version__}",
            "features": [
                "dimensions/aspect/format/bytes",
                "SHA-256 exact duplicate detection",
                "64-bit difference-hash near-duplicate detection",
                "dominant palette",
                "luminance/saturation/contrast",
                "edge-density visual complexity",
                "border-relative approximate whitespace",
                "4x4 luminance and edge composition map",
                "visual center of mass",
            ],
            "limitations": [
                "Computational clusters are similarity neighborhoods, not finished design-taxonomy labels.",
                "Whitespace, text/image balance, and visual density are heuristics and require pixel review.",
                "Perceptual hashing can group legitimately distinct minimal compositions; groups require review.",
                "Professional merit is never inferred from file inclusion or proximity to a centroid.",
            ],
        },
        "counts": {
            "filesystemFiles": len(all_files),
            "decodedImages": len(records),
            "uniqueImageContents": len(unique_records),
            "primaryTopLevelImages": sum(record["sourceStratum"] == "primary-top-level" for record in records),
            "quarantinedDerivedImages": sum(record["sourceStratum"] == "quarantined-derived" for record in records),
            "corruptOrUndecodable": len(corrupt),
            "ignoredNonImages": len(ignored),
            "exactDuplicateGroups": len(exact_duplicates),
            "exactDuplicateExtraFiles": sum(len(group["fileIds"]) - 1 for group in exact_duplicates),
            "primaryExactDuplicateGroups": len(primary_exact_duplicates),
            "primaryNearDuplicateCandidateGroups": len(primary_near_duplicates),
            "allLooseFileNearDuplicateCandidateGroups": len(near_duplicates),
        },
        "distribution": {
            "formats": dict(format_counts.most_common()),
            "aspectFamilies": dict(aspect_counts.most_common()),
            "bytes": {
                "minimum": min(bytes_values) if bytes_values else 0,
                "median": round(percentile(bytes_values, 0.5)),
                "p95": round(percentile(bytes_values, 0.95)),
                "maximum": max(bytes_values) if bytes_values else 0,
            },
            "megapixels": {
                "minimum": round(min(megapixel_values), 4) if megapixel_values else 0,
                "median": round(percentile(megapixel_values, 0.5), 4),
                "p95": round(percentile(megapixel_values, 0.95), 4),
                "maximum": round(max(megapixel_values), 4) if megapixel_values else 0,
            },
        },
        "artifacts": {
            "files": "files.json",
            "clusters": "clusters.json",
            "exactDuplicates": "exact-duplicates.json",
            "nearDuplicates": "near-duplicates.json",
            "corrupt": "corrupt-files.json",
            "overviewContactSheet": "contact-sheets/00-cluster-overview.jpg",
        },
    }
    write_json(output / "manifest.json", manifest)
    write_json(output / "files.json", {"schemaVersion": "1.0.0", "files": records})
    write_json(output / "clusters.json", {"schemaVersion": "1.0.0", "clusters": cluster_records})
    write_json(output / "exact-duplicates.json", {"schemaVersion": "1.0.0", "groups": exact_duplicates})
    write_json(
        output / "near-duplicates.json",
        {
            "schemaVersion": "1.0.0",
            "method": "64-bit dHash candidate generation; not a human-confirmed duplicate decision",
            "hammingThreshold": 6,
            "primary": {"candidateComparisons": primary_comparison_count, "groups": primary_near_duplicates},
            "allLooseFiles": {"candidateComparisons": comparison_count, "groups": near_duplicates},
        },
    )
    write_json(output / "corrupt-files.json", {"schemaVersion": "1.0.0", "files": corrupt, "ignored": ignored})
    print(json.dumps(manifest["counts"], indent=2))


if __name__ == "__main__":
    main()
