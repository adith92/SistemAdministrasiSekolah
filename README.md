# SaSappSekolah

**SaSappSekolah** adalah proyek pengembangan **Sistem Administrasi Sekolah (SASapps)**, sebuah aplikasi web berbahasa Indonesia untuk profil sekolah, layanan siswa, Tata Usaha (TU), serta pengelolaan administrasi dan keuangan sekolah.

> **Status: demo publik / prototipe.** Seluruh nama siswa, tagihan, pembayaran, bukti transaksi, kuitansi, dan permintaan persetujuan di aplikasi saat ini adalah **data fiktif**. Versi ini **belum boleh dipakai untuk administrasi atau transaksi sekolah yang sesungguhnya**.

**Website demo:** https://sasappsekolah.onrender.com  
**Hosting:** Render (Node.js Web Service, region Singapore)  
**Repository utama proyek:** https://github.com/adith92/SistemAdministrasiSekolah

## Apa yang tersedia?

Versi interaktif saat ini menyediakan:

- Website sekolah: Beranda, Tentang, Visi & Misi, Fasilitas, Berita, dan Kontak.
- Portal simulasi **Siswa**, **Tata Usaha**, dan **Super Admin**, dengan pergantian tampilan peran.
- Dataset simulasi siswa, kelas, dan komponen biaya sekolah.
- Simulasi tagihan bulanan/SPP, pembayaran bertahap, dan persetujuan administrasi.
- Riwayat aktivitas, kuitansi, verifikasi demo, laporan, dan ekspor data simulasi.
- Tampilan responsif untuk perangkat desktop dan seluler.

**Penting:** pergantian peran pada demo bukan sistem autentikasi atau pembatasan hak akses. Tidak ada akun atau password untuk mengakses demo publik. Data simulasi yang diubah hanya tersimpan di `localStorage` browser masing-masing, tidak menjadi transaksi server dan tidak tersinkron lintas perangkat.

## Menjalankan aplikasi

Persyaratan: **Node.js 20+** dan npm.

```bash
git clone https://github.com/adith92/SistemAdministrasiSekolah.git
cd SistemAdministrasiSekolah
npm ci
npm start
```

Buka `http://localhost:10000`. Untuk mengganti port:

```bash
PORT=3000 npm start
```

Perintah `npm start` menjalankan `public-server.mjs` **tanpa password**. Server menyediakan file di `dist/`, `GET /health`, dan `GET /api/status`. API demo bersifat baca-saja: metode penulisan ke server ditolak. Tidak perlu mengisi `DATABASE_URL` untuk menjalankan versi publik.

Jalankan pengujian yang tersedia dengan:

```bash
npm test
```

## Struktur repository

| Lokasi | Fungsi |
| --- | --- |
| `dist/` | HTML, CSS, JavaScript, dan favicon antarmuka demo interaktif |
| `public-server.mjs` | **Server utama publik**: tanpa login dan tanpa penulisan ke database |
| `package.json`, `package-lock.json` | Konfigurasi npm dan dependensi |
| `tests/` | Unit test logika dan pengujian server legacy |
| `docs/` | PRD, spesifikasi, arsitektur, model data, hasil QA, dan catatan deployment |
| `tasks/` | Rencana dan daftar pekerjaan |
| `supabase/schema-draft.sql` | Rancangan awal database sekolah, **belum diterapkan** |
| `schema.sql`, `server.mjs` | Kode demonstrasi Render terdahulu dengan PostgreSQL dan autentikasi demo; **bukan** server publik default |
| `legacy-preview/index.html` | Prototipe halaman sekolah generasi awal |

## Arsitektur dan status database

**Yang sudah ada:** frontend browser, server Node.js di Render, API kesehatan sederhana, dan logika simulasi sekolah. Proses utama memakai `public-server.mjs`, bukan `server.mjs`.

**Yang belum ada pada deployment publik:** database PostgreSQL terhubung, akun siswa/TU/admin sungguhan, otorisasi per pengguna di server, tabel administrasi produksi, unggah bukti pembayaran yang aman, transaksi keuangan persisten, backup dan recovery teruji, serta pengamanan data pribadi siswa.

Rancangan awal untuk penyimpanan data sekolah terdapat pada `supabase/schema-draft.sql`. Nama direktori `supabase/` menunjukkan asal rancangan, **bukan** bukti bahwa proyek publik menggunakan Supabase atau telah terkoneksi ke database. Jika arsitektur akhir adalah **Full Render**, rancangan harus direview dan dimigrasikan dengan aman ke Render PostgreSQL.

### Catatan keamanan

- Jangan memasukkan **nama, NIS, kontak, pembayaran, atau dokumen siswa asli** ke demo publik.
- Jangan commit `.env`, password, token, atau connection string database.
- Admin/TU/Siswa pada demo **bukan** role yang diamankan server. Untuk produksi perlu autentikasi aman, role-based access control, audit log, dan pembatasan transaksi.
- Keputusan produk **tanpa password** saat ini diterapkan pada **akses demo publik**, bukan izin untuk mengekspos data administrasi asli tanpa proteksi.
- PostgreSQL gratis dan Web Service gratis tidak ditujukan untuk penyimpanan permanen atau uptime produksi tanpa perencanaan backup, batasan, dan upgrade.

## Deployment Render

- **Live:** https://sasappsekolah.onrender.com
- **Dashboard:** https://dashboard.render.com/web/srv-dbkqdih5efls73fca5rg
- **Build command untuk repo baru:** `npm ci --omit=dev`
- **Start command untuk repo baru:** `npm start`
- **Health check:** `/health`
- **Region:** Singapore

**Perhatian saat migrasi:** deployment Render yang sudah berjalan dibuat sebelumnya dari `adith92/docs`, subfolder `projects/SASapps/sites-demo`. Pemindahan isi GitHub ke repository ini **tidak otomatis mengubah source repository milik service Render**. Hubungkan ulang Render ke repo ini melalui pengaturan atau buat service baru yang menunjuk ke repo baru agar deployment berikutnya memakai sumber utama ini.

## Roadmap pengembangan

1. **MVP aman:** basis data relasional, migrasi skema, autentikasi siswa/TU/admin, pembatasan akses, serta profil sekolah yang dapat diedit secara terotorisasi.
2. **Keuangan sekolah:** tarif per kelas/tahun ajaran, tagihan SPP dan non-SPP, pembayaran sebagian, upload bukti transfer, validasi TU, dan alur persetujuan Admin.
3. **Operasional:** laporan, ekspor, audit log permanen, kuitansi bernomor dan verifikasi QR.
4. **Tahap lanjut:** PPDB, portal orang tua, kehadiran, nilai, integrasi notifikasi dan payment gateway.

Lihat [PRD](docs/PRD-v0.1.md), [benchmark open-source](docs/opensource-benchmark.md), dan [spesifikasi aplikasi](docs/spec.md) untuk detail. Perkiraan kapasitas siswa dan alur kerja masih perlu validasi dengan sekolah sebelum pemakaian produksi.

## Riwayat pemindahan

Repository ini kini menjadi tempat utama seluruh source SASapps. Sebelumnya kode dikembangkan di folder `projects/SASapps` pada repository privat `adith92/docs`. File proyek lama di repository tujuan pada branch `main` diganti dengan kode SASapps. **Riwayat commit Git sebelumnya tetap ada**, karena penggantian file di working tree bukan penghapusan seluruh riwayat repository.

## Lisensi

Belum ada lisensi open-source yang dinyatakan secara eksplisit. Jangan menganggap kode bebas digunakan atau didistribusikan ulang tanpa izin pemilik.
