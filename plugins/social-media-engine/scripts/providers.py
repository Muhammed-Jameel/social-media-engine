"""Opt-in Postiz bridge with durable intents and no blind mutation retries."""
from __future__ import annotations

import hashlib
import json
import mimetypes
import os
from pathlib import Path
import secrets
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlunsplit, urlencode
from urllib.request import Request, build_opener, HTTPRedirectHandler

from engine import EngineError, digest, encode, identifier, instant, now, require, text


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise EngineError("Provider redirect refused; configure the final API URL explicitly.")


def api_url(value):
    require(isinstance(value, str), "Configure POSTIZ_API_URL.")
    parsed = urlsplit(value)
    require(parsed.scheme == "https" or (parsed.scheme == "http" and parsed.hostname in {"127.0.0.1", "localhost", "::1"}), "Postiz requires HTTPS, except for local development.")
    require(bool(parsed.hostname) and not parsed.username and not parsed.password and not parsed.query and not parsed.fragment, "Use an API base URL without credentials, query, or fragment.")
    path = parsed.path.rstrip("/")
    if not path.endswith("/public/v1"):
        path += "/public/v1"
    return urlunsplit((parsed.scheme, parsed.netloc, path, "", ""))


class Postiz:
    def __init__(self, base_url=None, key=None):
        self.base = api_url(base_url or os.environ.get("POSTIZ_API_URL", ""))
        self.key = key or os.environ.get("POSTIZ_API_KEY", "")
        require(bool(self.key.strip()) and "\n" not in self.key and "\r" not in self.key, "Set POSTIZ_API_KEY securely in the host environment.")
        self.identity = digest({"url": self.base, "key_hash": hashlib.sha256(self.key.encode()).hexdigest()})

    def request(self, path, method="GET", body=None, content_type="application/json"):
        req = Request(self.base + path, data=body, method=method, headers={"Authorization": self.key, "Content-Type": content_type, "User-Agent": "social-media-engine/1.0"})
        try:
            with build_opener(NoRedirect()).open(req, timeout=30) as response:
                raw = response.read(8 * 1024 * 1024 + 1)
                require(len(raw) <= 8 * 1024 * 1024, "Provider response exceeds 8 MB.")
                return json.loads(raw)
        except HTTPError as exc:
            raise EngineError(f"Postiz HTTP {exc.code}. Check account permissions and provider settings; response details were withheld to protect credentials.") from None
        except (URLError, TimeoutError, OSError, ValueError) as exc:
            raise EngineError("Postiz response was unavailable or invalid. A write may have succeeded; reconcile before retrying.") from exc

    def accounts(self):
        data = self.request("/integrations")
        if isinstance(data, dict):
            data = data.get("integrations")
        require(isinstance(data, list), "Invalid Postiz integrations response.")
        result = []
        for account in data:
            require(isinstance(account, dict), "Invalid Postiz integration.")
            result.append({"id": text(account.get("id"), "account ID", 200), "provider": text(account.get("identifier"), "provider", 100), "name": account.get("name", ""), "disabled": account.get("disabled", False), "profile": account.get("profile", "")})
        return result

    def upload(self, asset, raw):
        boundary = "sme-" + secrets.token_hex(16)
        name = asset["id"] + Path(asset["path"]).suffix
        mime = mimetypes.guess_type(name)[0] or "application/octet-stream"
        body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode() + raw + f"\r\n--{boundary}--\r\n".encode()
        value = self.request("/upload", "POST", body, f"multipart/form-data; boundary={boundary}")
        require(isinstance(value, dict), "Invalid upload response.")
        return {"id": text(value.get("id"), "remote asset ID", 200), "path": text(value.get("path"), "remote asset path")}

    def create(self, payload):
        return self.request("/posts", "POST", encode(payload).encode())

    def posts(self, start, end):
        instant(start)
        instant(end)
        return self.request("/posts?" + urlencode({"startDate": start, "endDate": end}))


def platform_name(provider):
    return {"instagram-standalone": "instagram", "linkedin-page": "linkedin"}.get(provider, provider)


