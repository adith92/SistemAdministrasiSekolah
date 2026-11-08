# Implementation Plan

1. Define and test pure demo state transitions for billing, payments, approvals, reset, and CSV data.
2. Build a responsive school profile shell with public sections and a persistent Demo Mode role switcher.
3. Build Student, TU, and Super Admin views driven by one local state model and activity log.
4. Add synthetic seed records and visible limitations, then validate with unit and browser checks.
5. Package static files from `dist/` and deploy a private Sites version.

Risks: browser storage is per browser and has no server-side isolation; role switching is intentionally not authentication; D1 is not provisioned through the available Sites workflow. These limits will be stated in the interface and docs.

