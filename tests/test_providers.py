"""Real HTTP contract tests against an isolated, in-process fake Postiz."""
import base64
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import socket
import threading
import unittest
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from test_engine import RuntimeHarness, SCRIPTS, PROFILE
from engine import Workspace, EngineError
from providers import Postiz, prepare, send, cancel_local, reconcile

PNG = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=")


class ProviderTests(RuntimeHarness):
    def setUp(self):
        super().setUp()
        self.remote_calls = []
        self.mode = "success"
        self.account_id = "fixture-facebook-account"
        owner = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def reply(self, data, code=200):
                raw = json.dumps(data).encode()
                self.send_response(code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)

            def do_GET(self):
                owner.remote_calls.append(("GET", self.path, self.headers.get("Authorization")))
                if self.headers.get("Authorization") != "test-only-key":
                    return self.reply({"error": "denied"}, 401)
                if owner.mode == "redirect":
                    self.send_response(302)
                    self.send_header("Location", "/must-not-receive-credentials")
                    self.end_headers()
                    return
                if self.path == "/public/v1/integrations":
                    self.reply([{"id": owner.account_id, "name": "Fixture Brand",
                                 "identifier": "facebook", "disabled": owner.mode == "disabled",
                                 "profile": "https://example.com/fixture"}])
                elif self.path.startswith("/public/v1/posts?"):
                    self.reply({"posts": [{"id": "fixture-post-1", "state": "QUEUE"}]})
                else:
                    self.reply({"error": "unknown"}, 404)

            def do_POST(self):
                raw = self.rfile.read(int(self.headers.get("Content-Length", "0")))
                owner.remote_calls.append(("POST", self.path, raw))
                if self.headers.get("Authorization") != "test-only-key":
                    return self.reply({"error": "denied"}, 401)
                if self.path == "/public/v1/upload":
                    self.reply({"id": "uploaded-fixture", "path": "https://example.com/fixture.png"})
                elif self.path == "/public/v1/posts":
                    if owner.mode == "disconnect":
                        self.connection.shutdown(socket.SHUT_RDWR)
                        self.connection.close()
                    elif owner.mode == "partial":
                        self.reply([])
                    else:
                        self.reply([{"postId": "fixture-post-1", "integration": owner.account_id}])
                else:
                    self.reply({"error": "unknown"}, 404)

        self.server = HTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.client = Postiz("http://127.0.0.1:%d" % self.server.server_port, "test-only-key")
        self.ready()
        self.item = self.approve_text()
        self.ws = Workspace(str(self.workspace))

    def tearDown(self):
        self.ws.close()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        super().tearDown()

    def spec(self, key="dispatch-one", item_id="coffee-tip"):
        return {"id": key, "item_id": item_id, "operation": "schedule",
                "date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
                "bindings": [{"platform": "facebook", "language": "en",
                              "account_id": self.account_id,
                              "settings": {"__type": "facebook"},
                              "capability_evidence": "Local fake-provider contract fixture, not real account verification."}]}

    def test_prepare_is_read_only_and_send_is_exactly_once(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        self.assertEqual(record["status"], "PREPARED")
        self.assertFalse(any(c[0] == "POST" for c in self.remote_calls))
        with self.assertRaises(EngineError):
            send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], "wrong-hash", "Test Owner", self.client, True)
            result = send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
            self.assertEqual(result["status"], "ACCEPTED")
            self.assertEqual(result["publication_status"], "UNCONFIRMED")
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        posts = [c for c in self.remote_calls if c[:2] == ("POST", "/public/v1/posts")]
        self.assertEqual(len(posts), 1)
        payload = json.loads(posts[0][2])
        self.assertEqual(payload["posts"][0]["value"][0]["content"], self.item["variants"][0]["caption"])
        self.assertEqual(payload["posts"][0]["integration"]["id"], self.account_id)
        self.assertNotIn("test-only-key", self.ws.db_path.read_bytes().decode(errors="ignore"))

    def test_ambiguous_write_stays_blocked_without_blind_retry(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        self.mode = "disconnect"
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            with self.assertRaises(Exception):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
            self.assertEqual(self.ws.get("dispatch", "northstar", record["id"])["status"], "UNKNOWN")
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        self.assertEqual(len([c for c in self.remote_calls if c[:2] == ("POST", "/public/v1/posts")]), 1)
        with self.assertRaises(EngineError):
            cancel_local(self.ws, "northstar", record["id"], "Test Owner")

    def test_partial_receipt_is_persisted_and_not_marked_published(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        self.mode = "partial"
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        saved = self.ws.get("dispatch", "northstar", record["id"])
        self.assertEqual(saved["status"], "UNKNOWN")
        self.assertEqual(saved["receipt"], [])

    def test_disabled_or_changed_accounts_prevent_posting(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        self.mode = "disabled"
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        self.assertEqual(self.ws.get("dispatch", "northstar", record["id"])["status"], "BLOCKED_BEFORE_POST")
        self.assertFalse(any(c[0] == "POST" for c in self.remote_calls))

    def test_cancelled_local_intent_allows_revision(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        self.call("item-save", body=self.draft(caption="Change just your grind size."), ok=False)
        cancel_local(self.ws, "northstar", record["id"], "Test Owner")
        revised = self.call("item-save", body=self.draft(caption="Change just your grind size."))
        self.assertEqual(revised["revision"], 2)

    def test_provider_identity_cannot_change_after_confirmation(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        changed = Postiz(self.client.base, "different-test-key")
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            with self.assertRaises(EngineError):
                send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", changed, True)
        self.assertFalse(any(c[0] == "POST" for c in self.remote_calls))

    def test_redirects_never_forward_credentials(self):
        self.mode = "redirect"
        before = len(self.remote_calls)
        with self.assertRaises(EngineError):
            self.client.accounts()
        self.assertEqual(len(self.remote_calls), before + 1)
        self.assertFalse(any("must-not-receive" in c[1] for c in self.remote_calls))

    def test_upload_is_real_multipart_and_schedule_requires_future(self):
        value = self.client.upload({"id": "fixture-asset", "path": "assets/test.png"}, PNG)
        self.assertEqual(value["id"], "uploaded-fixture")
        posted = [c for c in self.remote_calls if c[:2] == ("POST", "/public/v1/upload")][0][2]
        self.assertIn(PNG, posted)
        self.assertIn(b'name="file"', posted)
        invalid = self.spec()
        invalid["date"] = "2000-01-01T00:00:00Z"
        with self.assertRaises(EngineError):
            prepare(self.ws, "northstar", invalid, self.client)

    def test_reconciliation_requires_actual_post_evidence(self):
        record = prepare(self.ws, "northstar", self.spec(), self.client)
        with patch.dict(os.environ, {"SOCIAL_ENGINE_ALLOW_PUBLISH": "true"}):
            send(self.ws, "northstar", record["id"], record["confirmation_hash"], "Test Owner", self.client, True)
        evidence = {"state": "PUBLISHED", "source": "Local fixture provider receipt",
                    "explanation": "Synthetic test only", "post_ids": []}
        with self.assertRaises(EngineError):
            reconcile(self.ws, "northstar", record["id"], evidence, "Test Owner")
        evidence["post_ids"] = ["wrong-provider-post"]
        with self.assertRaises(EngineError):
            reconcile(self.ws, "northstar", record["id"], evidence, "Test Owner")
        evidence["post_ids"] = ["fixture-post-1"]
        result = reconcile(self.ws, "northstar", record["id"], evidence, "Test Owner")
        self.assertEqual(result["publication_status"], "PUBLISHED")
        self.assertEqual(len([c for c in self.remote_calls if c[:2] == ("POST", "/public/v1/posts")]), 1)
