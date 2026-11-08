# SASapps Demo Architecture

## Current Sites demo

The Site is a static HTML/CSS/ES module application. `dist/core.mjs` owns deterministic sample generation and pure state transitions. `dist/app.mjs` renders the public pages and demo dashboards, validates user input, persists state in browser `localStorage`, and creates CSV downloads. The static Site has no server API, database binding, R2 bucket, or authentication provider.

This separation keeps business rules independent from browser rendering. A future API-backed implementation can replace the persistence adapter while retaining and expanding the validation rules in `core.mjs`.

## Trust boundaries

- The current browser is the only persistence boundary. Data is not shared between viewers or devices.
- Role selection changes presentation only. It must never be treated as authorization.
- Client data and query parameters are untrusted. Receipt verification is local and exposes only a synthetic receipt number, amount, and timestamp.
- Payment, approval, invoice, and CSV actions are simulations. There is no bank credential or payment processing.
- Production authorization and financial state transitions must run on a trusted server inside database transactions.

## Future service boundaries

For production, split school content, identity, student enrollment, fee rules, invoice ledger, payment allocation, approvals, receipt verification, and reporting into service modules. Keep rendering independent from repositories so a browser client or server rendered app can call validated service endpoints.

## Persistence status

Sites D1 read tools are available, but no D1 provisioning or binding tool was exposed in this workflow. This deployment therefore uses browser local storage and does not claim cross-device persistence. R2 is unused because no uploaded assets or private files are needed for the demo.

## Render demo adapter

The Render companion serves this UI from Node.js and adds `/api/state` backed by `sasapps_demo_state.payload` (JSONB). A monotonically increasing version prevents a stale browser update from silently overwriting another device's changes. The server seeds the snapshot only when the database is empty. The ChatGPT Site remains local-only. This shared JSON snapshot is intentionally a demo persistence adapter, not the normalized financial data model or authorization boundary for a school system; see `render-deployment.md`.
