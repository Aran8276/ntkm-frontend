# Spesifikasi Halaman Admin Panel — Platform UMKM × Toko Ritel

Nov 4, 2026 · @Aran aran

Dokumen ini memetakan setiap halaman admin panel (A01–A25), isi tiap section, dan endpoint yang dipanggil, mengikuti Spesifikasi Admin.

## Konvensi umum admin panel

Admin panel adalah aplikasi web desktop-first (lebar minimal 1024 px, tetap bisa dipakai di tablet landscape) yang memanggil `/api/v1/admin/*`. Disarankan dilayani di subdomain terpisah (`admin.<domain>`) agar sesi admin tidak bercampur dengan sesi PWA pengguna. Bahasa UI: Bahasa Indonesia dengan sapaan "Anda".

### Guard akses (dicek berurutan di setiap halaman kecuali A01)

1. Tidak ada token → arahkan ke `/admin/masuk?next=<route asal>`.
2. `GET /me` mengembalikan `is_admin: false` → hapus token, arahkan ke A01 dengan pesan "Akun ini tidak memiliki akses admin."
3. API menjawab `403 account_suspended` → hapus token, arahkan ke A01 dengan pesan "Akun Anda dinonaktifkan."
4. Halaman khusus superadmin (A24) dibuka oleh `staff` → A25 varian "Akses tidak tersedia". Tombol aksi khusus superadmin (hapus permanen, ubah akses admin) tidak dirender untuk `staff`.
5. Admin yang sudah login membuka A01 → arahkan ke A02.

### Sesi

- Token disimpan dengan kunci khusus admin (mis. `admin_access`, `admin_refresh`), terpisah dari PWA.
- 401 → `POST /auth/token/refresh` sekali, ulangi request; gagal → A01 dengan toast "Sesi berakhir, silakan masuk lagi."
- Logout otomatis setelah 30 menit tanpa aktivitas (klik/ketik), didahului banner hitung mundur 60 detik dengan tombol "Tetap masuk".
- `GET /me` dipanggil saat panel dibuka; `admin_role` disimpan di state global untuk menyembunyikan aksi superadmin.

### Format tampilan

Sama dengan aplikasi pengguna (Rp12.500, 3,6 km, Senin, 08.00–10.00), dengan perbedaan berikut:

| Data | Tampilan di admin |
| --- | --- |
| Tanggal + jam | Selalu absolut "4 Nov 2026, 15.30"; waktu relatif ("2 jam lalu") muncul sebagai tooltip |
| ID (UUID) | 8 karakter pertama dengan font monospace + tombol salin ID lengkap |
| Nilai kosong (`null`) | "—" |
| Boolean | Ikon centang / silang, bukan teks |
| Email & telepon | Bisa diklik (`mailto:`, `https://wa.me/62…`) |
| Perubahan (`changes`) | Nilai sebelum dicoret merah, sesudah hijau |
| Objek terhapus | Teks abu-abu + chip "Dihapus" + tanggal hapus |

### Pemetaan error API ke UI

| `error.code` | Perilaku UI |
| --- | --- |
| `validation_error` (400) | Pesan `details.<field>` di bawah input; pesan tanpa field di kotak merah atas form/modal; scroll ke error pertama |
| `unauthenticated` (401) | Refresh otomatis (lihat Sesi) |
| `account_suspended` (403) | Logout + A01 dengan pesan |
| `permission_denied` (403) | Jalankan ulang guard; masih gagal → A25 "Akses tidak tersedia" |
| `superadmin_required` (403) | Toast "Hanya superadmin yang bisa melakukan aksi ini." |
| `not_found` (404) | A25 "Data tidak ditemukan" dengan tombol kembali ke daftar asal |
| `has_active_relations` (409) | Modal "Tidak bisa dilanjutkan" berisi `error.message` + daftar ID dari `details` sebagai tautan ke A16 |
| `conflict` (409) | Modal berisi `error.message`; bila ada `details.allowed`, tampilkan daftar pilihan yang diizinkan; tombol "Muat ulang" mengambil ulang data |
| `rate_limited` (429) | Toast "Terlalu banyak permintaan. Coba lagi sebentar lagi." |
| Gagal jaringan / 5xx | Banner merah "Gagal memuat data" + "Coba lagi"; isian form/modal tidak hilang |

### State standar

- Loading: tabel menampilkan 10 baris skeleton; detail menampilkan skeleton per kartu.
- Kosong tanpa filter: teks per halaman (disebut di bawah) + tombol buat bila ada.
- Kosong dengan filter: "Tidak ada data yang cocok dengan filter." + tombol "Hapus semua filter".
- Data terhapus dibuka langsung lewat URL: halaman detail tetap tampil (admin bisa memulihkan) dengan banner abu-abu "Data ini dihapus pada \<deleted\_at> oleh \<deleted\_by>."

### Pola interaksi

- Tidak ada pembaruan optimistis: UI baru berubah setelah API berhasil, lalu toast sukses dan data diambil ulang.
- Semua aksi yang mewajibkan `admin_reason` memakai Modal aksi berisiko (lihat Komponen global).
- Form dengan perubahan belum disimpan memicu dialog "Tinggalkan halaman? Perubahan belum disimpan." saat pindah halaman.
- Pintasan keyboard: `/` fokus ke kolom cari, `Esc` menutup modal/panel, `Enter` di modal menjalankan tombol utama hanya bila semua field wajib terisi.
- Setiap tautan ke objek lain (toko, UMKM, pengajuan) membuka halaman detailnya; Ctrl/Cmd+klik membuka di tab baru.

## Peta halaman

Admin panel terdiri dari 25 halaman (A01–A25). Setiap halaman daftar punya halaman detail, dan setiap detail punya form ubah, kecuali yang disebut hanya-baca.

&#91;embedded content: navigasi admin · 4 grup sidebar\]

Setiap baris dibaca kiri ke kanan: daftar → detail → form. Daftar Pengguna, Toko, dan UMKM semuanya membuka A04; Pengajuan dan Stok sama-sama membuka A16.

| Kode | Halaman | Route | Akses |
| --- | --- | --- | --- |
| A01 | Masuk admin | `/admin/masuk` | Publik |
| A02 | Dashboard | `/admin` | Admin |
| A03 | Pengguna | `/admin/pengguna` | Admin |
| A04 | Detail pengguna (tab Akun, Profil toko, Profil UMKM, Kerja sama, Aktivitas) | `/admin/pengguna/:id?tab=akun\|toko\|umkm\|kerja-sama\|aktivitas` | Admin |
| A05 | Undang / ubah pengguna | Modal di A03 dan A04 | Admin |
| A06 | Toko | `/admin/toko` | Admin |
| A07 | UMKM | `/admin/umkm` | Admin |
| A08 | Form profil toko / UMKM | `/admin/toko/baru`, `/admin/toko/:id/ubah`, `/admin/umkm/baru`, `/admin/umkm/:id/ubah` | Admin |
| A09 | Peluang | `/admin/peluang` | Admin |
| A10 | Detail peluang | `/admin/peluang/:id` | Admin |
| A11 | Form peluang | `/admin/peluang/baru`, `/admin/peluang/:id/ubah` | Admin |
| A12 | Produk | `/admin/produk` | Admin |
| A13 | Detail produk | `/admin/produk/:id` | Admin |
| A14 | Form produk | `/admin/produk/baru`, `/admin/produk/:id/ubah` | Admin |
| A15 | Pengajuan | `/admin/pengajuan` | Admin |
| A16 | Detail pengajuan | `/admin/pengajuan/:id` | Admin |
| A17 | Stok | `/admin/stok` | Admin |
| A18 | Verifikasi legalitas | `/admin/verifikasi?status=pending&umkm=<id>` | Admin |
| A19 | Kategori | `/admin/kategori` | Admin |
| A20 | File | `/admin/file?id=<file id>` | Admin |
| A21 | Notifikasi & pengumuman | `/admin/notifikasi?tab=log\|pengumuman` | Admin |
| A22 | Audit log | `/admin/audit?id=<log id>` | Admin (hanya-baca) |
| A23 | Ekspor | `/admin/ekspor` | Admin |
| A24 | Admin & akses | `/admin/admin` | Superadmin |
| A25 | Halaman sistem (tidak ditemukan, akses tidak tersedia, kesalahan server, offline) | `*` | Semua |

Route pintas: `/admin/toko/:id` dan `/admin/umkm/:id` mengarahkan ke `/admin/pengguna/<owner id>?tab=toko` atau `?tab=umkm`, sehingga tautan dari mana pun ke profil selalu berakhir di A04. Parameter `?id=` di A20 dan A22 membuka panel samping objek itu langsung.

Sidebar (urutan tetap):

| Grup | Menu |
| --- | --- |
| Ringkasan | Dashboard (A02) |
| Pengguna | Pengguna (A03) · Toko (A06) · UMKM (A07) · Verifikasi legalitas (A18, badge jumlah menunggu) |
| Kerja sama | Peluang (A09) · Produk (A12) · Pengajuan (A15, badge jumlah menunggu > 48 jam) · Stok (A17) |
| Sistem | Kategori (A19) · File (A20) · Notifikasi (A21, badge email gagal 24 jam) · Audit log (A22) · Ekspor (A23) · Admin & akses (A24, hanya superadmin) |

## Komponen global

