# SASapps Demo QA Checklist

## Automated checks

- [x] Seed contains 20 unique fictional students and three invoice periods.
- [x] Invoice batch generation is duplicate-safe.
- [x] Partial payment updates paid balance and status.
- [x] Payment verification updates state and audit history.
- [x] Approval supports partial decisions and field-level acceptance.
- [x] Receipt lookup does not return a student name.
- [x] Overpayment is rejected.

Run: `node --test tests/*.test.mjs`

## Browser checks before deployment

- [x] Public landing page and Portal navigation render; prototype reference reviewed.
- [x] Contact form feedback and unknown-page state.
- [ ] Public profile, vision, facilities, and announcements pages.
- [x] Portal role switch among Siswa, TU, and Admin; visible Demo Mode disclosures.
- [x] Student invoice details, printable receipt preview, QR image, and verification link.
- [ ] Invalid receipt code shows a clear result.
- [x] TU student name search and class filter; invoice generation adds 20 rows and is duplicate-safe (unit test).
- [x] TU partial payment, pending payment verification, approval request, and CSV action available.
- [x] Admin partial approval lists accepted and rejected fields; decision is recorded in audit history.
- [x] Admin reset returns the browser to seed data; refresh retained prior data before reset.
- [x] Responsive layout inspected in a narrow in-app browser viewport; desktop width not separately inspected.
- [ ] Contact details and school branding edit; console review and download contents.
- [ ] No browser console errors during the above interactions.

Browser storage is local to this device/browser. Other viewers will not see these changes.

