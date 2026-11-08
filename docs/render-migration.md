# Render Migration Roadmap

Target: **GitHub → Render Web Service → Render Managed PostgreSQL**. The current Sites version is a prototype, not a production foundation. Do not connect real student data until identity, privacy, operations, and school approval are complete.

## Suggested production stack

- Next.js, React, and TypeScript for the web experience and Route Handlers, or a separate Node.js service.
- Render Web Service for application/API hosting and Render Managed PostgreSQL for durable relational storage.
- Server-side sessions and role/permission checks. Do not accept role claims from browser state.
- Versioned SQL migrations with uniqueness, foreign-key, check, and transaction constraints.
- Private object storage for authorized files, with short-lived signed reads and audited access.

## Migration stages

1. Confirm the actual school identity, scope, operational owner, privacy basis, retention, and approval policy.
2. Create a private `adith92/SASapps` repository when repository creation is available; migrate the reviewed source and retain the existing `adith92/docs` project history.
3. Separate domain services from UI; replace local storage with typed API calls and server-side validation.
4. Design PostgreSQL migrations for schools/campuses, academic years, classrooms, profiles, students, enrollments, fee rates, invoices/lines, payments/allocations, approval requests, receipts, and audit events.
5. Implement server-side authentication, role authorization, dual control, transaction-safe invoice/payment updates, stale-approval checks, rate-limited receipt verification, and append-only audit storage.
6. Add privacy review, 2FA for staff, encrypted backups, restore drills, access monitoring, and retention jobs before importing any real records.
7. Validate migrations and reconciliation with synthetic data in staging; only then conduct school-led UAT and plan a controlled launch.

## Database invariants to carry forward

- One invoice per student, period, and fee rule unless an explicit versioned adjustment applies.
- Payment allocations cannot exceed verified payment value or invoice outstanding balance.
- Receipts are issued only after a verified payment and never expose student PII on public verification.
- A requester cannot approve their own sensitive request.
- Partial decisions are field-level, explicit, audited, and protected against stale data.
- Reversals preserve history; financial records are not hard-deleted.

## Hosting and operations

Use Render Managed PostgreSQL private networking and TLS. Keep secrets in Render environment settings. Define health checks, deploy rollback, migrations as a controlled release step, scheduled encrypted backups, tested restore objectives, and an incident contact. Do not use Sites D1 as a PostgreSQL substitute.