Komponen ini dipakai di hampir semua halaman admin; halaman di bawah cukup menyebut isinya (kolom, filter, field), bukan perilakunya lagi.

### Layout

| Komponen | Isi |
| --- | --- |
| Sidebar | Lebar 240 px, bisa diciutkan jadi ikon saja (pilihan disimpan di perangkat). Grup dan menu sesuai Peta halaman; menu aktif disorot; badge angka diambil dari `GET /admin/dashboard` (`attention`) dan `GET /admin/legal-verifications` (`count`), diperbarui tiap 5 menit |
| Top bar | Breadcrumb (mis. "Pengguna / Siti Aminah"), judul halaman, nama admin + chip level (Superadmin/Staff), tombol "Keluar" → dialog konfirmasi → `POST /auth/logout` → A01 |
| Area konten | Lebar maksimal 1440 px; halaman detail memakai dua kolom (kiri 2/3 data, kanan 1/3 kartu aksi & riwayat admin) |

### Tabel data

| Bagian | Perilaku |
| --- | --- |
| Toolbar | Kiri: kolom cari (placeholder per halaman, debounce 400 ms → `search`). Kanan: tombol "Ekspor CSV" (memakai filter aktif → `GET /admin/exports/{resource}.csv`), tombol buat (bila ada) |
| Bar filter | Dropdown per filter; filter aktif tampil sebagai chip "Status: Aktif ×"; tombol "Hapus semua filter"; toggle "Tampilkan yang dihapus" → `include_deleted=true` |
| Header | Kolom yang bisa diurutkan menampilkan panah; klik → `ordering=<field>` / `-<field>` |
| Baris | Klik di mana pun (kecuali menu ⋯) → halaman detail. Baris terhapus abu-abu + chip "Dihapus". Menu ⋯ di kolom terakhir berisi aksi baris per halaman |
| Paginasi | "Menampilkan 1–25 dari 142", nomor halaman, pilihan 25 / 50 / 100 per halaman (`page_size`) |
| URL | `search`, filter, `ordering`, `page`, `page_size` selalu tercermin di query string |

### Pemilih entitas

Combobox pencarian untuk memilih akun, toko, UMKM, peluang, atau produk. Mengetik ≥ 2 karakter memanggil list endpoint terkait dengan `search=<teks>&page_size=10`. Tiap opsi: nama + baris kedua (email pemilik, nama toko, atau nama usaha). Dipakai sebagai filter tabel dan sebagai field form. Bila sebuah form hanya menerima entitas tertentu (mis. akun yang belum punya profil toko), opsi yang tidak memenuhi tetap tampil tetapi nonaktif dengan keterangan alasannya.

### Modal aksi berisiko

Dipakai untuk semua aksi yang mewajibkan `admin_reason`.

| Bagian | Isi |
| --- | --- |
| Judul | Pertanyaan berisi aksi + objek, mis. "Suspend akun Siti Aminah?" |
| Dampak | 1–4 poin dampak yang ditentukan per aksi di halaman masing-masing |
| Field tambahan | Bila aksi butuh data lain (mis. `valid_until`, jumlah diterima) |
| Alasan | Textarea wajib dengan penghitung "0/500", minimal 5 karakter → `admin_reason` |
| Beri tahu pengguna | Checkbox default tercentang → `notify_user`; disembunyikan untuk aksi yang tidak memberi notifikasi |
| Konfirmasi ketik | Khusus hapus permanen: input "Ketik \<nama atau 8 karakter ID> untuk konfirmasi" |
| Tombol | "Batal" dan tombol utama berlabel aksi (merah untuk hapus/suspend/tolak, biru untuk lainnya); nonaktif sampai field wajib valid |

### Panel samping

Drawer kanan 480 px untuk melihat detail tanpa meninggalkan daftar (A20, A21, A22). Membuka panel menambah `?id=` ke URL; `Esc` menutupnya.

### Kartu riwayat admin

Tampil di kolom kanan halaman detail. Data: `GET /admin/audit-logs?target_type=<jenis>&target_id=<id>&page_size=5`. Tiap baris: label aksi, nama admin, alasan (dipotong 1 baris), waktu. Tombol "Lihat semua" → A22 dengan filter objek ini. Kosong: "Belum ada tindakan admin pada data ini."

### Chip & label khusus admin

Chip status kerja sama, keputusan produk, status peluang, stok, dan badge kecocokan sama dengan aplikasi pengguna. Tambahan:

| Komponen | Nilai API → label | Warna |
| --- | --- | --- |
| Status akun | `invited` Diundang · `active` Aktif · `suspended` Disuspend | Biru, hijau, merah |
| Level admin | `superadmin` Superadmin · `staff` Staff | Ungu, abu |
| Status verifikasi | `unverified` Belum diisi · `pending` Menunggu · `verified` Terverifikasi · `rejected` Ditolak | Abu, kuning, hijau, merah |
| Status email | `pending` Menunggu · `sent` Terkirim · `failed` Gagal · `skipped` Tanpa email | Abu, hijau, merah, abu |
| Penanda override | Ikon perisai + "Admin" pada event `is_admin_override` | Kuning |
| Pembuat data | "Dibuat oleh toko/UMKM" atau "Dibuat oleh admin" (dari `created_by.is_admin`) | Abu, ungu |

Label `AdminAuditLog.action`:

| Nilai | Label | Nilai | Label |
| --- | --- | --- | --- |
| `create` | Dibuat | `close` | Ditutup |
| `update` | Diubah | `reopen` | Dibuka ulang |
| `delete` | Dihapus | `force_status` | Status diubah paksa |
| `restore` | Dipulihkan | `stock_correction` | Stok dikoreksi |
| `hard_delete` | Dihapus permanen | `verify_legal` | Legalitas diputuskan |
| `invite` | Diundang | `remove_file` | File dihapus |
| `suspend` | Disuspend | `resend_email` | Email dikirim ulang |
| `activate` | Diaktifkan | `broadcast` | Pengumuman dikirim |
| `grant_admin` | Diangkat admin | `export` | Data diekspor |
| `revoke_admin` | Akses admin dicabut |  |  |

### Komponen lain

- Kartu statistik: angka besar, label, dan tautan ke daftar terfilter (A02).
- Penampil dokumen: gambar dengan zoom & putar, PDF dalam viewer tersemat, tombol "Buka di tab baru" (A04, A18, A20).
- Peta lokasi: Leaflet hanya-baca di detail, pemilih lokasi (pin bisa digeser) di A08.
- Toast: sukses (hijau), gagal (merah), info; hilang otomatis 5 detik; toast gagal tetap sampai ditutup.

## Masuk & dashboard

### A01 · Masuk admin (`/admin/masuk`)

Tujuan: login admin dengan Google dan menolak akun non-admin. Query opsional: `next` (route tujuan) dan `reason` (`not_admin`, `suspended`, `expired`, `idle`) untuk menampilkan pesan.

| Section | Isi |
| --- | --- |
| Kepala | Logo, judul "Panel Admin", teks "Khusus pengelola platform." |
| Pesan kondisi | Kotak sesuai `reason`: `not_admin` "Akun ini tidak memiliki akses admin." · `suspended` "Akun Anda dinonaktifkan." · `expired` "Sesi berakhir, silakan masuk lagi." · `idle` "Anda keluar otomatis karena tidak ada aktivitas selama 30 menit." |
| Tombol login | Tombol resmi "Masuk dengan Google"; spinner "Sedang masuk…" selama request |
| Kaki | Tautan "Buka aplikasi pengguna" ke PWA |

Alur: `id_token` Google → `POST /auth/google` → simpan token admin → `GET /me` → bila `is_admin` true: ke `next` atau A02; bila false: hapus token, tampilkan pesan `not_admin`. Error 401 → "Gagal masuk dengan Google. Coba lagi."

### A02 · Dashboard (`/admin`)

Tujuan: menunjukkan kondisi pilot dan hal yang perlu ditindaklanjuti hari ini. Data: `GET /admin/dashboard?from=&to=`.

| Section | Isi | Tautan |
| --- | --- | --- |
| Kepala | Judul "Dashboard"; pemilih periode 7 hari · 30 hari (default) · Sejak pilot · Rentang custom (→ `from`, `to`); teks "Diperbarui \<waktu>" + tombol muat ulang | — |
| Perlu perhatian (4 kartu, merah bila > 0, abu bila 0) | "Legalitas menunggu verifikasi" (`attention.legal_pending`) · "Pengajuan menunggu > 48 jam" (`applications_waiting_over_48h`) · "Antar hari ini" (`deliveries_today`) · "Email gagal 24 jam" (`emails_failed_24h`) | A18 · A15 `?status=submitted&ordering=created_at` · A15 `?delivery_date=<hari ini>` · A21 `?tab=log&email_status=failed` |
| Pengguna (5 kartu angka) | Total akun · Toko · UMKM · Diundang (belum login) · Disuspend, dari `users` | A03 dengan filter sesuai kartu, A06, A07 |
| Peluang & produk | Peluang Dibuka / Kuota penuh / Ditutup (`opportunities`) · Produk aktif / diarsipkan (`products`) | A09 `?status=`, A12 `?is_active=` |
| Stok | Item di rak (`stock.items_on_shelf`) · Stok habis (`stock.out_of_stock`) | A17, A17 `?stock_status=out_of_stock` |
| Corong pengajuan | Bar horizontal per status dari `applications.by_status`, urut alur (Diajukan → Disetujui → Dalam pengiriman → Diterima toko → Selesai), lalu Ditolak dan Dibatalkan terpisah. Di sampingnya tiga angka: pengajuan baru dalam periode (`created_in_period`), tingkat persetujuan (`approval_rate` dalam %), median waktu tinjau (`median_hours_to_review` dalam jam) | Klik bar → A15 `?status=<status>` |
| Aktivitas terbaru | 20 baris `recent_activity`: ikon jenis, `label`, waktu | Klik → halaman detail `target` (`application` → A16, `user` → A04, `opportunity` → A10, `product` → A13) |

