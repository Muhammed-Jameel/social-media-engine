"""Build a minimal, deterministic plugin ZIP. Never include the repository wholesale."""
from pathlib import Path
import hashlib
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins/social-media-engine"
ALLOWED_TOP = {".codex-plugin", ".claude-plugin", "skills", "scripts", "assets", "README.md", "LICENSE"}
ALLOWED_SUFFIXES = {".json", ".md", ".py", ".js", ".css", ".html", ".png", ".svg"}
FORBIDDEN = [b"/Users/", b"Content OS", b"/home/ubuntu", b"POSTIZ_API_KEY=sk-"]


def source_files():
    files = []
    for path in sorted(PLUGIN.rglob("*")):
        rel = path.relative_to(PLUGIN)
        if "__pycache__" in rel.parts or path.suffix in {".pyc", ".pyo"}:
            continue
        if path.is_symlink():
            raise ValueError("Release input must not contain symlinks: " + str(rel))
        if path.is_dir():
            continue
        if rel.parts[0] not in ALLOWED_TOP or (path.suffix not in ALLOWED_SUFFIXES and path.name != "LICENSE"):
            raise ValueError("Unexpected release input: " + str(rel))
        data = path.read_bytes()
        if any(marker in data for marker in FORBIDDEN):
            raise ValueError("Private path or legacy product name in: " + str(rel))
        if len(data) > 5 * 1024 * 1024:
            raise ValueError("Unexpected large runtime file: " + str(rel))
        files.append((rel.as_posix(), data))
    return files


def build():
    codex = json.loads((PLUGIN / ".codex-plugin/plugin.json").read_text())
    claude = json.loads((PLUGIN / ".claude-plugin/plugin.json").read_text())
    version = codex["version"]
    if codex["name"] != PLUGIN.name or claude["name"] != PLUGIN.name or claude["version"] != version:
        raise ValueError("Plugin manifests disagree")
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("Invalid version")
    files = source_files()
    names = {name for name, _ in files}
    required = {".codex-plugin/plugin.json", ".claude-plugin/plugin.json",
                "skills/social-media-engine/SKILL.md", "scripts/sme.py",
                "scripts/engine.py", "scripts/providers.py", "scripts/dashboard.py",
                "assets/dashboard.html", "assets/dashboard.js", "assets/dashboard.css", "LICENSE"}
    if not required <= names:
        raise ValueError("Missing required plugin files: " + str(required - names))
    target = ROOT / "dist"
    target.mkdir(exist_ok=True)
    archive = target / ("social-media-engine-" + version + ".zip")
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, data in files:
            info = zipfile.ZipInfo(name, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, data)
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    (target / "SHA256SUMS").write_text(checksum + "  " + archive.name + "\n")
    print(json.dumps({"archive": str(archive), "bytes": archive.stat().st_size,
                      "files": len(files), "sha256": checksum}, indent=2))
    return archive


if __name__ == "__main__":
    build()