def prepare(ws, brand, spec, client):
    require(isinstance(spec, dict), "Dispatch specification must be an object.")
    identifier(spec.get("id"))
    item = ws.current_item(brand, spec.get("item_id"))
    require(item["status"] == "APPROVED", "Approve the content before preparing publication.")
    require(spec.get("operation") in {"draft", "schedule", "now"}, "Choose draft, schedule, or now.")
    date = instant(spec.get("date"))
    if spec["operation"] == "schedule":
        require(date > datetime.now(timezone.utc), "Scheduled time must be in the future.")
    accounts = {a["id"]: a for a in client.accounts()}
    bindings = spec.get("bindings")
    require(isinstance(bindings, list) and 1 <= len(bindings) <= len(item["variants"]), "Select explicit account bindings.")
    selected = set()
    verified = []
    for b in bindings:
        require(isinstance(b, dict), "Account bindings must be objects.")
        account = accounts.get(b.get("account_id"))
        require(account and account["disabled"] is False, "Selected account is missing or disabled; reconnect it.")
        require(account["id"] not in selected, "Only one variant per account per dispatch is supported.")
        selected.add(account["id"])
        matches = [v for v in item["variants"] if v["platform"] == b.get("platform") and v["language"] == b.get("language")]
        require(len(matches) == 1 and matches[0]["platform"] == platform_name(account["provider"]), "Account platform does not match the selected variant.")
        settings = b.get("settings")
        require(isinstance(settings, dict) and settings.get("__type") == account["provider"], "Supply current provider settings with the exact __type.")
        text(b.get("capability_evidence"), "provider capability evidence")
        if account["provider"] == "tiktok":
            method = settings.get("content_posting_method")
            require(method in {"UPLOAD", "DIRECT_POST"}, "Select TikTok UPLOAD or DIRECT_POST explicitly.")
            require(method != "DIRECT_POST" or b.get("direct_post_verified") is True, "TikTok Direct Post needs verified app/account approval; choose UPLOAD otherwise.")
        if account["provider"].startswith("instagram"):
            require(settings.get("post_type") in {"post", "story"}, "Set Instagram post_type.")
        verified.append({**b, "account_name": account["name"], "provider": account["provider"]})
    record = {"id": spec["id"], "item_id": item["id"], "item_hash": item["hash"], "operation": spec["operation"], "date": date.astimezone(timezone.utc).isoformat(), "bindings": verified, "provider_base": client.base, "provider_identity": client.identity, "status": "PREPARED", "created": now()}
    record["confirmation_hash"] = digest(record)

    def apply():
        require(not ws.get("dispatch", brand, spec["id"], optional=True), "Dispatch ID already exists. Inspect its state; do not retry a sent intent.")
        require(not any(d["item_id"] == item["id"] and d["status"] != "CANCELLED_LOCAL" for d in ws.list("dispatch", brand)), "An intent already exists for this item; reconcile it before another publication.")
        ws.put("dispatch", brand, record["id"], record)
        ws.audit(brand, "dispatch.prepared", record["id"], {"hash": record["confirmation_hash"]})
        return record
    return ws.transaction(apply)


def send(ws, brand, key, confirmation_hash, actor, client, enabled=False):
    require(enabled and os.environ.get("SOCIAL_ENGINE_ALLOW_PUBLISH") == "true", "Sending requires --send and SOCIAL_ENGINE_ALLOW_PUBLISH=true, including remote drafts.")

    def reserve():
        record = ws.get("dispatch", brand, key)
        require(record["status"] == "PREPARED", "This intent was already attempted. Reconcile provider state; automatic retries are disabled.")
        require(record["confirmation_hash"] == confirmation_hash, "Review the current exact account, date, copy, and media binding.")
        require(record["provider_identity"] == client.identity and record["provider_base"] == client.base, "Provider endpoint or credentials changed; prepare a new approved intent.")
        item = ws.current_item(brand, record["item_id"])
        require(item["status"] == "APPROVED" and item["hash"] == record["item_hash"], "Publication approval is stale.")
        if record["operation"] == "schedule":
            require(instant(record["date"]) > datetime.now(timezone.utc), "Scheduled date has passed; prepare a new future schedule.")
        record.update(status="SENDING", actor=text(actor, "owner", 200), attempted=now())
        ws.put("dispatch", brand, key, record)
        ws.audit(brand, "dispatch.reserved", key, {"actor": actor, "hash": confirmation_hash})
        return record, item
    record, item = ws.transaction(reserve)
    posting_started = False
    try:
        accounts = {a["id"]: a for a in client.accounts()}
        for b in record["bindings"]:
            require(b["account_id"] in accounts and accounts[b["account_id"]]["disabled"] is False and accounts[b["account_id"]]["provider"] == b["provider"], "Account changed since preparation.")
        uploads = {}
        posts = []
        for b in record["bindings"]:
            variant = next(v for v in item["variants"] if v["platform"] == b["platform"] and v["language"] == b["language"])
            media = []
            for aid in variant.get("asset_ids", []):
                if aid not in uploads:
                    asset, raw = ws.asset_bytes(brand, aid)
                    uploads[aid] = client.upload(asset, raw)
                media.append(uploads[aid])
            posts.append({"integration": {"id": b["account_id"]}, "value": [{"content": variant["caption"], "image": media}], "settings": b["settings"]})
        payload = {"type": record["operation"], "date": record["date"], "shortLink": False, "tags": [], "posts": posts}
        record.update(payload=payload, payload_hash=digest(payload))
        ws.put("dispatch", brand, key, record)
        # Recheck current local approval after potentially slow uploads.
        current = ws.current_item(brand, item["id"])
        require(current["hash"] == record["item_hash"] and current["status"] == "APPROVED", "Approval changed during upload.")
        posting_started = True
        receipt = client.create(payload)
        record["receipt"] = receipt
        ws.put("dispatch", brand, key, record)
        require(isinstance(receipt, list) and len(receipt) == len(posts), "Partial provider acknowledgement; reconcile known IDs.")
        require(all(isinstance(r, dict) and isinstance(r.get("postId"), str) and r["postId"].strip() for r in receipt), "Invalid provider acknowledgement.")
        require({r.get("integration") for r in receipt} == {b["account_id"] for b in record["bindings"]} and len({r["postId"] for r in receipt}) == len(posts), "Provider acknowledgement does not match selected accounts.")
        record.update(status="ACCEPTED", accepted_at=now(), publication_status="UNCONFIRMED")
        ws.put("dispatch", brand, key, record)
        ws.audit(brand, "dispatch.accepted", key, {"receipt": receipt, "payload_hash": record["payload_hash"]})
        return record
    except Exception:
        record["status"] = "UNKNOWN" if posting_started else "BLOCKED_BEFORE_POST"
        ws.put("dispatch", brand, key, record)
        ws.audit(brand, "dispatch.blocked", key, {"status": record["status"], "action": "Inspect provider state and existing receipts before further mutations."})
        raise


