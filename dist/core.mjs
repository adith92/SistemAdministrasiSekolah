const classes = ["VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A"];
const names = ["Alya Putri", "Bima Pratama", "Citra Lestari", "Daffa Ramadhan", "Eka Maharani", "Farhan Akbar", "Gita Anindya", "Hana Safitri", "Ilham Nugraha", "Jihan Permata", "Kavin Mahesa", "Laras Wulandari", "Miko Saputra", "Nadia Kirana", "Omar Fadillah", "Putri Amelia", "Raka Firmansyah", "Salsa Nabila", "Tegar Wijaya", "Vina Puspita"];
const periods = ["2026-09", "2026-10", "2026-11"];
const formatPeriod = period => new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${period}-01T12:00:00+07:00`));
const id = prefix => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const balanceOf = invoice => Math.max(0, invoice.amount - invoice.paid);
function statusOf(amount, paid, dueDate) {
  if (paid >= amount) return "paid";
  if (paid > 0) return "partial";
  if (dueDate < "2026-11-02") return "overdue";
  return "unpaid";
}

export function seedDemo() {
  const students = names.map((name, i) => ({
    id: `stu-${String(i + 1).padStart(3, "0")}`, nis: `26${String(i + 1).padStart(4, "0")}`,
    name, className: classes[i % classes.length], year: "2026/2027", status: "Aktif",
    email: `${name.toLowerCase().replaceAll(" ", ".")}@contoh.test`, phone: `08${String(1200000000 + i * 311).slice(0, 10)}`,
  }));
  const invoices = students.flatMap((student, i) => periods.map((period, p) => {
    const amount = [850000, 900000, 950000, 875000, 925000][i % 5];
    const paid = p === 0 || (p === 1 && i % 4 !== 0) ? amount : (p === 1 && i % 4 === 0 ? 250000 : 0);
    const dueDate = `${period}-${p === 2 ? "10" : "15"}`;
    return { id: `inv-${student.id}-${period}`, studentId: student.id, studentName: student.name, nis: student.nis, className: student.className, period, amount, paid, dueDate, lines: [{ label: "SPP Bulanan", amount }], status: statusOf(amount, paid, dueDate) };
  }));
  const payments = [
    { id: "pay-demo-1", studentId: students[0].id, studentName: students[0].name, invoiceId: invoices.find(x => x.studentId === students[0].id && x.period === "2026-11").id, amount: 475000, method: "Transfer (simulasi)", createdAt: "2026-11-01T09:15:00+07:00", status: "pending", note: "Pembayaran parsial demo" },
    { id: "pay-demo-2", studentId: students[4].id, studentName: students[4].name, invoiceId: invoices.find(x => x.studentId === students[4].id && x.period === "2026-11").id, amount: 925000, method: "Tunai (simulasi)", createdAt: "2026-11-01T13:30:00+07:00", status: "pending", note: "Transaksi fiktif untuk demo" },
    { id: "pay-demo-3", studentId: students[2].id, studentName: students[2].name, invoiceId: invoices.find(x => x.studentId === students[2].id && x.period === "2026-10").id, amount: 900000, method: "Transfer (simulasi)", createdAt: "2026-10-09T10:00:00+07:00", status: "verified", note: "Terverifikasi demo" },
  ];
  const approvals = [{ id: "apr-demo-1", type: "Penyesuaian tagihan", entityId: invoices[2].id, studentName: invoices[2].studentName, period: invoices[2].period, before: { amount: invoices[2].amount }, proposed: { amount: invoices[2].amount - 100000 }, reason: "Permohonan keringanan untuk simulasi alur persetujuan.", requestedBy: "TU Demo", status: "pending", acceptedFields: [] }];
  const receipts = payments.filter(x => x.status === "verified").map(payment => ({ code: `SAS-${payment.id.toUpperCase()}`, paymentId: payment.id, amount: payment.amount, issuedAt: payment.createdAt, status: "valid" }));
  return { school: { name: "Sekolah Swasta Nasional", tagline: "Tumbuh, belajar, berkarya bersama", address: "Jl. Pendidikan No. 10, Jakarta", email: "halo@sekolahcontoh.test", phone: "+62 21 5550 2026", academicYear: "2026/2027" }, students, invoices, payments, approvals, receipts, classRates: Object.fromEntries(classes.map((name, i) => [name, [850000, 900000, 950000, 875000, 925000][i]])), discounts: [{ id: "disc-demo", label: "Beasiswa Contoh", amount: 150000, className: "VII-A" }], feeTypes: ["SPP Bulanan"], audit: [{ id: "log-demo-1", at: "2026-11-02T08:00:00+07:00", actor: "Sistem Demo", action: "demo_initialized", entityId: "sasapps", detail: "Data fiktif dimuat untuk simulasi." }], contact: { email: students[0].email, phone: students[0].phone } };
}

export function generateMonthlyInvoices(state, period, dueDay = "10") {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error("Periode tidak valid.");
  const existing = new Set(state.invoices.filter(x => x.period === period).map(x => x.studentId));
  const additions = state.students.filter(x => x.status === "Aktif" && !existing.has(x.id)).map(student => {
    const rate = state.classRates?.[student.className] ?? [850000, 900000, 950000, 875000, 925000][Number(student.id.slice(-3)) % 5];
    const discount = (state.discounts || []).filter(x => x.className === student.className).reduce((sum, item) => sum + item.amount, 0);
    const amount = Math.max(0, rate - discount);
    const lines = [{ label: "SPP Bulanan", amount: rate }, ...(discount ? [{ label: "Beasiswa / penyesuaian demo", amount: -discount }] : [])];
    return { id: `inv-${student.id}-${period}`, studentId: student.id, studentName: student.name, nis: student.nis, className: student.className, period, amount, paid: 0, dueDate: `${period}-${String(dueDay).padStart(2, "0")}`, lines, status: "unpaid" };
  });
  return additions.length ? { ...state, invoices: [...state.invoices, ...additions], audit: log(state, "invoice_batch_generated", "batch", `${additions.length} tagihan baru untuk ${period}.`) } : state;
}

export function recordPartialPayment(state, invoiceId, amount, note = "Pembayaran parsial demo") {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Nominal harus lebih dari Rp0.");
  const invoice = state.invoices.find(x => x.id === invoiceId);
  if (!invoice) throw new Error("Tagihan tidak ditemukan.");
  if (amount > balanceOf(invoice)) throw new Error("Nominal melebihi sisa tagihan.");
  const payment = { id: id("pay"), studentId: invoice.studentId, studentName: invoice.studentName, invoiceId, amount, method: "Tunai (simulasi)", createdAt: new Date().toISOString(), status: "verified", note };
  const invoices = state.invoices.map(x => x.id === invoiceId ? { ...x, paid: x.paid + amount, status: statusOf(x.amount, x.paid + amount, x.dueDate) } : x);
  const receipt = { code: `SAS-${payment.id.toUpperCase()}`, paymentId: payment.id, amount: payment.amount, issuedAt: payment.createdAt, status: "valid" };
  const next = { ...state, invoices, payments: [payment, ...state.payments], receipts: [receipt, ...(state.receipts || [])] };
  return { ...next, audit: log(next, "partial_payment_recorded", invoiceId, `Pembayaran parsial ${amount} dicatat sebagai demo.`) };
}

export function submitDemoPayment(state, invoiceId, amount, note = "Pembayaran fiktif menunggu verifikasi") {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Nominal harus lebih dari Rp0.");
  const invoice = state.invoices.find(x => x.id === invoiceId);
  if (!invoice) throw new Error("Tagihan tidak ditemukan.");
  if (amount > balanceOf(invoice)) throw new Error("Nominal melebihi sisa tagihan.");
  const payment = { id: id("pay"), studentId: invoice.studentId, studentName: invoice.studentName, invoiceId, amount, method: "Transfer (simulasi)", createdAt: new Date().toISOString(), status: "pending", note };
  const next = { ...state, payments: [payment, ...state.payments] };
  return { ...next, audit: log(next, "payment_submitted", payment.id, "Pembayaran demo menunggu verifikasi.") };
}

export function decidePayment(state, paymentId, status, reason = "") {
  if (!["verified", "rejected"].includes(status)) throw new Error("Keputusan pembayaran tidak valid.");
  const payment = state.payments.find(x => x.id === paymentId);
  if (!payment || payment.status !== "pending") throw new Error("Pembayaran tidak lagi menunggu verifikasi.");
  let invoices = state.invoices;
  let receipts = state.receipts;
  if (status === "verified") {
    const invoice = invoices.find(x => x.id === payment.invoiceId);
    if (!invoice || payment.amount > balanceOf(invoice)) throw new Error("Sisa tagihan berubah; pembayaran tidak dapat diverifikasi.");
    invoices = invoices.map(x => x.id === payment.invoiceId ? { ...x, paid: x.paid + payment.amount, status: statusOf(x.amount, x.paid + payment.amount, x.dueDate) } : x);
    receipts = [{ code: `SAS-${payment.id.toUpperCase()}`, paymentId, amount: payment.amount, issuedAt: new Date().toISOString(), status: "valid" }, ...receipts];
  }
  const next = { ...state, invoices, receipts, payments: state.payments.map(x => x.id === paymentId ? { ...x, status, decisionReason: reason } : x) };
  return { ...next, audit: log(next, status === "verified" ? "payment_verified" : "payment_rejected", paymentId, reason || "Keputusan simulasi.") };
}

export function requestApproval(state, invoiceId, amount, reason) {
  const invoice = state.invoices.find(x => x.id === invoiceId);
  if (!invoice) throw new Error("Tagihan tidak ditemukan.");
  if (!Number.isSafeInteger(amount) || amount < invoice.paid) throw new Error("Nominal baru tidak boleh lebih kecil dari pembayaran yang sudah tercatat.");
  if (!String(reason).trim()) throw new Error("Alasan perubahan wajib diisi.");
  const due = new Date(`${invoice.dueDate}T12:00:00+07:00`);
  due.setDate(due.getDate() + 5);
  const proposedDueDate = `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, "0")}-${String(due.getDate()).padStart(2, "0")}`;
  const request = { id: id("apr"), type: "Penyesuaian tagihan", entityId: invoiceId, studentName: invoice.studentName, period: invoice.period, before: { amount: invoice.amount, dueDate: invoice.dueDate }, proposed: { amount, dueDate: proposedDueDate }, reason: String(reason).trim(), requestedBy: "TU Demo", status: "pending", acceptedFields: [] };
  const next = { ...state, approvals: [request, ...state.approvals] };
  return { ...next, audit: log(next, "approval_requested", request.id, request.reason) };
}

export function decideApproval(state, requestId, decision, reason = "", acceptedFields = []) {
  const request = state.approvals.find(x => x.id === requestId);
  if (!request || request.status !== "pending") throw new Error("Permintaan tidak lagi menunggu persetujuan.");
  if (!["approve", "reject", "partial"].includes(decision)) throw new Error("Keputusan tidak valid.");
  if (!String(reason).trim()) throw new Error("Alasan keputusan wajib diisi.");
  if (decision === "partial" && !acceptedFields.length) throw new Error("Pilih sedikitnya satu bagian yang disetujui.");
  const accepted = decision === "approve" ? ["amount", "dueDate"] : decision === "partial" ? acceptedFields.filter(x => ["amount", "dueDate"].includes(x)) : [];
  const status = decision === "approve" ? "approved" : decision === "partial" ? "partially_approved" : "rejected";
  const invoices = accepted.length ? state.invoices.map(x => {
    if (x.id !== request.entityId) return x;
    const amount = accepted.includes("amount") ? request.proposed.amount : x.amount;
    const dueDate = accepted.includes("dueDate") ? request.proposed.dueDate : x.dueDate;
    return { ...x, amount, dueDate, status: statusOf(amount, x.paid, dueDate) };
  }) : state.invoices;
  const next = { ...state, invoices, approvals: state.approvals.map(x => x.id === requestId ? { ...x, status, reviewReason: String(reason).trim(), acceptedFields: accepted } : x) };
  return { ...next, audit: log(next, decision === "approve" ? "approval_approved" : decision === "partial" ? "approval_partial" : "approval_rejected", requestId, `${reason.trim()} Bagian disetujui: ${accepted.join(", ") || "tidak ada"}.`) };
}

export function updateContact(state, contact) {
  const email = String(contact.email || "").trim();
  const phone = String(contact.phone || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Masukkan alamat email yang valid.");
  if (!/^[0-9+() .-]{8,20}$/.test(phone)) throw new Error("Nomor kontak tidak valid.");
  return { ...state, contact: { email, phone }, audit: log(state, "student_contact_updated", "stu-001", "Kontak demo diperbarui.") };
}

export function createStudent(state, input) {
  const name = String(input.name || "").trim();
  const nis = String(input.nis || "").trim();
  const className = String(input.className || "").trim();
  if (name.length < 3) throw new Error("Nama siswa minimal 3 karakter.");
  if (!/^\d{6,12}$/.test(nis)) throw new Error("NIS demo harus 6–12 angka.");
  if (state.students.some(x => x.nis === nis)) throw new Error("NIS tersebut sudah digunakan.");
  if (!(state.classes || Object.keys(state.classRates || {})).includes(className)) throw new Error("Pilih kelas yang tersedia.");
  const student = { id: id("stu"), nis, name, className, year: state.school.academicYear || "2026/2027", status: "Aktif", email: `siswa.${nis}@contoh.test`, phone: "080000000000" };
  const next = { ...state, students: [...state.students, student] };
  return { ...next, audit: log(next, "student_created", student.id, `Siswa demo ${name} ditambahkan.`) };
}

export function updateFeeRate(state, className, amount) {
  if (!Object.keys(state.classRates || {}).includes(className)) throw new Error("Kelas tidak ditemukan.");
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 100000000) throw new Error("Tarif harus antara Rp0 dan Rp100.000.000.");
  const next = { ...state, classRates: { ...state.classRates, [className]: amount } };
  return { ...next, audit: log(next, "fee_rate_updated", className, `Tarif SPP demo untuk ${className} diubah menjadi ${amount}.`) };
}

export function addDiscount(state, input) {
  const label = String(input.label || "").trim(); const className = String(input.className || "").trim(); const amount = Number(input.amount);
  if (label.length < 3) throw new Error("Nama beasiswa/penyesuaian wajib diisi.");
  if (!Object.keys(state.classRates || {}).includes(className)) throw new Error("Pilih kelas yang tersedia.");
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > state.classRates[className]) throw new Error("Nominal penyesuaian harus lebih dari Rp0 dan tidak melebihi tarif kelas.");
  const discount = { id: id("disc"), label, className, amount };
  const next = { ...state, discounts: [...(state.discounts || []), discount] };
  return { ...next, audit: log(next, "discount_created", discount.id, `${label} ditambahkan untuk ${className}.`) };
}

export function verifyReceipt(state, code) {
  const receipt = state.receipts.find(x => x.code.toLowerCase() === String(code).trim().toLowerCase());
  return receipt ? { valid: true, status: receipt.status, amount: receipt.amount, receiptNumber: receipt.code, issuedAt: receipt.issuedAt, demo: true } : { valid: false, status: "not_found", demo: true };
}

export function log(state, action, entityId, detail) {
  return [...(state.audit || []), { id: id("log"), at: new Date().toISOString(), actor: "Staf Demo", action, entityId, detail }];
}

export function dashboardTotals(state, period = "2026-11") {
  const invoices = state.invoices.filter(x => x.period === period);
  return { activeStudents: state.students.filter(x => x.status === "Aktif").length, billed: invoices.reduce((n, x) => n + x.amount, 0), verified: invoices.reduce((n, x) => n + x.paid, 0), outstanding: invoices.reduce((n, x) => n + balanceOf(x), 0), pendingPayments: state.payments.filter(x => x.status === "pending").length, pendingApprovals: state.approvals.filter(x => x.status === "pending").length };
}

export function exportRows(state) {
  return state.invoices.map(x => ({ nis: x.nis, siswa: x.studentName, kelas: x.className, periode: formatPeriod(x.period), tagihan_idr: x.amount, terbayar_idr: x.paid, sisa_idr: balanceOf(x), status: x.status, jatuh_tempo: x.dueDate }));
}

export function safeReceiptSummary(state, code) {
  const result = verifyReceipt(state, code);
  return result.valid ? { valid: true, status: result.status, amount: result.amount, receiptNumber: result.receiptNumber, issuedAt: result.issuedAt, demo: true } : { valid: false, status: "not_found", demo: true };
}

export function periodLabel(period) { return formatPeriod(period); }

