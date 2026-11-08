# SASapps — PRD Draft v0.1
**Tanggal:** 2026-11-02  
**Status:** Discovery → PRD draft. Tidak untuk produksi.  
**Nama sekolah sementara:** Sekolah Swasta Nasional  

## 1. Problem & tujuan
Sekolah membutuhkan website profil publik, portal siswa, modul administrasi Tata Usaha (TU), serta transparansi tagihan dan pembayaran bulanan. Solusi versi awal mengutamakan satu kampus dengan arsitektur yang bisa berkembang ke multi-jenjang/multi-kampus.

## 2. Sumber & tingkat kepastian
Berdasarkan formulir discovery 42 pertanyaan yang disampaikan pemilik proyek pada 2026-11-02. Banyak jawaban masih memakai rekomendasi default, **belum persetujuan final pihak sekolah**.

Dinyatakan eksplisit:
- Satu kampus.
- Estimasi kerja: ~500 siswa, 2 TU, 2 admin (perlu validasi).
- Brand/logo/foto sementara, nanti bisa diubah dari Admin.
- Perubahan tertentu perlu alur pengajuan → tinjau perubahan → approve/reject seluruh/sebagian.
- Kuitansi digital dengan QR untuk verifikasi status persetujuan.
- Database Supabase, hosting Vercel, source GitHub.
- Belum ada target biaya, tanggal go-live, dan domain.

## 3. MVP
### Website publik
Home, profil sekolah, visi & misi, fasilitas, berita/pengumuman, kontak. CMS sederhana TU/Admin; upload brand melalui Admin setelah storage dan authorization siap.

### Portal siswa
Login (email atau NIS via server-side lookup aman), profil (read mostly), kelas/tahun ajaran, rincian invoice, pembayaran parsial, riwayat, kuitansi terverifikasi.

### Tata Usaha
Manajemen siswa, kelas, academic year, fee types/rates, beasiswa/discount, generate invoice bulanan & massal, input pembayaran manual, lampiran bukti, antrean verifikasi, laporan per hari/bulan/siswa/kelas/metode, export CSV/XLSX.

### Super Admin
Kelola identitas sekolah & branding, hak akses staf, audit trail, aturan approval. Perubahan transaksi/fee tidak pernah langsung overwrite tanpa histori.

## 4. Roles & RBAC
- **Siswa:** hanya data sendiri, invoice sendiri, pembayaran & kuitansi sendiri; tidak mengubah nominal/status.
- **TU:** kelola data siswa dan tagihan sesuai scope; input payment pending; mengajukan adjustment/void dan perubahan sensitif; lihat laporan; **tidak final approve permintaan sendiri**.
- **Super Admin:** review diff before/after dan approve/reject seluruh/sebagian; kelola konfigurasi dan permission; akses audit.
- 2FA untuk TU/Admin sebelum go-live, reset password audited.
- Parent/Guru/Kepala Sekolah: Phase 2 bila disetujui.

## 5. Siklus invoice dan payment
1. Master tarif berdasarkan tahun ajaran/kelas/jenis biaya; override per siswa boleh dengan alasan.
2. Scheduler/batch membuat invoice per bulan, hindari duplikasi per siswa+periode+jenis.
3. Invoice mendukung lines, adjustment, due date, outstanding.
4. Input payment (manual) → pending_verification → verified/rejected, dengan bukti jika ada.
5. Partial payment melalui allocation terhadap invoice, tidak boleh double-allocate / overpay.
6. Kuitansi hanya setelah confirmed verification, nomor unik, QR menuju endpoint verifikasi terbatas (tanpa membuka PII).
7. Void/reversal menggunakan catatan pembatalan, bukan hapus permanen; audit immutable.
8. Approval: request diff dan reason, boleh partial accept jika keputusan dibuat per-field/per-item, wajib conflict check bila data berubah saat review.

## 6. Acceptance criteria awal
- Tidak ada siswa dapat membaca data siswa lain (RLS isolation).
- Tidak ada client publik dapat menulis status pembayaran/approval.
- TU tidak bisa mengesahkan transaksi buatannya jika aturan dual control berlaku.
- Semua perubahan uang memiliki actor, waktu, alasan, nilai before/after, idempotency/reference.
- Kuitansi tidak muncul sebelum verified; QR mengecek status live melalui backend.
- Data import Excel memvalidasi duplikat NIS dan mengeluarkan error row per row.
- Laporan merekonsiliasi invoice balance dan alokasi payment.
- Backend menolak overpayment, duplicate invoice, revoked auth, and stale approvals.
- Tidak ada data nyata tanpa persetujuan sekolah, pemberitahuan privasi, retention policy, dan backup/restore test.

## 7. Non-functional & compliance
- Indonesia / IDR / Asia/Jakarta, locale id-ID.
- Data pribadi siswa termasuk anak: data minimization, least privilege, encrypted transport, storage private, signed URLs, access logs, backup, retention & consent basis.
- Secrets service role hanya di server, bukan NEXT_PUBLIC / client.
- RLS di semua tabel exposed; security checks di server (bukan hanya UI).
- Timezone timestamps disimpan UTC (timestamptz), ditampilkan WIB.
- Responsif mobile untuk siswa dan desktop untuk TU.
- Mekanisme edit/approval memerlukan transaction boundaries dan penguncian optimistik.

## 8. Architecture target
- Frontend: Next.js / React (rencana), deployed to Vercel.
- Database/Auth/Storage: dedicated Supabase project **SASapps**, bukan project aplikasi lain.
- API: server endpoints Next.js/Vercel Functions, user JWT verified; service role jika diperlukan tetap server-only.
- SQL schema awal: `supabase/schema-draft.sql`, **belum applied**.
- Prototype saat ini: static HTML + simulated data, **tanpa login nyata**.
- Separate GitHub repository `adith92/SASapps` disarankan sebelum production; source sementara tersimpan di `adith92/docs/projects/SASapps/`.

## 9. Not in MVP
PPDB, presensi, akademik/nilai, student-parent portal, WhatsApp API, payment gateway VA/QRIS, integrasi akuntansi. Phase 2 setelah scope disetujui.

## 10. Open questions (blocker produksi)
- Jenjang sekolah yang sebenarnya dan kode kelas/tahun ajaran.
- Tarif SPP, tanggal jatuh tempo, aturan denda, diskon, dan siapa approver.
- Nomor identitas siswa untuk login, cara mengundang siswa tanpa email, recovery policy.
- Persetujuan notifikasi kepada orang tua dan basis legal pengolahan data.
- Payment flow: bank account sekolah, bukti transfer, reconciliation cut-off, receipt format.
- Ambang nominal dan daftar field yang butuh approval; arti 'approve sebagian'.
- Logo/foto/telepon/alamat/domain resmi; wewenang pengedit konten.
- SLA backup, retention, target go-live, anggaran, dan orang yang menandatangani UAT.

## 11. Implementation checklist
1. Konfirmasi organisasi Supabase yang boleh dipakai dan quota/cost.
2. Provision project dedicated di region terdekat yang disetujui.
3. Review schema & security then apply migration; check advisors & RLS.
4. Build Next.js auth/session & protected routes; provision first Super Admin securely.
5. Build student portal and TU billing with server-side validation and tests.
6. Implement approval & QR receipt verification safely.
7. Configure Vercel production + preview env and private GitHub repo linkage.
8. Test E2E / reconcile / permissions / restore before inviting real users.

**Catatan:** Draft ini baseline teknis, bukan persetujuan final atau SLA proyek.