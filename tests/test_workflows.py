"""Additional content, media, plan, rule and metric safety regressions."""
import copy
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

from test_engine import RuntimeHarness, PROFILE
from engine import Workspace, EngineError, digest
from test_providers import PNG


class WorkflowTests(RuntimeHarness):
    def setUp(self):
        super().setUp()
        self.ready()

    def image(self, name="sample.png"):
        path = self.workspace / name
        path.write_bytes(PNG)
        return self.call("asset-import", "--file", path, "--role", "output",
                         "--rights", "owned", "--note", "Synthetic test fixture", "--actor", "Test Owner")

    def visual_review(self, item, assets, role="visual", **overrides):
        value = {"role": role, "reviewer": "independent-fixture-critic", "item_hash": item["hash"],
                 "decision": "pass", "observations": ["Synthetic test evidence, not a real creative review"],
                 "hard_fails": [], "scores": {k: 19 for k in ["concept", "composition", "typography",
                    "craft", "brand", "communication", "polish", "distinctiveness"]},
                 "actual_pixels_inspected": True, "scales": ["original", "mobile"],
                 "asset_hashes": {a["id"]: a["sha256"] for a in assets},
                 "checks": {"readability": True, "dimensions": True, "no_overflow": True,
                            "rights": True, "originality": True, "sequence": True}}
        value.update(overrides)
        return value

    def test_visual_review_requires_all_asset_hashes_and_mobile_inspection(self):
        asset = self.image()
        item = self.call("item-save", body=self.draft(format="image", asset_ids=[asset["id"]]))
        self.review(item, "editorial")
        self.review(item, "brand")
        self.call("review-add", "--id", item["id"],
                  body=self.visual_review(item, [asset], scales=["original"]), ok=False)
        self.call("review-add", "--id", item["id"],
                  body=self.visual_review(item, [asset], asset_hashes={}), ok=False)
        self.call("review-add", "--id", item["id"], body=self.visual_review(item, [asset]))
        approved = self.call("item-approve", "--id", item["id"], "--hash", item["hash"], "--actor", "Test Owner")
        exported = self.call("export", "--id", item["id"])
        self.assertEqual(approved["status"], "APPROVED")
        self.assertEqual((Path(exported["directory"]) / (asset["id"] + ".png")).read_bytes(), PNG)

    def test_carousel_requires_two_distinct_assets_and_alt_text(self):
        asset = self.image()
        item = self.call("item-save", body=self.draft(format="carousel", asset_ids=[asset["id"]]))
        self.review(item, "editorial")
        self.review(item, "brand")
        self.call("review-add", "--id", item["id"], body=self.visual_review(item, [asset]))
        self.call("item-approve", "--id", item["id"], "--hash", item["hash"], "--actor", "Test Owner", ok=False)

    def test_arabic_media_requires_arabic_typography_review(self):
        asset = self.image()
        draft = self.draft(format="image", asset_ids=[asset["id"]])
        draft["variants"][0]["language"] = "ar"
        draft["variants"][0]["caption"] = "غيّر عاملًا واحدًا في كل تجربة تحضير."
        file = self.workspace / "arabic-context.json"
        file.write_text(json.dumps(draft))
        context = self.call("context", "--item-file", file)
        draft["context_hash"] = context["context_hash"]
        item = self.call("item-save", body=draft)
        self.review(item, "editorial")
        self.review(item, "brand")
        self.call("review-add", "--id", item["id"], body=self.visual_review(item, [asset]))
        self.call("item-approve", "--id", item["id"], "--hash", item["hash"], "--actor", "Test Owner", ok=False)
        review = self.visual_review(item, [asset], role="arabic")
        self.call("review-add", "--id", item["id"], body=review, ok=False)
        review["checks"].update(shaping=True, rtl=True, line_breaks=True)
        self.call("review-add", "--id", item["id"], body=review)
        self.call("item-approve", "--id", item["id"], "--hash", item["hash"], "--actor", "Test Owner")

    def test_deterministic_scoped_feedback_is_actually_enforced(self):
        self.call("feedback", body={"id": "short-fb", "instruction": "Keep this short and mention brew.",
                  "actor": "Test Owner", "category": "mandatory", "scope": {"platform": "facebook"},
                  "constraints": {"max_caption_chars": 60, "required_terms": ["brew"], "forbidden_terms": ["perfect"]}})
        self.call("rule-approve", "--id", "short-fb", "--actor", "Test Owner")
        self.call("item-save", body=self.draft(caption="Here is a very long brew caption. " * 5), ok=False)
        self.call("item-save", body=self.draft(caption="A perfect brew."), ok=False)
        self.call("item-save", body=self.draft(caption="Change one thing."), ok=False)
        self.call("item-save", body=self.draft(caption="Change one brew variable."))

    def test_prohibited_terms_normalize_case_and_fullwidth_letters(self):
        self.call("item-save", body=self.draft(caption="A MIRACLE."), ok=False)
        self.call("item-save", body=self.draft(caption="A ｍｉｒａｃｌｅ."), ok=False)
        self.call("item-save", body=self.draft(caption="A mira\u200bcle."), ok=False)

    def test_metric_snapshots_require_provenance_and_mark_synthetic(self):
        self.call("item-save", body=self.draft())
        value = {"id": "metrics-one", "item_id": "coffee-tip", "source": "Synthetic unit fixture",
                 "platform": "facebook", "provider_post_id": "test-post", "captured_at": "2026-09-13T12:00:00Z",
                 "synthetic": True, "metrics": {"views": 100, "saves": None},
                 "definitions": {"views": "Synthetic views, not business evidence", "saves": "Unavailable"},
                 "raw_evidence": "test_workflows.py"}
        saved = self.call("metrics-import", body=value)
        self.assertTrue(saved["synthetic"])
        self.assertIsNone(saved["metrics"]["saves"])
        self.call("metrics-import", body=value, ok=False)
        value["id"] = "metrics-two"
        value["metrics"]["views"] = -2
        self.call("metrics-import", body=value, ok=False)
        value["metrics"]["views"] = 20
        del value["synthetic"]
        self.call("metrics-import", body=value, ok=False)

    def test_plan_dates_use_the_brand_timezone_and_plan_ids_are_immutable(self):
        context = self.call("context")
        plan = {"id": "october-plan", "month": "2026-10", "brand_hash": context["brand_hash"],
                "strategy": "Useful educational posts ahead of the workshop.",
                "items": [{"id": "coffee-tip", "title": "One variable", "objective": "Practical learning",
                    "audience": "Home brewers", "message": "Change one thing", "pillar": "Education",
                    "format": "text", "language": "en", "platforms": ["facebook"],
                    "cta": "Try it next brew", "scheduled_at": "2026-09-30T23:30:00Z"}]}
        self.call("plan-import", "--actor", "Test Owner", body=plan)
        self.call("plan-import", "--actor", "Test Owner", body=plan, ok=False)
        plan["id"] = "invalid-plan"
        plan["items"][0]["scheduled_at"] = "2026-09-30T10:00:00Z"
        self.call("plan-import", "--actor", "Test Owner", body=plan, ok=False)

    def test_revision_history_does_not_collide_on_long_ids(self):
        first = "a" * 50 + "-one"
        second = "a" * 50 + "-two"
        for key in [first, second]:
            self.call("item-save", body=self.draft(key))
            self.call("item-save", body=self.draft(key, caption="Revise one brew variable."))
        revisions = self.call("snapshot")["revisions"]
        self.assertEqual({r["id"] for r in revisions}, {first, second})

    def test_media_cannot_hide_inside_text_variants(self):
        asset = self.image()
        self.call("item-save", body=self.draft(format="text", asset_ids=[asset["id"]]), ok=False)

    def test_state_symlink_cannot_escape_workspace(self):
        outside = self.workspace / "outside"
        outside.mkdir()
        ws = Workspace(str(self.workspace))
        try:
            (ws.root / "escape").symlink_to(outside, target_is_directory=True)
            with self.assertRaises(EngineError):
                ws.safe_path("escape/stolen.txt")
        finally:
            ws.close()

    def test_owner_change_request_immediately_blocks_export(self):
        self.approve_text()
        self.call("feedback", body={"id": "owner-revision", "instruction": "Please shorten this caption.",
                  "actor": "Test Owner", "category": "preference", "scope": {"item": "coffee-tip"},
                  "rating": 3, "disposition": "change-request"})
        self.assertEqual(self.call("snapshot")["items"][0]["status"], "CHANGES_REQUESTED")
        self.call("export", "--id", "coffee-tip", ok=False)

    def test_invalid_binary_header_is_not_a_finished_asset(self):
        path = self.workspace / "fake.png"
        path.write_text("This is not a PNG")
        self.call("asset-import", "--file", path, "--role", "output", "--rights", "owned",
                  "--note", "Invalid test fixture", "--actor", "Test Owner", ok=False)

    def test_tampered_brand_guidelines_block_context(self):
        path = self.workspace / "guidelines.txt"
        path.write_text("Owner-approved test guidelines")
        asset = self.call("asset-import", "--file", path, "--role", "guideline", "--rights", "owned",
                         "--note", "Fixture guidelines", "--actor", "Test Owner")
        self.ready()
        stored = self.workspace / ".social-media-engine" / asset["path"]
        stored.write_text("Unreviewed tampering")
        self.call("context", ok=False)

    def test_stale_approval_is_visible_in_dashboard_snapshot(self):
        self.approve_text()
        self.call("brand-update", "--actor", "Test Owner", body={"voice": "New deliberate direction"})
        item = self.call("snapshot")["items"][0]
        self.assertEqual(item["effective_status"], "STALE")
        self.assertIn("blocked_reason", item)

    def test_malformed_item_context_returns_actionable_json_error(self):
        path = self.workspace / "invalid-context.json"
        path.write_text('{"id":"coffee-tip","variants":["not-an-object"]}')
        result = self.call("context", "--item-file", path, ok=False)
        self.assertIn("variants", result["error"])
