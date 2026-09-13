"""Validate native packaging, portability and the exact release ZIP."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import os
import subprocess
import sys
import tempfile
import unittest
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PLUGIN = ROOT / "plugins/social-media-engine"


class ReleaseTests(unittest.TestCase):
    def test_extracted_plugin_runs_outside_repository_with_space_in_path(self):
        spec = importlib.util.spec_from_file_location("build_release", ROOT / "scripts/build_release.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        archive = module.build()
        (ROOT / ".data/tests").mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="install with spaces ", dir=ROOT / ".data/tests") as folder:
            base = Path(folder)
            install = base / "plugin cache" / "social-media-engine"
            work = base / "private working folder"
            work.mkdir()
            with zipfile.ZipFile(archive) as bundle:
                bundle.extractall(install)
            env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
            run = subprocess.run([sys.executable, str(install / "scripts/sme.py"), "--workspace", str(work),
                                  "--brand", "new-brand", "status"], capture_output=True, text=True, env=env, timeout=10)
            self.assertEqual(run.returncode, 0, run.stderr)
            self.assertEqual(json.loads(run.stdout)["state"], "ONBOARDING_REQUIRED")
            self.assertTrue((work / ".social-media-engine/state.sqlite3").is_file())
            self.assertFalse((install / ".social-media-engine").exists())

    def test_native_manifests_and_marketplaces_agree(self):
        codex = json.loads((PLUGIN / ".codex-plugin/plugin.json").read_text())
        claude = json.loads((PLUGIN / ".claude-plugin/plugin.json").read_text())
        self.assertEqual(codex["name"], PLUGIN.name)
        self.assertEqual(claude["name"], PLUGIN.name)
        self.assertEqual(codex["version"], claude["version"])
        cm = json.loads((ROOT / ".agents/plugins/marketplace.json").read_text())
        am = json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
        self.assertEqual((ROOT / cm["plugins"][0]["source"]["path"]).resolve(), PLUGIN)
        self.assertEqual((ROOT / am["plugins"][0]["source"]).resolve(), PLUGIN)
        self.assertEqual(cm["plugins"][0]["policy"]["installation"], "AVAILABLE")
        self.assertTrue((PLUGIN / codex["skills"]).is_dir())

    def test_skill_is_self_contained_and_links_resolve(self):
        for file in (PLUGIN / "skills").rglob("*.md"):
            source = file.read_text()
            self.assertNotIn("/Users/", source)
            self.assertNotIn("Content OS", source)
            for link in re.findall(r"\]\(([^)]+)\)", source):
                if "://" not in link and not link.startswith("#"):
                    target = (file.parent / link.split("#")[0]).resolve()
                    self.assertTrue(target.is_file(), (file, link))
                    self.assertIn(PLUGIN, target.parents)

    def test_build_is_small_deterministic_and_contains_no_private_data(self):
        spec = importlib.util.spec_from_file_location("build_release", ROOT / "scripts/build_release.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        first = module.build()
        first_hash = hashlib.sha256(first.read_bytes()).hexdigest()
        second = module.build()
        self.assertEqual(first_hash, hashlib.sha256(second.read_bytes()).hexdigest())
        self.assertLess(first.stat().st_size, 1_000_000)
        with zipfile.ZipFile(first) as archive:
            self.assertIsNone(archive.testzip())
            names = archive.namelist()
            self.assertIn(".claude-plugin/plugin.json", names)
            self.assertIn(".codex-plugin/plugin.json", names)
            for name in names:
                self.assertFalse(name.startswith("/"))
                self.assertNotIn("..", Path(name).parts)
                self.assertFalse(any(part in name for part in [
                    ".data/", ".git/", "node_modules/", ".env", "__pycache__", "state.sqlite3"]))
