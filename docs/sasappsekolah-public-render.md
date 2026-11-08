# SaSappSekolah — Public Render Demo (2026-11-03)

## Deployment
- Live URL: https://sasappsekolah.onrender.com
- Render Dashboard: https://dashboard.render.com/web/srv-dbkqdih5efls73fca5rg
- Render service name: `SaSappSekolah`
- Service ID: `srv-dbkqdih5efls73fca5rg`
- Initial deploy ID: `dep-dbkqdj15efls73fca750`
- Source commit: `fd7bff858caa6b4225d5eccae442da6a6c903f9f`
- Workspace: GoldenBirdProject (`tea-d8g5jfegvqtc73bla6dg`)
- Region: Singapore, runtime Node, plan free
- Git repo: `https://github.com/adith92/docs`, branch `main`.
- Build command: `cd projects/SASapps/sites-demo && npm ci --omit=dev`
- Start command: `cd projects/SASapps/sites-demo && node public-server.mjs`
- Auto-deploy intentionally off, so other commits in the shared documentation repo do not automatically redeploy the public application.
- Render status: `live` confirmed via connector, service log confirms process listening on 10000.

## Public access
- No login, HTTP Basic challenge, or site password.
- Each browser can explore demo versions of Student, TU, Admin.
- All student identities, amounts, receipts, invoices, and approval decisions are fictional.
- All data changes are stored ONLY in that browser's localStorage.
- The public server does not accept PUT/POST/DELETE, and it does not connect to any financial database.
- `GET /health` → `{ "ok": true, "name": "SaSappSekolah" }`.
- `GET /api/status` reports public-demo mode and databaseConnected=false.
- Assets come from `dist/`. Branding text SASapps is replaced with SaSappSekolah only when served, without changing the private legacy demo.
- No `window.__SASAPPS_REMOTE__` flag is injected, so demo edits remain browser-local.

## Full Render next phase, NOT completed by this demo
- Dedicated Render PostgreSQL database with normalized schemas.
- Secured backend API with per-user identity, role authorization and audit trail.
- Provisioning real Student, TU, Super Admin accounts, transaction rules, payment verification and QR receipt.
- Rollback / backup / restore, privacy controls, formal acceptance testing.
- Real student/payment data must never be collected on this public no-password demo.
- The earlier `sasapps-demo` Render service and `sasapps-demo-db` are separate resources, not repurposed and not deleted by this deployment.
- Free web service can spin down on inactivity.

## Verification
- Source script: `public-server.mjs`
- Public server code syntax locally checked with Node 22.
- Render initial deploy status: live; build log: successful, server startup logged.
- Public HTTP endpoint check from an independent HTTP client was unavailable at the time of deployment due to outbound DNS/URL-fetch restrictions in the current execution environment. A separate end-to-end browser check is recommended; Render platform reports URL live.
