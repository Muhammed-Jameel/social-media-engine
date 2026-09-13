#!/usr/bin/env python3
"""Run personally in a local terminal. Never pass passwords as arguments."""
import base64
import getpass
import hashlib
import os
from pathlib import Path
import re
import secrets
import sys
import tempfile

OWNER_EMAIL = "muhammedjameel844@gmail.com"


def encode(value):
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def main():
    if not sys.stdin.isatty():
        raise SystemExit("Run this command personally in an interactive local terminal.")
    root = Path(__file__).resolve().parent.parent
    destination = root / ".env.local"
    original = destination.read_text() if destination.exists() else ""
    if re.search(r"^OWNER_PASSWORD_HASH\s*=\s*['\"]?scrypt:", original, re.M):
        raise SystemExit("An owner login already exists; this setup will not overwrite it.")
    print(f"Create the SOCIAL_MEDIA_PLUGIN dashboard login for {OWNER_EMAIL}.")
    print("Your password stays on this computer and is not printed or saved as plain text.")
    password = getpass.getpass("New password (at least 12 characters): ")
    if len(password) < 12:
        raise SystemExit("Password must contain at least 12 characters. Nothing changed.")
    if password != getpass.getpass("Repeat password: "):
        raise SystemExit("Passwords did not match. Nothing changed.")
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=64)
    values = {
        "OWNER_EMAIL": OWNER_EMAIL,
        "OWNER_PASSWORD_HASH": f"scrypt:{encode(salt)}:{encode(digest)}",
        "DEMO_MODE": "false",
    }
    # Retain a valid existing session secret; initialize only when absent/short.
    match = re.search(r"^OWNER_SESSION_SECRET[ \t]*=[ \t]*([^\r\n]*)", original, re.M)
    value = match.group(1).strip() if match else ""
    if value.startswith(('"', "'")):
        value = value[1:].split(value[0], 1)[0]
    else:
        value = value.split('#', 1)[0].strip()
    if len(value) < 32:
        values["OWNER_SESSION_SECRET"] = secrets.token_urlsafe(48)
    updated = original
    for name, value in values.items():
        pattern = rf"^{name}\s*=.*$"
        if re.search(pattern, updated, re.M):
            updated = re.sub(pattern, lambda _: f'{name}="{value}"', updated, flags=re.M)
        else:
            updated = updated.rstrip("\n") + f'\n{name}="{value}"\n'
    fd, temporary = tempfile.mkstemp(prefix=".owner-setup-", dir=root)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w") as output:
            output.write(updated)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, destination)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print("Owner login configured. Tell Codex setup is complete so it can restart and verify the dashboard.")
    print("Publishing switches and global pause were preserved; no post was scheduled by this command.")


if __name__ == "__main__":
    main()
