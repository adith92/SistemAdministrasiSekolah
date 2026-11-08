# SASapps
School Administration System (working title) — Sekolah Swasta Nasional

## SaSappSekolah on Render (public preview)
- **URL:** https://sasappsekolah.onrender.com
- **Service:** SaSappSekolah, Node.js Free, Singapore, login/password not required
- **Demo-only:** all students/invoices/approvals are fictional and changes stay in each browser localStorage
- **Backend:** Render Node.js serves UI and health API; live PostgreSQL application integration is NOT enabled for this public preview
- **Deployment notes:** [sasappsekolah-public-render.md](sites-demo/docs/sasappsekolah-public-render.md)
- **Safety:** never upload real student or payment details to the public demo

## Status
- **Prototype frontend:** https://sasapps-adith92.vercel.app
- **GitHub backup:** `adith92/docs/projects/SASapps/` (sementara; bukan repository mandiri)
- **Vercel project:** `sasapps`
- **Supabase:** belum diprovision; project `NgajiYuk` tidak disentuh
- **Production readiness:** NOT READY. Semua data di frontend adalah simulasi.

## Fitur target
Website sekolah publik, login Siswa/TU/Super Admin, profil siswa, SPP dan tagihan bulanan, pembayaran manual/parsial, antrean approval, kuitansi QR yang dapat diverifikasi, laporan dan audit.

## Dokumen
- [PRD draft v0.1](docs/PRD-v0.1.md)
- [Research benchmark aplikasi sejenis](docs/opensource-benchmark.md)
- [Rancangan skema database dan RLS (belum diaplikasikan)](supabase/schema-draft.sql)

## Deployment
Frontend saat ini single-file static HTML `index.html`; pada fase implementasi akan dimigrasikan ke Next.js/React dan Supabase dedicated project. Jangan mengaktifkan akun riil, memasukkan data pribadi siswa, atau menganggap angka demo sebagai bukti keuangan.

## Anti-pattern yang harus dihindari
- Mencampur database SASapps dengan project Supabase lain.
- Meletakkan secret `service_role` di frontend/browser/public GitHub.
- Mempercayai role yang dikirim oleh browser.
- Kuitansi QR yang hanya menampilkan nomor tanpa verifikasi state server.
- Mengubah/men-delete payment tanpa audit, approval dan reversal.
