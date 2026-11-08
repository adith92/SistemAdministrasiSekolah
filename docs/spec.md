# SASapps Sites Demo Spec

## Objective
Deliver a private, presentable Sites demo for a one-campus Indonesian school administration system. Visitors can explore a fictional school profile; staff can switch among clearly labeled Student, TU, and Super Admin demo views and exercise billing, approval, receipt, and reporting flows.

## Tech Stack
Buildless HTML, CSS, and JavaScript hosted by ChatGPT Sites. Demo state is stored in the current browser's local storage. IDR formatting uses `id-ID`; dates use `Asia/Jakarta`. No real authentication, payment processing, student data, external storage, or D1 binding is configured.

## Commands
- Test: `node --test tests/*.test.mjs`
- Build: none (static files are packaged directly from `dist/`)
- Preview: `python -m http.server 4173 --directory dist`

## Project Structure
- `dist/` — deployable site files
- `tests/` — Node built-in tests for demo state transitions
- `docs/` — product, architecture, data, and migration notes
- `.openai/hosting.json` — Sites project ID and static directory

## Code Style
Use small pure functions for business rules, semantic HTML, readable labels, Indonesian-language copy, and CSS variables for colors and spacing. Keep user-facing records synthetic and mark role switching as Demo Mode.

```js
export function verifyPayment(state, paymentId) {
  return { ...state, payments: state.payments.map(payment =>
    payment.id === paymentId ? { ...payment, status: "verified" } : payment
  ) };
}
```

## Testing Strategy
Use Node's built-in test runner for state transitions and validation; inspect the public and role views in a browser; manually exercise billing generation, partial payment, approval, receipts, CSV export, refresh persistence, and reset. Database persistence and authentication remain out of scope for this demo.

## Boundaries
- Always: fictional data only; visibly disclose Demo Mode; no live payment or credentials; keep Site owner-private; preserve the existing prototype and docs.
- Ask first: change Site audience, connect production integrations, use real student data, or overwrite existing project documents.
- Never: present role switching as security, treat demo QR as proof of payment, or claim production readiness.

## Success Criteria
- Public school pages and responsive navigation are complete and clearly identify placeholder school content.
- Student, TU, and Super Admin demo views provide working actions over fictional data.
- Approval decisions, partial decisions, billing, payments, receipts, audit events, and reset behave consistently and persist in the same browser after refresh.
- No payment gateway, actual bank details, student PII, or real authentication is present.
- Site is deployed through Sites while owner-only access remains in place.

## Open Questions
Official school name, address, contacts, logo, and brand assets are intentionally unresolved; placeholder settings can be edited in the demo.

