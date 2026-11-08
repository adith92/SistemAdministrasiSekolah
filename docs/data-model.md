# Demo Data Model

All records are synthetic and are seeded in `dist/core.mjs`.

- **School settings:** placeholder name, slogan, address, email, and phone.
- **Students:** 20 fictional profiles with NIS-shaped demo identifiers, class, year, and active status. Contact values use reserved `.test` email domains and synthetic phone strings.
- **Invoices:** 20 students across September, October, and November 2026. Each invoice has a fee line, amount, paid amount, due date, and derived status.
- **Master data:** five demo classes and class SPP rates for 2026/2027, one demo fee type, and one class-based scholarship adjustment. New invoices use the current rate and adjustment; existing invoices are not rewritten.
- **Payments:** pending and verified sample entries. A verified payment updates its invoice and creates a synthetic receipt.
- **Approvals:** before/after values for amount and due date. Partial approval stores which fields were accepted; other proposed fields are denied.
- **Audit events:** append-style activity history for the UI. Since state is client-side, it is not immutable or suitable as a compliance audit log.
- **Receipts:** synthetic receipt number, amount, timestamp, and validity status. Verification pages omit student names.

The browser seed can be restored with **Reset Demo Data**. Local storage is user-editable browser data and provides no integrity or confidentiality guarantee.