Kosong: bila semua angka 0, section Corong dan Aktivitas menampilkan "Belum ada aktivitas pada periode ini." Error memuat: banner merah + "Coba lagi", kartu tetap skeleton.

## Pengguna

### A03 · Pengguna (`/admin/pengguna`)

Tujuan: menemukan dan mengelola semua akun. Data: `GET /admin/users`.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari nama, email, nama toko, atau nama usaha" · tombol "+ Undang pengguna" → A05 · "Ekspor CSV" → `users.csv` |
| Filter | Peran: Toko (`role=store`) · UMKM (`role=umkm`) · Tanpa peran (`role=none`) · Status: Diundang · Aktif · Disuspend (`status=`) · "Admin saja" (`is_admin=true`) · Tampilkan yang dihapus |
| Kolom | Nama (avatar + `name`) ↕ · Email · Peran (chip) · Toko / Usaha (`store_profile.name`, `umkm_profile.business_name`) · Status (chip) · Admin (chip level bila `is_admin`) · Login terakhir (`last_login_at`) ↕ · Dibuat (`created_at`) ↕ |
| Aksi baris (⋯) | Lihat → A04 · Ubah → A05 · Suspend (bila aktif) · Aktifkan (bila disuspend) · Hapus (bila belum dihapus) · Pulihkan (bila dihapus) |
| Kosong | "Belum ada pengguna. Undang peserta pilot pertama." + "Undang pengguna" |

Urutan default: `-created_at`. ↕ = kolom bisa diurutkan.

Modal aksi dari daftar ini (juga dipakai di A04):

| Aksi | Dampak yang ditampilkan | Alasan | Request | Toast sukses |
| --- | --- | --- | --- | --- |
| Suspend | Pengguna langsung keluar dan tidak bisa masuk · Peluang tokonya disembunyikan dari feed · Produknya tidak bisa diajukan ke peluang baru · Pengajuan aktif tidak berubah otomatis | Wajib | `POST /admin/users/{id}/suspend` | "Akun disuspend." Bila response `applications_active` > 0, tambah toast info "Akun ini masih punya \<n> pengajuan aktif." dengan tautan ke A04 tab Kerja sama |
| Aktifkan | Pengguna bisa masuk kembali · Peluang dan produknya aktif lagi | Opsional | `POST /admin/users/{id}/activate` | "Akun diaktifkan." |
| Hapus | Profil toko/UMKM, peluang, dan produk milik akun ikut disembunyikan · Data bisa dipulihkan | Wajib | `DELETE /admin/users/{id}` | "Akun dihapus." |
| Pulihkan | Akun, profil, peluang, dan produk yang terhapus bersamaan dikembalikan | Wajib | `POST /admin/users/{id}/restore` | "Akun dipulihkan." |

### A04 · Detail pengguna (`/admin/pengguna/:id`)

Tujuan: melihat satu akun lengkap dengan profil, kerja sama, dan riwayatnya. Data utama: `GET /admin/users/{id}`.

Kepala (di atas tab): avatar, nama, email (bisa diklik), chip status, chip peran, chip level admin. Banner sesuai kondisi: disuspend (merah, "Disuspend \<suspended\_at>: \<suspended\_reason>"), dihapus (abu, dengan tombol "Pulihkan"), diundang (biru, "Belum pernah masuk. Undangan dikirim ke \<email>.").

#### Tab Akun (`?tab=akun`, default)

| Kolom | Kartu | Isi |
| --- | --- | --- |
| Kiri | Data akun | Nama · Email · Peran · Status · Level admin · Diundang oleh (`invited_by.name`) · Login terakhir · Dibuat · ID (salin) |
| Kiri | Statistik | Peluang (`stats.opportunities`) → A09 `?store_id=` · Produk (`stats.products`) → A12 `?umkm_id=` · Pengajuan aktif (`stats.applications_active`) dan total (`stats.applications_total`) → tab Kerja sama |
| Kanan | Aksi | Ubah → A05 · Suspend / Aktifkan · Hapus / Pulihkan · Hapus permanen (hanya superadmin, hanya tampil bila `applications_total` = 0) |
| Kanan | Riwayat admin | `target_type=user`, `target_id=<id>` |

Hapus permanen: Modal aksi berisiko dengan konfirmasi ketik email akun; dampak "Akun, profil, produk, peluang, notifikasi, dan file milik akun dihapus permanen. Tidak bisa dibatalkan. Audit log tetap tersimpan." → `DELETE /admin/users/{id}?hard=true` → toast "Akun dihapus permanen." → kembali ke A03.

#### Tab Profil toko (`?tab=toko`)

Bila `store_profile` null: kartu "Akun ini belum punya profil toko." + tombol "Buat profil toko" → `/admin/toko/baru?user_id=<id>`. Bila ada: data dari `GET /admin/stores/{id}`.

| Kolom | Kartu | Isi |
| --- | --- | --- |
| Kiri | Profil | Foto toko · Nama · Telepon (WhatsApp) · Alamat · Peta lokasi hanya-baca · Diperbarui |
| Kiri | Jam operasional | Tabel Senin–Minggu: buka, tutup, atau "Tutup" |
| Kiri | Statistik | Peluang dibuka (`stats.opportunities_open`) → A09 `?store_id=` · Pengajuan aktif (`stats.applications_active`) → A15 `?store_id=` · Item di rak (`stats.items_on_shelf`) → A17 `?store_id=` |
| Kanan | Aksi | Ubah → `/admin/toko/:id/ubah` · Hapus profil / Pulihkan profil |
| Kanan | Riwayat admin | `target_type=store` |

Modal hapus profil toko: dampak "Peluang toko ini ikut disembunyikan dari feed" dan "Pemilik diarahkan ke onboarding toko saat masuk lagi" → `DELETE /admin/stores/{id}` → toast "Profil toko dihapus." Pulihkan → `POST /admin/stores/{id}/restore`.

#### Tab Profil UMKM (`?tab=umkm`)

Bila `umkm_profile` null: kartu "Akun ini belum punya profil UMKM." + "Buat profil UMKM" → `/admin/umkm/baru?user_id=<id>`. Bila ada: data dari `GET /admin/umkms/{id}`.

| Kolom | Kartu | Isi |
| --- | --- | --- |
| Kiri | Profil | Logo · Nama usaha · Nama pemilik · Telepon · Alamat · Peta · Deskripsi · Diperbarui |
| Kiri | Legalitas | Tabel Jenis (NIB, PIRT, Halal) · Nomor · Status (chip verifikasi) · Catatan · Diputuskan oleh & waktu; di bawahnya thumbnail `legal_documents` yang membuka penampil dokumen |
| Kiri | Statistik | Produk aktif (`stats.products_active`) → A12 `?umkm_id=` · Pengajuan aktif → A15 `?umkm_id=` · Item di rak → A17 `?umkm_id=` |
| Kanan | Aksi | Ubah → `/admin/umkm/:id/ubah` · "Verifikasi legalitas" → A18 `?umkm=<id>` · Hapus profil / Pulihkan profil |
| Kanan | Riwayat admin | `target_type=umkm` |

Modal hapus profil UMKM: dampak "Produk UMKM ini ikut disembunyikan" dan "Pemilik diarahkan ke onboarding UMKM saat masuk lagi" → `DELETE /admin/umkms/{id}`. Pulihkan → `POST /admin/umkms/{id}/restore`.

#### Tab Kerja sama (`?tab=kerja-sama`)

Dua tabel, tampil sesuai profil yang dimiliki: "Sebagai toko" (`GET /admin/applications?store_id=<store id>`) dan "Sebagai UMKM" (`GET /admin/applications?umkm_id=<umkm id>`). Kolom: Diajukan · Pihak lawan · Peluang · Status · Slot antar · Diperbarui. Klik → A16. Kosong: "Belum ada pengajuan."

#### Tab Aktivitas (`?tab=aktivitas`)

"Tindakan admin terhadap akun ini": `GET /admin/audit-logs?target_type=user&target_id=<id>`. Bila akun ini admin, tambah "Tindakan yang dilakukan akun ini": `GET /admin/audit-logs?admin_id=<id>`. Kolom: Waktu · Admin · Aksi · Objek · Alasan. Klik → A22 `?id=`.

### A05 · Undang / ubah pengguna (modal di A03 dan A04)

| Field (key API) | Mode undang | Mode ubah |
| --- | --- | --- |
| `email` | Wajib, input email; pesan "Masukkan email yang valid." | Hanya-baca + teks "Email tidak bisa diubah karena dipakai untuk masuk dengan Google." |
| `name` | Wajib | Bisa diubah |
| `roles` | Checkbox "Toko" dan "UMKM", minimal satu | Checkbox; melepas peran dengan pengajuan aktif menampilkan modal `has_active_relations` |
| `send_invitation_email` | Checkbox "Kirim email undangan", default tercentang | — |
| `is_admin`, `admin_role` | — | Hanya untuk superadmin: toggle "Akses admin" + radio Superadmin / Staff |
| `admin_reason` | — | "Alasan perubahan" (opsional) |

