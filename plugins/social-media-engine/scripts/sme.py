#!/usr/bin/env python3
"""Social Media Engine CLI; all generated JSON is data for the host agent."""
import argparse
import json
import sqlite3
import sys
from engine import EngineError, FIELD_GROUPS, VERSION, Workspace, read_json


def parser():
    p = argparse.ArgumentParser(description="Social Media Engine brand workspace and review tools")
    p.add_argument("--version", action="version", version=VERSION)
    p.add_argument("--workspace", required=True, help="Existing absolute user working folder (never the plugin cache)")
    p.add_argument("--brand", default=None, help="Explicit lowercase brand identifier")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("brands", help="List brands; no implicit brand selection")
    sub.add_parser("status", help="Get onboarding progress and next missing fields")
    sub.add_parser("questionnaire", help="List questionnaire groups")
    sub.add_parser("snapshot", help="All selected-brand plans, content, reviews, and receipts")
    for command in ["brand-update", "plan-import", "item-save", "feedback", "metrics-import"]:
        c = sub.add_parser(command)
        c.add_argument("--file", required=True)
        if command in {"brand-update", "plan-import"}:
            c.add_argument("--actor", required=True)
    c = sub.add_parser("context", help="Read current approved brand context before generation")
    c.add_argument("--item-file", help="Item skeleton containing id, plan_id and platform/language variants")
    c.add_argument("--campaign")
    c.add_argument("--item")
    c.add_argument("--platform")
    c.add_argument("--language")
    c = sub.add_parser("brand-approve")
    c.add_argument("--hash", required=True)
    c.add_argument("--actor", required=True)
    for command in ["rule-approve", "rule-retire", "dispatch-cancel-local"]:
        c = sub.add_parser(command)
        c.add_argument("--id", required=True)
        c.add_argument("--actor", required=True)
    c = sub.add_parser("asset-import")
    c.add_argument("--file", required=True)
    c.add_argument("--role", required=True)
    c.add_argument("--rights", required=True)
    c.add_argument("--note", required=True)
    c.add_argument("--actor", required=True)
    c = sub.add_parser("review-add")
    c.add_argument("--id", required=True)
    c.add_argument("--file", required=True)
    c = sub.add_parser("item-approve")
    c.add_argument("--id", required=True)
    c.add_argument("--hash", required=True)
    c.add_argument("--actor", required=True)
    c = sub.add_parser("export")
    c.add_argument("--id", required=True)
    c = sub.add_parser("dashboard")
    c.add_argument("--port", type=int, default=0, help="Loopback port; default selects an available port")
    sub.add_parser("accounts", help="Read connected Postiz accounts using environment credentials")
    c = sub.add_parser("provider-posts")
    c.add_argument("--start", required=True)
    c.add_argument("--end", required=True)
    c = sub.add_parser("dispatch-prepare")
    c.add_argument("--file", required=True)
    c = sub.add_parser("dispatch-send")
    c.add_argument("--id", required=True)
    c.add_argument("--hash", required=True)
    c.add_argument("--actor", required=True)
    c.add_argument("--send", action="store_true")
    c = sub.add_parser("dispatch-reconcile")
    c.add_argument("--id", required=True)
    c.add_argument("--file", required=True)
    c.add_argument("--actor", required=True)
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    if args.command == "dashboard":
        from dashboard import serve
        if not args.brand:
            raise EngineError("Select --brand explicitly.")
        serve(args.workspace, args.brand, args.port)
        return
    ws = Workspace(args.workspace)
    try:
        cmd, brand = args.command, args.brand
        if cmd == "brands":
            result = ws.brands()
        elif cmd == "questionnaire":
            result = FIELD_GROUPS
        else:
            if not brand:
                raise EngineError("Select --brand explicitly; use brands to list existing profiles.")
            if cmd == "status": result = ws.status(brand)
            elif cmd == "snapshot": result = ws.snapshot(brand)
            elif cmd == "brand-update": result = ws.update_brand(brand, read_json(args.file), args.actor)
            elif cmd == "brand-approve": result = ws.approve_brand(brand, args.hash, args.actor)
            elif cmd == "context":
                result = ws.item_context(brand, read_json(args.item_file)) if args.item_file else ws.context(brand, args.campaign, args.item, args.platform, args.language)
            elif cmd == "asset-import": result = ws.import_asset(brand, args.file, args.role, args.rights, args.note, args.actor)
            elif cmd == "plan-import": result = ws.import_plan(brand, read_json(args.file), args.actor)
            elif cmd == "item-save": result = ws.save_item(brand, read_json(args.file))
            elif cmd == "review-add": result = ws.add_review(brand, args.id, read_json(args.file))
            elif cmd == "item-approve": result = ws.approve_item(brand, args.id, args.hash, args.actor)
            elif cmd == "feedback": result = ws.feedback(brand, read_json(args.file))
            elif cmd == "rule-approve": result = ws.approve_rule(brand, args.id, args.actor)
            elif cmd == "rule-retire": result = ws.retire_rule(brand, args.id, args.actor)
            elif cmd == "metrics-import": result = ws.import_metrics(brand, read_json(args.file))
            elif cmd == "export": result = ws.export_item(brand, args.id)
            else:
                import providers
                if cmd == "dispatch-cancel-local": result = providers.cancel_local(ws, brand, args.id, args.actor)
                elif cmd == "dispatch-reconcile": result = providers.reconcile(ws, brand, args.id, read_json(args.file), args.actor)
                else:
                    client = providers.Postiz()
                    if cmd == "accounts": result = client.accounts()
                    elif cmd == "provider-posts": result = client.posts(args.start, args.end)
                    elif cmd == "dispatch-prepare": result = providers.prepare(ws, brand, read_json(args.file), client)
                    elif cmd == "dispatch-send": result = providers.send(ws, brand, args.id, args.hash, args.actor, client, args.send)
                    else: raise EngineError("Unknown command.")
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
    finally:
        ws.close()


if __name__ == "__main__":
    try:
        main()
    except (EngineError, OSError, sqlite3.Error, KeyError, TypeError, ValueError) as exc:
        message = str(exc) if isinstance(exc, EngineError) else "Operation could not complete. Check input fields, file access, available disk space, and workspace state."
        print(json.dumps({"error": message}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
