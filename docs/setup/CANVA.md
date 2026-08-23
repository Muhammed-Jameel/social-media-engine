# Canva Setup

Canva is an optional creative authoring/export provider. It is not the social publishing layer. The deterministic AURENDOR SVG renderer remains the offline fallback when Canva is unavailable or the account lacks Brand Template/Autofill access.

## Current state

- OAuth is not configured.
- No Canva account or plan entitlement has been verified.
- Create/copy/upload/export adapter calls are not implemented for production.
- Brand Templates, Autofill, and some analytics capabilities may require Canva Enterprise.
- Canva design comments or design-view analytics are not social comments or social performance metrics.

## Account setup checklist

1. Create a dedicated Canva Connect integration owned by AURENDOR.
2. Configure an exact redirect URI:

   ```text
   http://localhost:3000/api/oauth/canva/callback
   ```

   Use the environment’s HTTPS URL outside local development.
3. Use OAuth Authorization Code with PKCE S256.
4. Request only the scopes required for profile/identity, designs, assets, and exports. Add Brand Template/Autofill scopes only after entitlement is verified.
5. Store `CANVA_CLIENT_ID` and `CANVA_CLIENT_SECRET` in the server-side secret store. Never expose the secret with a `NEXT_PUBLIC_*` name.
6. Encrypt tokens at rest, preserve expiry/refresh state, and support revocation.
7. Probe capabilities individually and persist reasons for unavailable plan, permission, or preview state.

## Validation sequence

Do not use production creative first. In a non-production workspace:

1. Read the connected user/team identity and confirm it is the intended AURENDOR workspace.
2. Create or copy a disposable design.
3. Upload a licensed test asset.
4. If entitled, autofill a disposable Brand Template with benign fixture data.
5. Export a PNG and verify dimensions, MIME type, hash, visual fidelity, Arabic shaping/RTL, fonts, and transparency behavior.
6. Verify the editable design URL resolves only to authorized users.
7. Revoke access and confirm the engine changes the capability to unavailable.
8. Repeat rate-limit, timeout, partial-export, and retry tests with the same idempotency key.

Provider success is not creative approval. Every Canva result must be rendered, stored with a content hash and license record, inspected at full/mobile scale, and pass the same dual-critic gate as deterministic or manually imported work.

## Brand-template requirements

Any approved AURENDOR Canva template must use the current FINAL 2026 system:

- deep green `#003F35`
- neon green `#0EDB23`
- pale green `#77FF70`
- paper `#F4F8F5`
- Dh Ranclo for Latin display
- Ghroob Arabic ITF for Arabic
- disciplined grid, modular geometry, quiet confidence, and correct RTL

Archived cream/gold Sovereign Field v3 templates may remain for provenance but cannot be selected by the current renderer/provider route.

## Manual handoff

Until the adapter and entitlement are verified, generate or review assets in the deterministic/manual path. A human may recreate an approved brief in Canva and return:

- the editable design URL;
- exported original-resolution files;
- exact template/version identifier;
- asset/font/license evidence;
- export timestamp and content hashes.

The returned assets re-enter normal QA at `NEEDS_REVIEW`; a manual Canva handoff does not inherit approval.
