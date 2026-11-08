import test from "node:test";
import assert from "node:assert/strict";
import { seedDemo, generateMonthlyInvoices, recordPartialPayment, decidePayment, decideApproval, verifyReceipt, requestApproval, createStudent, updateFeeRate, addDiscount } from "../dist/core.mjs";

test("demo starts with twenty synthetic students and three billing periods", () => {
  const state = seedDemo();
  assert.equal(state.students.length, 20);
  assert.equal(new Set(state.students.map(x => x.nis)).size, 20);
  assert.equal(new Set(state.invoices.map(x => x.period)).size, 3);
});

test("monthly invoice generation does not duplicate an existing student period", () => {
  const state = seedDemo();
  const next = generateMonthlyInvoices(state, "2026-12");
  assert.equal(next.invoices.filter(x => x.period === "2026-12").length, 20);
  assert.equal(generateMonthlyInvoices(next, "2026-12").invoices.length, next.invoices.length);
});

test("partial payment reduces invoice balance and marks it partially paid", () => {
  const state = seedDemo();
  const invoice = state.invoices.find(x => x.amount > x.paid);
  const next = recordPartialPayment(state, invoice.id, 250000);
  const updated = next.invoices.find(x => x.id === invoice.id);
  assert.equal(updated.paid, invoice.paid + 250000);
  assert.equal(updated.status, "partial");
});

test("payment decisions update the matching payment and append history", () => {
  const state = seedDemo();
  const payment = state.payments.find(x => x.status === "pending");
  const next = decidePayment(state, payment.id, "verified", "Data demo cocok");
  assert.equal(next.payments.find(x => x.id === payment.id).status, "verified");
  assert.ok(next.audit.some(x => x.entityId === payment.id && x.action === "payment_verified"));
});

test("approval supports partial decisions and records accepted fields", () => {
  const state = seedDemo();
  const request = state.approvals.find(x => x.status === "pending");
  const next = decideApproval(state, request.id, "partial", "Nominal disetujui sebagian", ["amount"]);
  const updated = next.approvals.find(x => x.id === request.id);
  assert.equal(updated.status, "partially_approved");
  assert.deepEqual(updated.acceptedFields, ["amount"]);
  assert.ok(next.audit.some(x => x.entityId === request.id && x.action === "approval_partial"));
});

test("receipt verification returns only a safe public summary", () => {
  const state = seedDemo();
  const receipt = state.receipts[0];
  const result = verifyReceipt(state, receipt.code);
  assert.equal(result.valid, true);
  assert.equal("studentName" in result, false);
  assert.deepEqual(verifyReceipt(state, "invalid").valid, false);
});

test("partial approval can accept the due date while rejecting the amount change", () => {
  const state = seedDemo();
  const invoice = state.invoices.find(x => x.period === "2026-11");
  const requested = requestApproval(state, invoice.id, invoice.amount - 50000, "Penyesuaian untuk demo.");
  const request = requested.approvals[0];
  const next = decideApproval(requested, request.id, "partial", "Tanggal disetujui, nilai ditolak.", ["dueDate"]);
  const updated = next.invoices.find(x => x.id === invoice.id);
  assert.equal(updated.amount, invoice.amount);
  assert.equal(updated.dueDate, request.proposed.dueDate);
  assert.deepEqual(next.approvals[0].acceptedFields, ["dueDate"]);
});

test("partial payment rejects an amount larger than the outstanding balance", () => {
  const state = seedDemo();
  const invoice = state.invoices.find(x => x.amount > x.paid);
  assert.throws(() => recordPartialPayment(state, invoice.id, invoice.amount - invoice.paid + 1), /melebihi sisa/);
});

test("a TU-entered verified partial payment receives a matching demo receipt", () => {
  const state = seedDemo();
  const invoice = state.invoices.find(x => x.amount > x.paid);
  const next = recordPartialPayment(state, invoice.id, 100000);
  const payment = next.payments[0];
  assert.ok(next.receipts.some(receipt => receipt.paymentId === payment.id));
});

test("new synthetic students require a unique numeric NIS and known class", () => {
  const state = seedDemo();
  assert.throws(() => createStudent(state, { name: "Demo Siswa", nis: state.students[0].nis, className: "VII-A" }), /sudah digunakan/);
  const next = createStudent(state, { name: "Demo Siswa", nis: "269999", className: "VII-A" });
  assert.equal(next.students.length, 21);
  assert.equal(next.students.at(-1).email, "siswa.269999@contoh.test");
});

test("class rates and discounts affect newly generated invoices only", () => {
  const state = seedDemo();
  const before = state.invoices[0].amount;
  const rated = updateFeeRate(state, "VII-A", 1000000);
  const adjusted = addDiscount(rated, { label: "Beasiswa Demo", className: "VII-A", amount: 200000 });
  const next = generateMonthlyInvoices(adjusted, "2026-12");
  const invoice = next.invoices.find(x => x.className === "VII-A" && x.period === "2026-12");
  assert.equal(invoice.amount, 650000);
  assert.equal(invoice.lines.at(-1).amount, -350000);
  assert.equal(state.invoices[0].amount, before);
});