Mode undang: tombol "Buat undangan" → `POST /admin/users` → toast "Undangan dibuat untuk \<email>." → dialog lanjutan "Buat profil sekarang?" dengan tombol "Buat profil toko" / "Buat profil UMKM" (sesuai peran terpilih) → A08 dengan `user_id`, atau "Nanti" → A04 akun baru. Error 409: "Email ini sudah terdaftar."; bila akun itu terhapus: "Email ini milik akun yang dihapus. Aktifkan 'Tampilkan yang dihapus' di daftar Pengguna untuk memulihkannya."

Mode ubah: tombol "Simpan perubahan" → `PATCH /admin/users/{id}` (hanya field yang berubah) → toast "Perubahan disimpan." Error 409 superadmin terakhir: "Harus ada minimal satu superadmin."

## Toko, UMKM & verifikasi

### A06 · Toko (`/admin/toko`)

Data: `GET /admin/stores`. Klik baris → A04 `?tab=toko` milik pemiliknya.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari nama toko atau alamat" · "+ Toko" → `/admin/toko/baru` · "Ekspor CSV" → `stores.csv` |
| Filter | Status akun pemilik (`user_status`: Diundang, Aktif, Disuspend) · Tampilkan yang dihapus |
| Kolom | Nama toko ↕ · Pemilik (nama + email) · Telepon · Alamat (dipotong 1 baris, lengkap di tooltip) · Peluang dibuka · Item di rak · Status akun (chip) · Dibuat ↕ |
| Aksi baris (⋯) | Lihat · Ubah → `/admin/toko/:id/ubah` · Hapus profil / Pulihkan profil (modal sama dengan A04) |
| Kosong | "Belum ada toko terdaftar." + "+ Toko" |

### A07 · UMKM (`/admin/umkm`)

Data: `GET /admin/umkms`. Klik baris → A04 `?tab=umkm`.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari nama usaha, pemilik, atau alamat" · "+ UMKM" → `/admin/umkm/baru` · "Ekspor CSV" → `umkms.csv` |
| Filter | Status legalitas (`legal_status`: Menunggu, Terverifikasi, Ditolak, Belum diisi) · Tampilkan yang dihapus |
| Kolom | Nama usaha ↕ · Pemilik · Telepon · Alamat · Legalitas (tiga chip kecil NIB · PIRT · Halal berwarna status verifikasi) · Produk aktif · Pengajuan aktif · Dibuat ↕ |
| Aksi baris (⋯) | Lihat · Ubah → `/admin/umkm/:id/ubah` · Verifikasi legalitas → A18 `?umkm=<id>` · Hapus profil / Pulihkan profil |
| Kosong | "Belum ada UMKM terdaftar." + "+ UMKM" |

### A08 · Form profil toko / UMKM

Route: `/admin/toko/baru`, `/admin/toko/:id/ubah`, `/admin/umkm/baru`, `/admin/umkm/:id/ubah`; query `?user_id=` mengisi pemilik otomatis. Data mode ubah: `GET /admin/stores/{id}` atau `GET /admin/umkms/{id}`. Upload: `POST /uploads` (`store_photo`, `umkm_logo`, `legal_document`). Simpan: `POST /admin/stores` / `PATCH /admin/stores/{id}` atau `POST /admin/umkms` / `PATCH /admin/umkms/{id}`.

Satu halaman panjang (bukan stepper) dengan navigasi section di kiri.

| Section | Field (key API) | Komponen & aturan |
| --- | --- | --- |
| Pemilik | `user_id` | Pemilih entitas akun (`GET /admin/users?search=`); akun yang sudah punya profil jenis ini nonaktif dengan keterangan "Sudah punya profil toko/UMKM". Terkunci di mode ubah (tampil nama + email + tautan A04). Teks info mode buat: "Peran Toko/UMKM otomatis ditambahkan ke akun ini." |
| Info toko (toko) | `name`, `phone`, `photo_file_id` | Sama dengan P04 langkah 1 |
| Info usaha (UMKM) | `business_name`, `owner_name`, `phone`, `description`, `logo_file_id` | Sama dengan P05 langkah 1; `owner_name` diisi awal dari nama akun pemilik |
| Lokasi | `address`, `lat`, `lng` | Textarea alamat + pemilih lokasi (peta); wajib |
| Jam operasional (toko) | `operating_hours[]` | Editor jam operasional 7 hari; minimal 1 hari buka |
| Legalitas (UMKM) | `legal.nib`, `legal.pirt_number`, `legal.halal_number`, `legal_document_file_ids[]` | Sama dengan P05 langkah 3. Mode ubah menampilkan chip status verifikasi di samping tiap nomor dan kotak info "Perubahan nomor oleh admin tidak mengubah status verifikasi. Verifikasi di halaman Verifikasi legalitas." |
| Catatan admin (mode ubah) | `admin_reason`, `notify_user` | "Alasan perubahan" opsional · checkbox "Beri tahu pemilik" default tercentang |

Tombol: "Buat profil" / "Simpan perubahan" dan "Batal". Berhasil → toast "Profil toko dibuat." / "Profil UMKM disimpan." → A04 tab terkait. Error 409 (akun sudah punya profil) → pesan di section Pemilik. Validasi field mengikuti P04/P05.

### A18 · Verifikasi legalitas (`/admin/verifikasi`)

Tujuan: memutuskan NIB, PIRT, dan sertifikat halal yang menunggu. Data daftar: `GET /admin/legal-verifications?status=`. Data detail: `GET /admin/umkms/{id}` (memuat `legal`, `legal_verification`, `legal_documents`). Simpan: `POST /admin/umkms/{id}/legal-verification`.

| Bagian | Isi |
| --- | --- |
| Tab | Menunggu (`pending`, default, dengan jumlah) · Terverifikasi (`verified`) · Ditolak (`rejected`) |
| Panel kiri (daftar) | Urut paling lama menunggu. Tiap item: nama usaha, nama pemilik, chip jenis yang berstatus sesuai tab (mis. "NIB · PIRT"), "Menunggu 2 hari" dari `waiting_since`. Item terpilih disorot dan tercermin di `?umkm=<id>` |
| Panel kanan · kepala | Nama usaha (tautan A04 `?tab=umkm`), pemilik, telepon (WhatsApp) |
| Panel kanan · dokumen | Penampil dokumen untuk semua `legal_documents` (geser antar-dokumen, zoom, putar) |
| Panel kanan · keputusan | Tabel tiga baris NIB · PIRT · Halal. Kolom: Nomor (salin) · Status saat ini (chip) · Catatan & pemutus sebelumnya · Keputusan (radio "Verifikasi" / "Tolak" / "Biarkan", default "Biarkan") · Catatan (textarea, wajib bila Tolak; placeholder "Mis. nomor tidak cocok dengan dokumen."). Baris tanpa nomor: nonaktif dengan teks "Belum diisi UMKM" |
| Panel kanan · bantuan | Teks: "Cocokkan nomor dengan dokumen. Bila perlu, cek NIB di situs resmi OSS dan sertifikat halal di situs resmi BPJPH." |
| Panel kanan · simpan | Checkbox "Beri tahu UMKM" (default tercentang) · tombol "Simpan keputusan" (nonaktif sampai ada minimal satu Verifikasi/Tolak) |

Request hanya berisi jenis yang diputuskan, mis. `{ "nib": { "status": "verified" }, "pirt": { "status": "rejected", "note": "…" }, "notify_user": true }`. Berhasil → toast "Keputusan legalitas disimpan." → daftar dimuat ulang dan UMKM berikutnya otomatis terpilih. Kosong (tab Menunggu): "Tidak ada legalitas yang menunggu verifikasi." Bila dibuka dengan `?umkm=` untuk UMKM yang tidak ada di tab aktif, panel kanan tetap memuat datanya.

## Peluang

### A09 · Peluang (`/admin/peluang`)

Data: `GET /admin/opportunities`; pilihan kategori dari `GET /admin/categories`.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari judul peluang atau nama toko" · "+ Peluang" → A11 · "Ekspor CSV" → `opportunities.csv` |
| Filter | Toko (pemilih entitas → `store_id`) · Status: Dibuka · Kuota penuh · Ditutup (`status=`) · Kategori (`category=<slug>`) · "Sudah kedaluwarsa" (`expired=true`) · Tampilkan yang dihapus |
| Kolom | Judul ↕ · Toko · Kategori (chip) · Komisi · Kuota ("1/3") · Pengajuan baru (`application_counts.submitted`, disorot bila > 0) · Berlaku sampai ↕ (merah bila lewat) · Status (chip) · Dibuat oleh (chip toko/admin) · Dibuat ↕ |
| Aksi baris (⋯) | Lihat → A10 · Ubah → A11 · Tutup (bila `open`/`full`) · Buka ulang (bila `closed`) · Hapus / Pulihkan |
| Kosong | "Belum ada peluang." + "+ Peluang" |

Modal aksi (juga di A10):

