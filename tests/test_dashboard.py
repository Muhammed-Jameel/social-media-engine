"""Loopback API security and owner-action tests, without opening real services."""
import base64
import json
import threading
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from test_engine import RuntimeHarness, PROFILE
from dashboard import server_for


class DashboardTests(RuntimeHarness):
    def setUp(self):
        super().setUp()
        self.ready()
        self.server, self.token = server_for(str(self.workspace), "northstar", token="fixture-session-token")
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base = "http://127.0.0.1:%d" % self.server.server_port

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        super().tearDown()

    def request(self, route, body=None, authorized=True, headers=None):
        extra = {"Authorization": "Bearer " + self.token} if authorized else {}
        if body is not None:
            extra["Content-Type"] = "application/json"
        extra.update(headers or {})
        req = Request(self.base + route, data=json.dumps(body).encode() if body is not None else None,
                      headers=extra)
        try:
            response = urlopen(req, timeout=5)
        except HTTPError as exc:
            response = exc
        with response:
            raw = response.read()
            return response.status, response.headers, raw

    def test_no_token_cannot_read_or_modify_private_state(self):
        for route, body in [("/api/state", None), ("/api/brand", {"answers": {"name": "Attack"}, "actor": "Unknown"})]:
            status, _, raw = self.request(route, body, authorized=False)
            self.assertEqual(status, 401)
            self.assertNotIn(PROFILE["description"].encode(), raw)
        self.assertEqual(self.call("status")["profile"]["answers"]["name"], PROFILE["name"])

    def test_cross_origin_and_host_rebinding_are_rejected(self):
        self.assertEqual(self.request("/api/state", headers={"Origin": "https://evil.invalid"})[0], 403)
        self.assertEqual(self.request("/api/state", headers={"Host": "evil.invalid"})[0], 403)
        self.assertEqual(self.request("/api/state", headers={"Sec-Fetch-Site": "cross-site"})[0], 403)

    def test_static_html_is_public_but_has_restrictive_headers(self):
        status, headers, raw = self.request("/", authorized=False)
        self.assertEqual(status, 200)
        self.assertIn("frame-ancestors 'none'", headers["Content-Security-Policy"])
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(headers["Referrer-Policy"], "no-referrer")
        self.assertNotIn(self.token.encode(), raw)
        self.assertNotIn(PROFILE["description"].encode(), raw)

    def test_asset_upload_preserves_filename_and_requires_brand_reapproval(self):
        value = {"name": "owner-guidelines.txt", "base64": base64.b64encode(b"Original fixture guidelines").decode(),
                 "role": "guideline", "rights": "owned", "note": "Owned test material", "actor": "Test Owner"}
        status, _, raw = self.request("/api/asset", value)
        self.assertEqual(status, 200, raw)
        self.assertEqual(json.loads(raw)["name"], "owner-guidelines.txt")
        self.assertEqual(self.call("status")["state"], "BRAND_REVIEW")
        value["name"] = "../outside.txt"
        self.assertEqual(self.request("/api/asset", value)[0], 400)

    def test_asset_and_route_traversal_do_not_expose_files(self):
        self.assertEqual(self.request("/api/asset?id=../../state.sqlite3")[0], 400)
        self.assertEqual(self.request("/../../README.md")[0], 404)
