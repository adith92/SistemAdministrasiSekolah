# Benchmark OSS Sekolah — 2026-11-02

Tujuan: referensi produk yang sudah memiliki implementasi nyata. Popularitas GitHub bukan sama dengan jumlah instalasi aktif sekolah; jumlah unduhan aplikasi tidak tersedia secara konsisten.

| Repo | Popularitas indikatif | Fokus | Aktivitas terkini | Kecocokan SASapps |
|---|---:|---|---|---|
| https://github.com/francoisjacquet/rosariosis | ~643 stars, ~388 forks | SIS, student billing, balances, reporting | v12.9.4 September 2026; maintenance/security | **Terbaik untuk benchmarking tagihan & transaksi** |
| https://github.com/frappe/education | ~680 stars, ~470 forks | Student portal, fees, admission, academic management | v16.1.0 Juni 2026; commit Okt 2026 | **Terbaik untuk ERP sekolah end-to-end** |
| https://github.com/yungifez/skuul | ~465 stars, ~163 forks | Multi-school, fees, family portal, reports | V3 masih development; ada peringatan migrasi V2→V3 bisa menyebabkan kehilangan data (wajib audit backup/recovery) | **Referensi UX/modular saja; bukan rekomendasi install produksi tanpa pengujian** |
| https://github.com/GibbonEdu/core | ~637 stars (indeks 2026) | Full school management | rilis berkala hingga 2026 | Bagus untuk benchmark administrasi / academic workflows |
| https://github.com/OS4ED/openSIS-Classic | ~339 stars, ~283 forks | SIS matang, attendance/grades/import | community edition v9.3 2026 | Bagus untuk import master siswa & peran staf |

## Teknik & lisensi
- RosarioSIS: PHP, PostgreSQL, GPL-2.0.
- Frappe Education: Python/Frappe/ERPNext, cek lisensi dan dependensi tepat sebelum reuse.
- Skuul: Laravel/PHP, MIT.
- Gibbon: PHP/MySQL, GPL-3.0.
- openSIS-Classic: PHP/MySQL, GPL.
**Tidak ada yang langsung menjadi Next.js + Supabase drop-in**.

## Rekomendasi
Bangun SASapps native sesuai kebutuhan Indonesia dengan stack Vercel + Supabase, tetapi gunakan RosarioSIS sebagai **functional reference** untuk billing & receipt, Frappe Education untuk student portal dan fee structure, Skuul untuk student/master/report workflows. Audit kode, lisensi, security advisories, migrasi, dan test sebelum mengadopsi kode mereka. Tidak ada klaim angka download/instalasi bila tidak dapat diverifikasi.

## Bukti yang di-review
- https://github.com/francoisjacquet/rosariosis/releases
- https://github.com/frappe/education/releases
- https://github.com/yungifez/skuul
- https://github.com/GibbonEdu/core/releases
- https://github.com/OS4ED/openSIS-Classic

## Peringatan khusus Skuul
README branch main pada November 2026 menyebut V3 development, V2 deprecated, dan migrasi lama dapat menghapus data akademik (tanpa otomatis mengonversi seluruh histori). Jangan mengikuti migrasi ini pada sistem live; gunakan hanya sebagai referensi desain sambil menilai tag release yang stabil. Sumber: https://github.com/yungifez/skuul