| Aksi | Dampak yang ditampilkan | Field tambahan | Request | Toast sukses |
| --- | --- | --- | --- | --- |
| Tutup | Peluang hilang dari feed UMKM · Pengajuan yang sudah masuk tetap bisa ditinjau | — | `POST /admin/opportunities/{id}/close` | "Peluang ditutup." |
| Buka ulang | Peluang tampil lagi di feed (atau berstatus Kuota penuh bila kuota habis) | "Berlaku sampai" (pemilih tanggal; wajib bila nilai lama sudah lewat, default +30 hari) → `valid_until` | `POST /admin/opportunities/{id}/reopen` | "Peluang dibuka ulang." |
| Hapus | Peluang disembunyikan dari toko dan UMKM · Bisa dipulihkan · Diblokir bila masih ada pengajuan aktif | — | `DELETE /admin/opportunities/{id}` | "Peluang dihapus." |
| Pulihkan | Peluang kembali dengan status sebelum dihapus | — | `POST /admin/opportunities/{id}/restore` | "Peluang dipulihkan." |

### A10 · Detail peluang (`/admin/peluang/:id`)

Data: `GET /admin/opportunities/{id}`, `GET /admin/applications?opportunity_id={id}&status=<tab>`.

Kepala: judul, chip status, chip "Dibuat oleh toko/admin", toko (tautan A04 `?tab=toko`), "Berlaku sampai \<valid\_until>". Banner merah bila sudah lewat masa berlaku; banner abu bila dihapus.

| Kolom | Kartu | Isi |
| --- | --- | --- |
| Kiri | Kuota | Progress bar `quota_used`/`quota` + jumlah pengajuan per status dari `application_counts` |
| Kiri | Detail | Deskripsi · Kategori · Maksimal produk per UMKM · Komisi (format + contoh hitungan dengan harga Rp10.000) · Jadwal terima barang per hari |
| Kiri | Syarat | Masa simpan minimal · Harga jual maksimal · NIB/PIRT/Halal wajib (ikon centang/silang) · Syarat lain (`requirements.notes`) |
| Kiri | Pengajuan | Tab Semua · Diajukan · Disetujui · Dalam pengiriman · Diterima toko · Riwayat; kolom Diajukan · UMKM · Produk · Status · Slot antar · Diperbarui; klik → A16. Kosong: "Belum ada pengajuan untuk peluang ini." |
| Kanan | Aksi | Ubah → A11 · Tutup / Buka ulang · Hapus / Pulihkan · Hapus permanen (hanya superadmin, hanya tampil bila belum pernah ada pengajuan) |
| Kanan | Info | ID (salin) · Dibuat oleh (`created_by.name`) · Dibuat · Diperbarui |
| Kanan | Riwayat admin | `target_type=opportunity` |

Hapus permanen: konfirmasi ketik judul peluang; dampak "Peluang dihapus permanen dan tidak bisa dipulihkan." → `DELETE /admin/opportunities/{id}?hard=true` → toast "Peluang dihapus permanen." → A09.

### A11 · Form peluang (`/admin/peluang/baru`, `/admin/peluang/:id/ubah`)

Data: `GET /admin/categories` (hanya yang `is_active` bisa dipilih), `GET /admin/stores/{store_id}` setelah toko dipilih (untuk jam operasional); mode ubah `GET /admin/opportunities/{id}`. Simpan: `POST /admin/opportunities` / `PATCH /admin/opportunities/{id}` (mode ubah hanya mengirim field yang berubah). Query `?store_id=` mengisi toko otomatis.

| Section | Field (key API) | Komponen & aturan |
| --- | --- | --- |
| 0 · Toko | `store_id` | Pemilih entitas toko (`GET /admin/stores?search=`); wajib; terkunci bila peluang sudah punya pengajuan (teks "Toko tidak bisa diganti karena sudah ada pengajuan."). Setelah dipilih, tampil ringkasan jam operasional toko |
| 1 · Info dasar | `title`, `description` | Sama dengan P08: judul 5–120 karakter (wajib), deskripsi maks 500 |
| 2 · Produk yang dicari | `category_ids[]`, `requirements.min_shelf_life_days`, `requirements.max_retail_price` | Chip multi-pilih kategori (min 1) · angka hari · input rupiah |
| 3 · Syarat legalitas | `requirements.requires_nib`, `requires_pirt`, `requires_halal`, `requirements.notes` | Tiga toggle + textarea maks 300 |
| 4 · Kuota | `quota`, `max_products_per_umkm` | Stepper 1–50 dan 1–10. Mode ubah: teks "Sudah terpakai: \<quota\_used>" dan minimum stepper = `quota_used` |
| 5 · Komisi | `commission.type`, `commission.value` | Radio persentase/nominal + nilai; kalkulator contoh. Mode ubah: kotak info "Perubahan komisi dan syarat hanya berlaku untuk pengajuan baru." |
| 6 · Jadwal terima barang | `receiving_schedule[]` | Editor jadwal; slot di luar jam operasional toko ditandai "Toko tutup pada jam ini." (nonaktif sampai toko dipilih) |
| 7 · Masa berlaku | `valid_until` | Pemilih tanggal ≥ hari ini; default +30 hari |
| 8 · Catatan admin | `admin_reason`, `notify_user` | "Alasan perubahan" opsional · checkbox "Beri tahu toko" default tercentang |

Tombol: "Buat peluang" / "Simpan perubahan", "Batal". Berhasil → toast "Peluang dibuat." / "Perubahan disimpan." → A10. Error 400 dipetakan ke field; 409 (`store_id` dikunci) ke section Toko.

## Produk

### A12 · Produk (`/admin/produk`)

Data: `GET /admin/products`; pilihan kategori dari `GET /admin/categories`.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari nama produk, tagar, atau nama usaha" · "+ Produk" → A14 · "Ekspor CSV" → `products.csv` |
| Filter | UMKM (pemilih entitas → `umkm_id`) · Kategori (`category=<slug>`) · Status: Aktif · Diarsipkan (`is_active=`) · "Sedang dijual di toko" (`has_placements=true`) · Tampilkan yang dihapus |
| Kolom | Foto (thumbnail foto utama) · Nama ↕ · UMKM · Kategori · Harga setor ↕ · Harga jual saran · Masa simpan (hari atau tanggal kedaluwarsa) · Toko aktif (`active_placements`) · Status (Aktif/Diarsipkan) · Dibuat oleh (chip) · Dibuat ↕ |
| Aksi baris (⋯) | Lihat → A13 · Ubah → A14 · Arsipkan (bila aktif) / Aktifkan (bila diarsipkan) · Hapus / Pulihkan |
| Kosong | "Belum ada produk." + "+ Produk" |

Modal aksi (juga di A13):

| Aksi | Dampak yang ditampilkan | Alasan | Request | Toast sukses |
| --- | --- | --- | --- | --- |
| Arsipkan | Produk tidak bisa dipilih untuk pengajuan baru · UMKM masih melihatnya di tab Diarsipkan | Opsional | `PATCH /admin/products/{id}` dengan `{ "is_active": false }` | "Produk diarsipkan." |
| Aktifkan | Produk bisa diajukan lagi | Opsional | `PATCH /admin/products/{id}` dengan `{ "is_active": true }` | "Produk diaktifkan." |
| Hapus | Produk disembunyikan dari UMKM dan toko · Riwayat pengajuan lama tetap memakai data saat diajukan · Diblokir bila ada di pengajuan aktif | Wajib | `DELETE /admin/products/{id}` | "Produk dihapus." |
| Pulihkan | Produk kembali dengan status aktif/arsip seperti sebelum dihapus | Wajib | `POST /admin/products/{id}/restore` | "Produk dipulihkan." |

### A13 · Detail produk (`/admin/produk/:id`)

Data: `GET /admin/products/{id}`.

Kepala: nama produk, chip Aktif/Diarsipkan, chip "Dibuat oleh UMKM/admin", UMKM (tautan A04 `?tab=umkm`). Banner abu bila dihapus.

| Kolom | Kartu | Isi |
| --- | --- | --- |
| Kiri | Galeri | Semua foto berurutan (foto pertama berlabel "Utama"); klik membuka penampil; tiap foto punya tombol "Hapus foto" |
| Kiri | Detail | Kategori · Deskripsi · Tagar (chip) · Harga setor · Harga jual saran · Selisih untuk toko · Masa simpan / tanggal kedaluwarsa · Sedang dijual di <`active_placements`> toko |
| Kiri | Riwayat pengajuan | Tabel dari `applications`: Toko · Status pengajuan · Keputusan · Harga jual · Stok (chip + angka). Klik → A16. Kosong: "Produk ini belum pernah diajukan." |
| Kanan | Aksi | Ubah → A14 · Arsipkan / Aktifkan · Hapus / Pulihkan · Hapus permanen (hanya superadmin, hanya tampil bila `applications` kosong) |
| Kanan | Info | ID (salin) · Dibuat oleh · Dibuat · Diperbarui |
| Kanan | Riwayat admin | `target_type=product` |

"Hapus foto" membuka Modal aksi berisiko: dampak "Foto dilepas dari produk ini dan diganti gambar placeholder di semua tampilan" dan "UMKM diminta mengunggah foto baru bila produk jadi tanpa foto" → `POST /admin/files/{id}/remove` → toast "Foto dihapus." → muat ulang detail.

Hapus permanen: konfirmasi ketik nama produk → `DELETE /admin/products/{id}?hard=true` → toast "Produk dihapus permanen." → A12.

