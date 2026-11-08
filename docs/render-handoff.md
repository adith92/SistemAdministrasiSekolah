# Render Deployment Handoff

Status: live demo, handed off on 2026-11-03. This is synthetic demo data only.

## Live resources

- Web service: [sasapps-demo.onrender.com](https://sasapps-demo.onrender.com)
- Service ID: `srv-dbkc5f0473hc7388m4r0`
- Service Dashboard: https://dashboard.render.com/web/srv-dbkc5f0473hc7388m4r0
- Managed PostgreSQL: `sasapps-demo-db`, PostgreSQL 18, Singapore, free plan
- Database ID: `dpg-dbkbtlmc6qcc73e4rusg-a`
- Database Dashboard: https://dashboard.render.com/d/dpg-dbkbtlmc6qcc73e4rusg-a
- Free database expiry shown by Render: 2026-12-02. Upgrade or export before expiry if the demo must continue.
- Web service runs on the free plan and can sleep while idle.
- Last live deploy: `dep-dbkc7es9v7es73cbe7n0`, commit `379e4ef6b026b9dbd74a5cf9e091c3b8d89ff809`, on `main`.

## Source and commands

Render is connected to `adith92/docs`, branch `main`, root directory `projects/SASapps/sites-demo`.

- Runtime: Node.js
- Build: `npm ci --omit=dev`
- Start: `npm start`
- Health path: `/health`
- `DATABASE_URL` is the private Render internal connection string. Keep both resources in the Singapore region and same workspace.
- `SASAPPS_DEMO_PASSWORD` is a Render secret. HTTP Basic username is `sasapps`.

The root route requires Basic authentication (unauthenticated GET returned HTTP 401); `GET /health` returned HTTP 200. Server startup awaits PostgreSQL schema creation and seed insertion before opening the listener, so a healthy response confirms the database initialized. The app persists a single synthetic state snapshot in `sasapps_demo_state` JSONB; it is not a normalized school database.

## Security handoff

No password or connection string is stored in this repository. The demo password was generated during setup and is not included here. Set a new `SASAPPS_DEMO_PASSWORD` in the Render service Environment page before handing the URL to a tester, then use the HTTP Basic username `sasapps`.

The service currently uses the latest database credential `sasapps_render_v2`. Two earlier database credential entries, `sasapps_render_app` and `sasapps_demo_db_user`, remain in the database credential list and are no longer used by this service. Revoke them after confirming no other consumer depends on them. Do not copy their values into chat or GitHub.

Render's hosted SQL connector cannot reach this database because its external IP allowlist is empty. Do not open database ingress to the internet for that tool; verify from the same-region Render service or an approved local Render connection.

## Verification

- `npm test`: 16 tests passed before publication.
- `node --check server.mjs`, `node --check dist/app.mjs`, and `node --check dist/core.mjs`: passed.
- Live Render deploy: status `live`.
- Live `/health`: HTTP 200, `{"ok":true}`.
- Live unauthenticated `/`: HTTP 401 with a Basic authentication challenge.
- Render database query tool was blocked by the intentional empty external allowlist; startup health confirms the service connected and initialized the database.

## Demo limits

All records are synthetic. Roles are presentation-only and are not independently authorized. The single shared password protects the demo, not production school data. Payments, receipts, and verification are simulated. The free database expires and is not a production retention plan. Do not enter real student or payment data.

For production, implement managed identity and server-side role authorization, normalized tables and transactional workflows, immutable audit history, backups and restore drills, privacy review, and school-led acceptance testing.