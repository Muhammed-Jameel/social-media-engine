# Contributing

Issues, documentation, translations, bug fixes, and new provider adapters are welcome.

1. Describe the user problem and intended behavior in an issue or focused pull request.
2. Keep the plugin portable and brand-neutral. Never add customer identities or assets.
3. Add regression tests for behavior changes. Use isolated workspaces and local fake APIs.
4. Run `python3 -m unittest discover -s tests -v` and `python3 scripts/build_release.py`.
5. Update the English, Arabic and Japanese README files if user-facing behavior changes.

Never commit tokens, private brand workspaces, generated customer material, licensed
fonts, caches, or local archives. Avoid live provider calls in automated tests.
Keep the native Codex and Claude manifests and their marketplace entries compatible.
Security reports belong in the private channel in SECURITY.md, not public issues.
Be respectful, specific, and constructive. Contributions are provided under MIT.