### A14 · Form produk (`/admin/produk/baru`, `/admin/produk/:id/ubah`)

Data: `GET /admin/categories` (hanya kategori aktif bisa dipilih); mode ubah `GET /admin/products/{id}`. Upload foto: `POST /uploads` dengan `purpose=product_photo`. Simpan: `POST /admin/products` / `PATCH /admin/products/{id}`. Query `?umkm_id=` mengisi UMKM otomatis.

| Section | Field (key API) | Komponen & aturan |
| --- | --- | --- |
| 0 · UMKM | `umkm_id` | Pemilih entitas UMKM (`GET /admin/umkms?search=`); wajib; terkunci bila produk sudah pernah diajukan ("UMKM tidak bisa diganti karena produk sudah pernah diajukan.") |
| 1 · Foto | `photo_file_ids[]` | Upload 1–5 foto, seret untuk mengurutkan, foto pertama "Utama". Teks info: "Foto yang diunggah admin akan menjadi milik UMKM ini." |
| 2 · Info produk | `name`, `category_id`, `description`, `tags[]` | Sama dengan P14 section 2 |
| 3 · Harga | `base_price`, `suggested_retail_price` | Input rupiah; harga jual ≥ harga setor; teks hitung "Selisih untuk toko: Rp…" |
| 4 · Kedaluwarsa | `shelf_life_days` atau `expiry_date` | Radio + input; salah satu wajib, yang lain dikirim `null` |
| 5 · Status | `is_active` | Toggle "Aktif" (default aktif); mematikan saat produk ada di pengajuan `submitted`/`approved` menampilkan modal `has_active_relations` |
| 6 · Catatan admin | `admin_reason`, `notify_user` | "Alasan perubahan" opsional · checkbox "Beri tahu UMKM" default tercentang |

Tombol: "Buat produk" / "Simpan perubahan", "Batal". Berhasil → toast "Produk dibuat." / "Perubahan disimpan." → A13. Validasi mengikuti P14 (nama 3–100 karakter, 1–5 foto, harga > 0, maks 10 tagar).

## Pengajuan & stok

### A15 · Pengajuan (`/admin/pengajuan`)

Data: `GET /admin/applications`.

| Bagian | Isi |
| --- | --- |
| Toolbar | Cari: "Cari nama toko, nama usaha, atau judul peluang" · "+ Pengajuan atas nama UMKM" → modal di bawah · "Ekspor CSV" (menu: `applications.csv` atau `application-items.csv`) |
| Tampilan cepat (tab di atas tabel) | Semua · Menunggu > 48 jam (`status=submitted&created_before=<sekarang − 48 jam>&ordering=created_at`) · Antar hari ini (`delivery_date=<hari ini>`) · Sedang dijual (`status=received`) · Ada override (`has_override=true`) |
| Filter | Status (multi-pilih → `status=a,b`) · Toko (`store_id`) · UMKM (`umkm_id`) · Peluang (`opportunity_id`) · Rentang tanggal diajukan (`created_after`, `created_before`) · Tanggal antar (`delivery_date`) |
| Kolom | Diajukan ↕ · Toko · UMKM · Peluang · Produk ("2 · 1 disetujui") · Slot antar ↕ · Status (chip) · Override (ikon perisai bila ada) · Diperbarui ↕ |
| Klik baris | → A16 |
| Kosong | "Belum ada pengajuan." |

#### Modal "Pengajuan atas nama UMKM"

| Langkah | Field (key API) | Komponen & data |
| --- | --- | --- |
| 1 | `umkm_id` | Pemilih entitas UMKM (`GET /admin/umkms?search=`) |
| 2 | `opportunity_id` | Pemilih entitas peluang, hanya yang dibuka (`GET /admin/opportunities?status=open&search=`); tampil toko, kuota tersisa, maks produk per UMKM |
| 3 | `product_ids[]` | Checkbox produk aktif UMKM (`GET /admin/products?umkm_id=<id>&is_active=true`), dibatasi `max_products_per_umkm` |
| 4 | `note` | Textarea "Catatan untuk toko" (opsional, maks 300) |
| 5 | `skip_requirement_check` | Toggle "Lewati cek syarat legalitas, masa simpan, dan harga" (default mati) + teks "Kuota dan kepemilikan produk tetap dicek." |
| 6 | `admin_reason`, `notify_user` | Alasan wajib · "Beri tahu toko dan UMKM" default tercentang |

Tombol "Buat pengajuan" → `POST /admin/applications` → toast "Pengajuan dibuat." → A16. Error 400 syarat → kotak merah berisi `details` + saran menyalakan toggle lewati cek; 409 kuota penuh atau sudah ada pengajuan aktif → modal conflict.

### A16 · Detail pengajuan (`/admin/pengajuan/:id`)

Data: `GET /admin/applications/{id}` (sudah memuat `timeline`, `admin_transitions`, `admin_can_review`, kontak kedua pihak); `GET /admin/opportunities/{opportunity.id}` untuk `receiving_schedule` (dipakai form review dan ubah slot). Semua aksi selesai → muat ulang `GET /admin/applications/{id}`.

#### Kolom kiri

| Section | Isi | Aksi |
| --- | --- | --- |
| Kepala | Chip status · penanda override bila ada · "Diajukan \<created\_at> · Diperbarui \<updated\_at>" | — |
| Para pihak | Dua kartu: Toko (nama → A04 `?tab=toko`, telepon + WhatsApp) dan UMKM (nama → A04 `?tab=umkm`, telepon + WhatsApp, tiga chip legalitas + status verifikasi) · Peluang (judul → A10, skema komisi) | — |
| Jadwal antar (bila `delivery_slot` ada) | Tanggal & jam slot · catatan toko (`review_note`) | "Ubah slot" (status `approved`/`in_delivery`) |
| Produk | Tabel per `items[]`: Produk (foto, nama, harga setor dari snapshot) · Keputusan (chip) · Alasan tolak · Jumlah disetujui · Harga jual · Komisi/unit · Diterima UMKM/unit · Jumlah diterima · Stok (chip + angka) | Per baris: "Koreksi angka" (item `approved`, status `approved`–`completed`) · "Koreksi stok" (status `received`) |
| Catatan | Catatan UMKM (`note`) dan catatan toko (`review_note`) | "Ubah catatan" (semua status) |
| Mode stok | "Catat jumlah (angka)" atau "Ada/habis" | "Ubah" (status `approved`/`in_delivery`/`received`) |
| Review atas nama toko | Tampil hanya bila `admin_can_review`: form approval sama dengan P19 Section 6 (keputusan per produk, jumlah, harga jual, alasan tolak, slot antar dari `receiving_schedule`, mode stok, catatan) ditambah Alasan wajib dan "Beri tahu toko dan UMKM" | "Kirim keputusan" → konfirmasi → `POST /admin/applications/{id}/review` |
| Timeline | Semua event dari `timeline`, urut lama → baru; event `is_admin_override` berlatar kuning dengan label "Admin" dan alasannya | — |

#### Kolom kanan

| Kartu | Isi |
| --- | --- |
| Ubah status paksa | Dropdown berisi hanya nilai `admin_transitions` (kosong → teks "Tidak ada perubahan status yang diizinkan dari status ini."). Memilih status menampilkan efeknya (tabel di bawah). Bila tujuan `received`: stepper "Jumlah diterima" per item disetujui (0 s.d. `approved_quantity`). Alasan wajib · "Beri tahu toko dan UMKM" · tombol "Ubah status" → Modal konfirmasi → `POST /admin/applications/{id}/force-status` |
| Info | ID (salin) · ID peluang · jumlah event override |
| Riwayat admin | `target_type=application` |
| Zona berbahaya (hanya superadmin) | "Hapus permanen pengajuan": konfirmasi ketik 8 karakter ID; dampak "Pengajuan, produk di dalamnya, timeline, dan notifikasi terkait dihapus permanen. Kuota peluang dikoreksi." → `DELETE /admin/applications/{id}?hard=true` → toast → A15 |

Teks efek di dropdown "Ubah status paksa":

| Dari → ke | Teks efek |
| --- | --- |
| Diajukan → Dibatalkan | "Pengajuan dibatalkan." |
| Disetujui → Diajukan | "Persetujuan dibatalkan; semua keputusan produk dan slot antar dikosongkan; kuota peluang dikembalikan 1." |
| Disetujui → Dibatalkan | "Pengajuan dibatalkan; kuota peluang dikembalikan 1." |
| Dalam pengiriman → Disetujui | "UMKM dianggap belum berangkat; slot tetap." |
| Dalam pengiriman → Diterima toko | "Barang dianggap sudah diterima; isi jumlah diterima per produk." |
| Dalam pengiriman → Dibatalkan | "Pengajuan dibatalkan; kuota peluang dikembalikan 1." |
| Diterima toko → Dalam pengiriman | "Konfirmasi terima dibatalkan; jumlah diterima dan stok dikosongkan." |
| Diterima toko → Selesai | "Kerja sama diselesaikan." |
| Diterima toko → Dibatalkan | "Barang ditarik; stok jadi habis tanpa notifikasi stok habis; kuota dikembalikan 1." |
| Ditolak → Diajukan | "Peninjauan dibuka ulang; keputusan dan alasan tolak dikosongkan." |
| Dibatalkan → Diajukan | "Pengajuan dibuka ulang; keputusan dikosongkan." |
| Selesai → Diterima toko | "Kerja sama dibuka kembali; stok bisa diubah lagi." |

