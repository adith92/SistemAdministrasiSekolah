# SASapps on Render

The Render demo is already live. See [the current deployment handoff](render-handoff.md) for resource identifiers, access state, verification, and rotation follow-up.

## Demo deployment

The Render version serves the existing Indonesian demo UI from a Node.js web service and stores its shared demo state in Render Managed PostgreSQL. The browser receives state through `/api/state`; the server uses a version check so an older browser snapshot cannot silently replace a newer one. The original ChatGPT Site continues to use browser-local storage.

The web service is protected by HTTP Basic authentication. Use username `sasapps` and the password supplied to the owner. `SASAPPS_DEMO_PASSWORD` is configured in Render, never committed to this repository. `/health` returns a minimal service health result without exposing data.

PostgreSQL creates one `sasapps_demo_state` JSONB row from the 20 synthetic student seed when the database is empty. This is shared demo persistence, not a normalized or production financial ledger. A reset from the Admin demo replaces that shared synthetic state. Do not enter real student or payment information.

## Render settings

- Web service: Node.js, Singapore region, free plan, `npm ci --omit=dev` build, `npm start` start.
- Managed PostgreSQL: PostgreSQL 18, Singapore region, free plan, 1 GB disk.
- `DATABASE_URL` uses the database's internal connection string; keep the web service and database in the same Render workspace and region.
- Free Render Postgres is temporary and expires after its free period. The free web service may spin down while idle. Move to a paid database before relying on long-term data retention.

## Local checks

```powershell
npm ci
npm test
node --check server.mjs
```

The server requires `DATABASE_URL` and a `SASAPPS_DEMO_PASSWORD` of at least 24 characters. The local Site remains static unless the Render server injects its remote-storage flag into `index.html`.

## Production work still required

The demo shares one editable JSON snapshot behind one password. It does not implement per-user accounts, role authorization, normalized school records, immutable audit logs, real payment processing, production backups, or a recovery plan. Before using real school data, replace the shared demo password with managed user identity and server-side role checks; migrate records to normalized tables and transactional services; add tested backups, audit controls, privacy review, and school-led acceptance testing.