def cancel_local(ws, brand, key, actor):
    def apply():
        record = ws.get("dispatch", brand, key)
        require(record["status"] in {"PREPARED", "BLOCKED_BEFORE_POST"}, "A remote or ambiguous publication must be reconciled/cancelled in the provider first.")
        record.update(status="CANCELLED_LOCAL", cancelled_by=text(actor, "owner", 200))
        ws.put("dispatch", brand, key, record)
        ws.audit(brand, "dispatch.cancelled_local", key, {"actor": actor})
        return record
    return ws.transaction(apply)


def reconcile(ws, brand, key, evidence, actor):
    require(isinstance(evidence, dict), "Supply provider evidence.")
    require(evidence.get("state") in {"SCHEDULED", "PUBLISHED", "FAILED", "CANCELLED", "DRAFT", "MANUAL_COMPLETION", "NOT_FOUND"}, "Invalid provider state.")
    text(evidence.get("source"), "provider record URL or saved API response")
    text(evidence.get("explanation"), "reconciliation explanation")
    require(isinstance(evidence.get("post_ids"), list), "Supply confirmed provider post IDs, including partial receipts.")
    require(all(isinstance(key, str) and key.strip() for key in evidence["post_ids"]) and
            len(evidence["post_ids"]) == len(set(evidence["post_ids"])), "Provider post IDs must be nonempty and unique.")

    def apply():
        record = ws.get("dispatch", brand, key)
        require(record["status"] not in {"PREPARED", "CANCELLED_LOCAL"}, "This intent has not been sent.")
        if evidence["state"] == "PUBLISHED":
            require(bool(evidence["post_ids"]), "Published status needs provider post IDs.")
            require(len(evidence["post_ids"]) == len(record["bindings"]), "Do not mark a partially published package fully published.")
            known = {r["postId"] for r in record.get("receipt", []) if isinstance(r, dict) and isinstance(r.get("postId"), str)} if isinstance(record.get("receipt"), list) else set()
            require(known <= set(evidence["post_ids"]), "Publication evidence does not match known provider receipts.")
            if any(b["provider"] == "tiktok" and b["settings"].get("content_posting_method") == "UPLOAD" for b in record["bindings"]):
                public = urlsplit(text(evidence.get("tiktok_public_url"), "confirmed public TikTok URL"))
                require(public.scheme == "https" and public.hostname and (public.hostname == "tiktok.com" or public.hostname.endswith(".tiktok.com")), "Use a confirmed HTTPS TikTok publication URL.")
        record.update(publication_status=evidence["state"], reconciliation={**evidence, "actor": text(actor, "owner", 200), "at": now()})
        ws.put("dispatch", brand, key, record)
        ws.audit(brand, "dispatch.reconciled", key, record["reconciliation"])
        return record
    return ws.transaction(apply)