#### Modal koreksi di A16

| Modal | Field (key API) | Aturan | Request | Toast |
| --- | --- | --- | --- | --- |
| Ubah slot | `delivery_slot.date`, `start`, `end` | Tanggal hanya hari yang ada di `receiving_schedule`; slot dari jadwal hari itu; alasan wajib | `PATCH /admin/applications/{id}` | "Slot antar diubah." |
| Koreksi angka | `items[].approved_quantity`, `items[].sell_price`, `items[].received_quantity` | Field tampil sesuai status (tabel field PATCH di Spesifikasi Admin); harga jual ≥ harga setor; pratinjau komisi dihitung ulang; alasan wajib di UI karena memengaruhi bagi hasil | `PATCH /admin/applications/{id}` | "Angka produk dikoreksi." |
| Ubah catatan | `note`, `review_note` | Maks 300 karakter; alasan opsional | `PATCH /admin/applications/{id}` | "Catatan disimpan." |
| Ubah mode stok | `stock_mode` | Radio angka / ada-habis; alasan opsional | `PATCH /admin/applications/{id}` | "Mode stok diubah." |
| Koreksi stok | `stock_quantity` atau `stock_status` | Sama dengan modal di A17 | `PATCH /admin/applications/{id}/items/{item_id}/stock` | "Stok dikoreksi." |

### A17 · Stok (`/admin/stok`)

Data: `GET /admin/stock`. Koreksi: `PATCH /admin/applications/{id}/items/{item_id}/stock`.

| Bagian | Isi |
| --- | --- |
| Ringkasan | "\<count> item di rak · \<n> habis" |
| Toolbar | "Ekspor CSV" → `stock.csv` |
| Filter | Toko (`store_id`) · UMKM (`umkm_id`) · Stok: Ada · Habis (`stock_status=`) |
| Kolom | Produk (foto + nama) · UMKM · Toko · Harga jual · Mode (Angka / Ada-habis) · Stok (chip + angka) · Diperbarui (waktu + `stock_updated_by` bila admin) · Aksi "Koreksi" |
| Klik baris | → A16 pengajuan item itu |
| Kosong | "Belum ada produk yang sedang dijual di toko." |

Modal "Koreksi stok": mode angka → input "Jumlah stok sekarang" (≥ 0) → `stock_quantity`; mode ada/habis → radio "Ada" / "Habis" → `stock_status`. Info: "Bila stok jadi habis, UMKM menerima notifikasi stok habis." Checkbox "Kirim notifikasi" (`notify_user`, default tercentang) dan Alasan wajib (placeholder "Mis. hasil cek fisik rak 10 Nov."). Berhasil → toast "Stok dikoreksi." Error 409 (pengajuan tidak lagi `received`) → modal conflict lalu muat ulang.

## Halaman sistem

### A19 · Kategori (`/admin/kategori`)

Data: `GET /admin/categories` (tanpa paginasi). Aksi: `POST`, `PATCH /admin/categories/{id}`, `DELETE /admin/categories/{id}`.

| Bagian | Isi |
| --- | --- |
| Toolbar | "+ Kategori" → modal |
| Tabel | Pegangan seret (ubah urutan) · Nama · Slug · Produk (`usage.products`) · Peluang (`usage.opportunities`) · Aktif (toggle langsung) · Aksi (Ubah, Hapus) |
| Kosong | "Belum ada kategori. Tambahkan kategori agar UMKM bisa mengisi produk." |

| Aksi | Interaksi | Request | Toast |
| --- | --- | --- | --- |
| Tambah | Modal: "Nama" (wajib, unik) · "Slug" (terisi otomatis dari nama, bisa diubah, huruf kecil & tanda hubung) · "Aktif" (default nyala) | `POST /admin/categories` (`sort_order` = terakhir + 10) | "Kategori ditambahkan." |
| Ubah | Modal sama, terisi | `PATCH /admin/categories/{id}` | "Kategori diubah." |
| Ubah urutan | Seret baris lalu lepas | `PATCH` `sort_order` untuk baris yang berpindah | "Urutan disimpan." |
| Aktif / nonaktif | Toggle; menonaktifkan memunculkan konfirmasi "Kategori tidak bisa dipilih untuk produk/peluang baru. Data lama tetap." | `PATCH { "is_active": … }` | "Kategori dinonaktifkan." / "…diaktifkan." |
| Hapus | Hanya aktif bila `usage.products` dan `usage.opportunities` = 0; selain itu tombol nonaktif dengan tooltip "Nonaktifkan saja, kategori masih dipakai." Konfirmasi biasa | `DELETE /admin/categories/{id}` | "Kategori dihapus." |

### A20 · File (`/admin/file`)

Data: `GET /admin/files`. Aksi: `POST /admin/files/{id}/remove`.

| Bagian | Isi |
| --- | --- |
| Filter | Jenis (`purpose`: Foto produk, Foto toko, Logo UMKM, Dokumen legalitas) · Pemilik (pemilih entitas akun → `owner_id`) · "Sudah dihapus" (`is_removed=true`) · Diunggah sejak (`created_after`) |
| Tampilan | Grid kartu: thumbnail (gambar) atau ikon PDF, jenis, pemilik, tanggal. Kartu terhapus tampil abu dengan label "Dihapus" |
| Panel samping (`?id=`) | Pratinjau besar (penampil dokumen) · Jenis · Ukuran · Tipe file · Pemilik (tautan A04) · Dipakai di (`used_in`: tautan ke produk A13, profil A04, atau dokumen legalitas) · Diunggah · Tombol "Hapus file" (bila belum dihapus) |
| Kosong | "Belum ada file yang diunggah." |

Modal "Hapus file": dampak "File dilepas dari semua tempat yang memakainya", "Tautan lama menampilkan gambar placeholder", "File di storage dihapus otomatis setelah 30 hari"; alasan wajib; "Beri tahu pemilik" → toast "File dihapus."

### A21 · Notifikasi & pengumuman (`/admin/notifikasi`)

#### Tab Log (`?tab=log`, default)

Data: `GET /admin/notifications`. Aksi: `POST /admin/notifications/{id}/resend-email`.

| Bagian | Isi |
| --- | --- |
| Filter | Penerima (pemilih entitas akun → `user_id`) · Tipe (`type`, semua tipe termasuk `admin_action`, `announcement`, `legal_verified`, `legal_rejected`) · Status email (`email_status`) · Sejak (`created_after`) |
| Kolom | Waktu ↕ · Penerima (nama + email) · Tipe (ikon + label) · Judul · Status email (chip) · Percobaan (`email_attempts`) · Dibaca (centang bila `read_at`) |
| Panel samping | Judul, isi lengkap, `data` (tautan ke objek terkait), status email, `email_error` (kotak merah bila gagal), tombol "Kirim ulang email" (hanya bila `failed`) |
| Kosong | "Belum ada notifikasi." |

Kirim ulang: konfirmasi biasa → toast "Email dijadwalkan ulang." → chip jadi Menunggu.

#### Tab Kirim pengumuman (`?tab=pengumuman`)

Aksi: `POST /admin/notifications/broadcast`.

| Field (key API) | Komponen & aturan |
| --- | --- |
| `title` | "Judul", maks 80 karakter, wajib |
| `body` | "Isi pengumuman", textarea maks 500, wajib |
| `target.roles` | Checkbox "Semua toko" dan "Semua UMKM" |
| `target.user_ids[]` | Pemilih entitas akun, multi-pilih ("Atau pilih pengguna tertentu") |
| `send_email` | Checkbox "Kirim juga lewat email", default tercentang |
| — | Pratinjau kartu notifikasi seperti di P20 |

Validasi: minimal satu target. Tombol "Kirim pengumuman" → konfirmasi "Kirim ke semua toko dan UMKM aktif?" (atau "ke \<n> pengguna terpilih") → toast "Pengumuman dikirim ke \<recipients\_count> pengguna." → form dikosongkan, tab Log difilter `type=announcement`.

### A22 · Audit log (`/admin/audit`)

Data: `GET /admin/audit-logs`, `GET /admin/audit-logs/{id}` (panel). Halaman hanya-baca.

| Bagian | Isi |
| --- | --- |
| Filter | Admin (pemilih entitas, hanya `is_admin=true` → `admin_id`) · Aksi (`action`, label sesuai Komponen global) · Jenis objek (`target_type`) · ID objek (`target_id`, terisi otomatis dari tautan "Lihat semua") · Rentang tanggal (`created_after`, `created_before`) |
| Kolom | Waktu ↕ · Admin · Aksi (label) · Jenis objek · Objek (`target_label`, tautan ke detailnya) · Alasan (dipotong) |
| Panel samping (`?id=`) | Admin · Waktu · Aksi · Objek (tautan) · Alasan lengkap · Tabel perubahan dari `changes` (Field · Sebelum · Sesudah) · IP address · User agent |
| Toolbar | Tidak ada tombol buat/ubah/hapus; tidak ada ekspor CSV (ekspor audit tidak tersedia di API) |
| Kosong | "Belum ada tindakan admin." |

### A23 · Ekspor (`/admin/ekspor`)

Aksi: `GET /admin/exports/{resource}.csv?<filter>` (unduhan file).

