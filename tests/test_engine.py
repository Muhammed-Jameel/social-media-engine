"""Public runtime regression tests. All writes stay in ignored local test workspaces."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "plugins/social-media-engine/scripts"
sys.path.insert(0, str(SCRIPTS))
from engine import Workspace, EngineError
from providers import Postiz, api_url

PROFILE = {
    "name": "Northstar Coffee",
    "description": "An independent coffee roaster helping home brewers make better daily coffee.",
    "industry": "Specialty coffee",
    "website": "https://example.com",
    "offers": ["Fresh roasted coffee", "Practical brewing workshops"],
    "competitors": ["Other local specialty roasters"],
    "audiences": ["Time-poor home brewers who want reliable technique"],
    "markets": ["United Kingdom"],
    "languages": ["en", "ar"],
    "voice": "Warm and specific. English conversational; Arabic clear modern standard, not slang.",
    "preferred_terms": ["brew"],
    "forbidden_words": ["miracle", "guaranteed cure"],
    "claims_policy": "No invented health claims or measured results. Cite factual comparisons.",
    "colors": ["#173C34", "#F6EEDF"],
    "fonts": ["Use owner-licensed fonts with Arabic coverage"],
    "logo_policy": "No supplied logo; typeset name without an invented mark.",
    "visual_style": "Editorial photography, deliberate whitespace, tactile paper.",
    "imagery_style": "Real coffee and practical equipment; no stock corporate characters.",
    "motion_style": "Calm instructional motion, readable captions.",
    "references": ["Owner-approved editorial examples"],
    "avoid": ["Unrelated neon gradients"],
    "asset_notes": "Only original test fixtures, no customer assets.",
    "goals": ["Workshop inquiries", "Build practical brewing trust"],
    "platforms": ["instagram", "facebook", "tiktok"],
    "cadence": "Three purposeful posts per week",
    "timezone": "Europe/London",
    "approval_owner": "Test Owner",
}


class RuntimeHarness(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        (ROOT / ".data/tests").mkdir(parents=True, exist_ok=True)

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="runtime-", dir=ROOT / ".data/tests")
        self.workspace = Path(self.tmp.name)
        self.sequence = 0

    def tearDown(self):
        self.tmp.cleanup()

    def call(self, command, *args, brand="northstar", body=None, ok=True, env=None):
        argv = [sys.executable, str(SCRIPTS / "sme.py"), "--workspace",
                str(self.workspace), "--brand", brand, command, *map(str, args)]
        if body is not None:
            self.sequence += 1
            filename = self.workspace / ("input-%s.json" % self.sequence)
            filename.write_text(json.dumps(body, ensure_ascii=False), encoding="utf-8")
            argv += ["--file", str(filename)]
        clean = {k: v for k, v in os.environ.items()
                 if k not in ("POSTIZ_API_KEY", "POSTIZ_API_URL", "SOCIAL_ENGINE_ALLOW_PUBLISH")}
        if env:
            clean.update(env)
        result = subprocess.run(argv, text=True, capture_output=True, env=clean, timeout=10)
        output = result.stdout.strip() or result.stderr.strip()
        try:
            value = json.loads(output)
        except ValueError:
            self.fail("CLI did not return JSON: %s" % output)
        if ok:
            self.assertEqual(result.returncode, 0, value)
        else:
            self.assertNotEqual(result.returncode, 0, value)
        return value

    def ready(self, brand="northstar", profile=None):
        self.call("brand-update", "--actor", "Test Owner", body=profile or PROFILE, brand=brand)
        status = self.call("status", brand=brand)
        self.call("brand-approve", "--hash", status["profile"]["hash"], "--actor", "Test Owner", brand=brand)
        return self.call("context", brand=brand)

    def draft(self, key="coffee-tip", brand="northstar", caption="Change one brew variable at a time.",
              format="text", asset_ids=None):
        base = {
            "id": key,
            "title": "A calmer daily brew",
            "producer": "test-producer",
            "variants": [{
                "platform": "facebook", "language": "en", "caption": caption, "format": format,
                "asset_ids": asset_ids or [], "alt_text": ["Test visual"] * len(asset_ids or []),
                "adaptation": "Community-oriented practical advice, not duplicated platform copy."
            }],
            "evidence": [],
            "claims": [],
            "creative": {"idea": "Make one useful brewing adjustment, without fake metrics."},
        }
        self.sequence += 1
        file = self.workspace / ("context-%s.json" % self.sequence)
        file.write_text(json.dumps(base), encoding="utf-8")
        context = self.call("context", "--item-file", file, brand=brand)
        base.update(brand_hash=context["brand_hash"], context_hash=context["context_hash"])
        return base

    def review(self, item, role, brand="northstar", decision="pass", reviewer="test-critic"):
        spec = {
            "role": role, "reviewer": reviewer, "item_hash": item["hash"], "decision": decision,
            "observations": ["Specific synthetic test review; not a genuine creative assessment."],
            "hard_fails": [], "scores": {k: 19 for k in [
                "concept", "composition", "typography", "craft", "brand",
                "communication", "polish", "distinctiveness"]},
            "checks": {"readability": True, "dimensions": True, "no_overflow": True,
                       "rights": True, "originality": True, "sequence": True},
        }
        return self.call("review-add", "--id", item["id"], body=spec, brand=brand)

    def approve_text(self, key="coffee-tip"):
        item = self.call("item-save", body=self.draft(key))
        self.review(item, "editorial")
        self.review(item, "brand")
        return self.call("item-approve", "--id", key, "--hash", item["hash"], "--actor", "Test Owner")

class RuntimeTests(RuntimeHarness):
    def test_first_run_blocks_generation_and_resumes(self):
        initial = self.call("status")
        self.assertEqual(initial["state"], "ONBOARDING_REQUIRED")
        self.call("context", ok=False)
        self.call("brand-update", "--actor", "Test Owner", body={"name": PROFILE["name"]})
        resumed = self.call("status")
        self.assertNotIn("name", resumed["missing"])
        self.assertIn("voice", resumed["missing"])
        self.ready()
        self.assertEqual(self.call("status")["state"], "READY")

    def test_two_brands_are_isolated_and_require_explicit_identity(self):
        self.ready()
        other = copy.deepcopy(PROFILE)
        other.update(name="Kiteworks Studio", voice="Crisp and restrained", colors=["#102030"])
        self.ready("kiteworks", other)
        self.assertNotEqual(self.call("context")["profile"]["name"],
                            self.call("context", brand="kiteworks")["profile"]["name"])
        self.call("status", brand="../escape", ok=False)
        self.assertEqual(self.call("snapshot", brand="kiteworks")["items"], [])

    def test_owner_and_current_brand_hash_are_required(self):
        self.call("brand-update", "--actor", "Test Owner", body=PROFILE)
        status = self.call("status")
        self.call("brand-approve", "--hash", "stale", "--actor", "Test Owner", ok=False)
        self.call("brand-approve", "--hash", status["profile"]["hash"], "--actor", "Test Owner")
        self.call("brand-update", "--actor", "Test Owner", body={"voice": "More concise"})
        self.call("context", ok=False)

    def test_content_review_approval_export_and_edit_invalidation(self):
        self.ready()
        item = self.call("item-save", body=self.draft())
        self.call("item-approve", "--id", item["id"], "--hash", item["hash"],
                  "--actor", "Test Owner", ok=False)
        self.review(item, "editorial")
        self.review(item, "brand")
        approved = self.call("item-approve", "--id", item["id"], "--hash", item["hash"],
                             "--actor", "Test Owner")
        self.assertEqual(approved["status"], "APPROVED")
        export = self.call("export", "--id", item["id"])
        self.assertEqual(json.loads((Path(export["directory"]) / "content.json").read_text())["publication_status"], "NOT_PUBLISHED")
        revised = self.call("item-save", body=self.draft(caption="Try adjusting grind size first."))
        self.assertNotEqual(revised["hash"], item["hash"])
        self.assertEqual(revised["status"], "DRAFT")
        self.call("export", "--id", item["id"], ok=False)

    def test_self_review_and_low_scores_cannot_pass(self):
        self.ready()
        item = self.call("item-save", body=self.draft())
        spec = {"role": "editorial", "reviewer": "test-producer", "item_hash": item["hash"],
                "decision": "pass", "observations": ["Test"], "hard_fails": [],
                "scores": {k: 20 for k in ["concept", "composition", "typography", "craft",
                                          "brand", "communication", "polish", "distinctiveness"]}}
        self.call("review-add", "--id", item["id"], body=spec, ok=False)
        spec["reviewer"] = "actual-other-reviewer"
        spec["scores"]["brand"] = 0
        self.call("review-add", "--id", item["id"], body=spec, ok=False)

    def test_scoped_rules_persist_do_not_leak_and_stale_approvals(self):
        self.ready()
        item = self.approve_text()
        before = self.call("context", "--item", item["id"], "--platform", "facebook", "--language", "en")
        self.call("feedback", body={"id": "short-captions", "instruction": "Prefer concise captions.",
                  "actor": "Test Owner", "category": "preference", "scope": {"platform": "facebook"}})
        self.assertEqual(self.call("context")["rules"], [])
        self.call("rule-approve", "--id", "short-captions", "--actor", "Test Owner")
        context = self.call("context", "--item", item["id"], "--platform", "facebook", "--language", "en")
        self.assertNotEqual(before["context_hash"], context["context_hash"])
        self.assertEqual(len(context["rules"]), 1)
        self.assertEqual(self.call("context", "--platform", "instagram")["rules"], [])
        self.call("export", "--id", item["id"], ok=False)
        self.call("rule-retire", "--id", "short-captions", "--actor", "Test Owner")
        self.assertEqual(self.call("context", "--platform", "facebook")["rules"], [])

    def test_assets_enforce_rights_integrity_and_review_reset(self):
        self.ready()
        file = self.workspace / "original.txt"
        file.write_text("Original fixture", encoding="utf-8")
        ref = self.call("asset-import", "--file", file, "--role", "reference",
                        "--rights", "reference-only", "--note", "Source not for publication", "--actor", "Test Owner")
        self.call("context", ok=False)
        self.ready()
        self.call("item-save", body=self.draft(format="image", asset_ids=[ref["id"]]), ok=False)

    def test_output_import_does_not_invalidate_brand(self):
        self.ready()
        before = self.call("context")
        file = self.workspace / "output.svg"
        file.write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#173c34"/></svg>')
        output = self.call("asset-import", "--file", file, "--role", "output", "--rights", "owned",
                           "--note", "Synthetic original test graphic", "--actor", "Test Owner")
        self.assertEqual(before["brand_hash"], self.call("context")["brand_hash"])
        self.assertEqual(self.call("status")["state"], "READY")
        ws = Workspace(str(self.workspace))
        try:
            ws.safe_path(output["path"]).write_text("tampered")
            with self.assertRaises(EngineError):
                ws.asset_bytes("northstar", output["id"])
        finally:
            ws.close()

    def test_secret_inputs_and_symlink_assets_are_rejected(self):
        self.call("brand-update", "--actor", "Test Owner",
                  body={"name": "sk-" + "A" * 45}, ok=False)
        self.ready()
        source = self.workspace / ".env"
        source.write_text("NOT_A_REAL_SECRET=fixture")
        self.call("asset-import", "--file", source, "--role", "guideline", "--rights", "owned",
                  "--note", "Not allowed", "--actor", "Test Owner", ok=False)
        target = self.workspace / "allowed.txt"
        target.write_text("safe fixture")
        link = self.workspace / "link.txt"
        link.symlink_to(target)
        self.call("asset-import", "--file", link, "--role", "guideline", "--rights", "owned",
                  "--note", "Not allowed", "--actor", "Test Owner", ok=False)

    def test_publish_requires_two_explicit_gates(self):
        self.ready()
        self.call("dispatch-send", "--id", "no-dispatch", "--hash", "unknown",
                  "--actor", "Test Owner", ok=False)
        self.call("accounts", ok=False)

    def test_unapproved_claim_and_unknown_platform_are_rejected(self):
        self.ready()
        item = self.draft()
        item["claims"] = [{"text": "Coffee cures illness", "source": "https://example.com",
                           "verified": False}]
        self.call("item-save", body=item, ok=False)
        item = self.draft()
        item["variants"][0]["platform"] = "unconfigured"
        self.call("item-save", body=item, ok=False)

    def test_forbidden_brand_terms_are_enforced(self):
        self.ready()
        self.call("item-save", body=self.draft(caption="A miracle for your daily routine."), ok=False)

    def test_invalid_timezone_and_malformed_json_fail_cleanly(self):
        self.call("brand-update", "--actor", "Test Owner", body={"timezone": "MadeUp/Zone"}, ok=False)
        file = self.workspace / "bad.json"
        file.write_text('{"name": NaN}')
        self.call("brand-update", "--file", file, "--actor", "Test Owner", ok=False)


class ProviderConfigTests(unittest.TestCase):
    def test_https_and_credential_free_urls(self):
        self.assertEqual(api_url("https://example.com"), "https://example.com/public/v1")
        self.assertEqual(api_url("http://127.0.0.1:8000"), "http://127.0.0.1:8000/public/v1")
        for url in ["http://example.com", "https://user:password@example.com", "https://example.com?key=secret",
                    "file:///etc/passwd", "https://example.com/#token"]:
            with self.assertRaises(EngineError):
                api_url(url)


if __name__ == "__main__":
    unittest.main()