| Kartu | Isi | Filter di kartu |
| --- | --- | --- |
| Pengguna (`users`) | Satu baris per akun | Peran, status |
| Toko (`stores`) | Satu baris per profil toko | Status akun |
| UMKM (`umkms`) | Satu baris per profil UMKM, termasuk status verifikasi | Status legalitas |
| Peluang (`opportunities`) | Satu baris per peluang | Status, toko, rentang tanggal dibuat |
| Produk (`products`) | Satu baris per produk | UMKM, kategori, aktif |
| Pengajuan (`applications`) | Satu baris per pengajuan | Status, toko, UMKM, rentang tanggal diajukan |
| Produk dalam pengajuan (`application-items`) | Satu baris per item; label "Dasar bagi hasil" | Status, toko, UMKM, rentang tanggal |
| Stok (`stock`) | Item berstatus diterima toko | Toko, UMKM, status stok |

Tiap kartu: daftar kolom (bisa dibuka-tutup), filter, tombol "Unduh CSV" (spinner selama unduh). Kartu `application-items` menampilkan catatan: "Unit terjual = jumlah diterima − stok sekarang (hanya mode angka)." Error 400 (lebih dari 50.000 baris) → pesan "Data terlalu banyak. Persempit rentang tanggal atau filter." Setiap unduhan tercatat di audit log.

### A24 · Admin & akses (`/admin/admin`, hanya superadmin)

Data: `GET /admin/users?is_admin=true`. Aksi: `PATCH /admin/users/{id}` dengan `is_admin` dan `admin_role`.

| Bagian | Isi |
| --- | --- |
| Toolbar | "+ Angkat admin" → modal |
| Kolom | Nama · Email · Level (chip) · Login terakhir · Diangkat oleh & waktu (dari audit `grant_admin`) · Aksi |
| Aksi baris | Ubah level · Cabut akses admin. Untuk superadmin terakhir kedua aksi nonaktif dengan tooltip "Harus ada minimal satu superadmin." Admin tidak bisa mencabut aksesnya sendiri |

| Modal | Field | Request | Toast |
| --- | --- | --- | --- |
| Angkat admin | Pemilih entitas akun (akun yang sudah admin nonaktif) · Level: Staff (default) / Superadmin · Alasan wajib | `PATCH /admin/users/{id}` `{ "is_admin": true, "admin_role": "staff" }` | "\<nama> sekarang admin." |
| Ubah level | Radio Staff / Superadmin · Alasan wajib | `PATCH` `{ "admin_role": … }` | "Level admin diubah." |
| Cabut akses | Dampak "Akun ini langsung kehilangan akses panel admin" · Alasan wajib | `PATCH` `{ "is_admin": false, "admin_role": null }` | "Akses admin dicabut." |

### A25 · Halaman sistem

| Varian | Kapan | Isi |
| --- | --- | --- |
| Tidak ditemukan | Route tidak dikenal atau API 404 | "Halaman atau data tidak ditemukan." + tombol "Kembali ke \<daftar asal>" (atau Dashboard) |
| Akses tidak tersedia | `staff` membuka halaman superadmin, atau 403 setelah guard ulang | "Halaman ini khusus superadmin." + "Kembali ke Dashboard" |
| Kesalahan server | 5xx berulang saat memuat halaman | "Terjadi kesalahan di server. Coba beberapa saat lagi." + "Coba lagi" |
| Offline | Koneksi terputus | Banner "Anda sedang offline. Perubahan tidak bisa disimpan."; semua tombol simpan dan aksi nonaktif |

## Matriks cakupan endpoint

Semua 58 endpoint di Spesifikasi Admin dipakai minimal oleh satu halaman A01–A25, ditambah 5 endpoint dari API pengguna. Tidak ada halaman yang membutuhkan endpoint baru; ada empat field yang perlu dikonfirmasi ikut dikirim di response list (tabel kedua).

| Endpoint | Dipakai di |
| --- | --- |
| `POST /auth/google` | A01 |
| `POST /auth/token/refresh` | Global (penanganan 401) |
| `POST /auth/logout` | Top bar |
| `GET /me` | Global (guard), A01 |
| `POST /uploads` | A08, A14 |
| `GET /admin/users` | A03, A24, pemilih entitas akun (A08, A20, A21, A22, A24) |
| `POST /admin/users` | A05 |
| `GET /admin/users/{id}` | A04 |
| `PATCH /admin/users/{id}` | A05, A24 |
| `POST /admin/users/{id}/suspend` | A03, A04 |
| `POST /admin/users/{id}/activate` | A03, A04 |
| `DELETE /admin/users/{id}` | A03, A04 (termasuk `?hard=true`) |
| `POST /admin/users/{id}/restore` | A03, A04 |
| `GET /admin/stores` | A06, pemilih entitas toko (A09, A11, A15, A17) |
| `POST /admin/stores` | A08 |
| `GET /admin/stores/{id}` | A04 tab Profil toko, A08, A11 (jam operasional) |
| `PATCH /admin/stores/{id}` | A08 |
| `DELETE /admin/stores/{id}` | A04, A06 |
| `POST /admin/stores/{id}/restore` | A04, A06 |
| `GET /admin/umkms` | A07, pemilih entitas UMKM (A12, A14, A15, A17) |
| `POST /admin/umkms` | A08 |
| `GET /admin/umkms/{id}` | A04 tab Profil UMKM, A08, A18 (panel kanan) |
| `PATCH /admin/umkms/{id}` | A08 |
| `DELETE /admin/umkms/{id}` | A04, A07 |
| `POST /admin/umkms/{id}/restore` | A04, A07 |
| `GET /admin/opportunities` | A09, A15 (modal pengajuan, filter peluang) |
| `POST /admin/opportunities` | A11 |
| `GET /admin/opportunities/{id}` | A10, A11, A16 (jadwal terima barang) |
| `PATCH /admin/opportunities/{id}` | A11 |
| `POST /admin/opportunities/{id}/close` | A09, A10 |
| `POST /admin/opportunities/{id}/reopen` | A09, A10 |
| `DELETE /admin/opportunities/{id}` | A09, A10 (termasuk `?hard=true`) |
| `POST /admin/opportunities/{id}/restore` | A09, A10 |
| `GET /admin/products` | A12, A15 (modal pengajuan) |
| `POST /admin/products` | A14 |
| `GET /admin/products/{id}` | A13, A14 |
| `PATCH /admin/products/{id}` | A12, A13 (arsip/aktifkan), A14 |
| `DELETE /admin/products/{id}` | A12, A13 (termasuk `?hard=true`) |
| `POST /admin/products/{id}/restore` | A12, A13 |
| `GET /admin/applications` | A04 tab Kerja sama, A10, A15 |
| `POST /admin/applications` | A15 (modal) |
| `GET /admin/applications/{id}` | A16 |
| `PATCH /admin/applications/{id}` | A16 (ubah slot, koreksi angka, catatan, mode stok) |
| `POST /admin/applications/{id}/review` | A16 |
| `POST /admin/applications/{id}/force-status` | A16 |
| `DELETE /admin/applications/{id}?hard=true` | A16 |
| `GET /admin/stock` | A17 |
| `PATCH /admin/applications/{id}/items/{item_id}/stock` | A16, A17 |
| `GET /admin/categories` | A19, A09 & A12 (filter), A11 & A14 (pilihan) |
| `POST /admin/categories` | A19 |
| `PATCH /admin/categories/{id}` | A19 |
| `DELETE /admin/categories/{id}` | A19 |
| `GET /admin/legal-verifications` | A18, badge sidebar |
| `POST /admin/umkms/{id}/legal-verification` | A18 |
| `GET /admin/files` | A20 |
| `POST /admin/files/{id}/remove` | A13, A20 |
| `GET /admin/dashboard` | A02, badge sidebar |
| `GET /admin/notifications` | A21 tab Log |
| `POST /admin/notifications/{id}/resend-email` | A21 tab Log |
| `POST /admin/notifications/broadcast` | A21 tab Kirim pengumuman |
| `GET /admin/audit-logs` | A22, A04 tab Aktivitas, A24 (diangkat oleh), kartu Riwayat admin (A04, A10, A13, A16) |
| `GET /admin/audit-logs/{id}` | A22 panel samping |
| `GET /admin/exports/{resource}.csv` | A23, tombol "Ekspor CSV" di A03, A06, A07, A09, A12, A15, A17 |

### Field yang perlu dikonfirmasi ke backend

| Field | Endpoint | Dipakai di |
| --- | --- | --- |
| `stats` (peluang dibuka, item di rak; produk aktif, pengajuan aktif) ikut di setiap item list | `GET /admin/stores`, `GET /admin/umkms` | Kolom angka di A06 dan A07 |
| `application_counts` dan `created_by` ikut di setiap item list | `GET /admin/opportunities` | Kolom "Pengajuan baru" dan "Dibuat oleh" di A09 |
| `created_by` dan `active_placements` ikut di item list dan detail | `GET /admin/products`, `GET /admin/products/{id}` | A12, A13 |
| `store_profile` berisi `{ id, name }` di item list | `GET /admin/users` | Kolom "Toko / Usaha" di A03 dan penonaktifan opsi di pemilih pemilik A08 |

Audit log belum bisa diekspor ke CSV (resource `audit-logs` tidak ada di daftar ekspor); bila dibutuhkan untuk laporan pilot, tambahkan resource itu ke `GET /admin/exports/{resource}.csv`.
