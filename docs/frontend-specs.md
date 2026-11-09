# Spesifikasi Halaman & Konten — NTKM

Dokumen ini memetakan setiap halaman PWA, isi tiap section, dan endpoint yang dipanggil, mengikuti Spesifikasi API & Konten Landing Page.

## Konvensi umum frontend

Semua halaman memakai aturan yang sama untuk akses, format, error, dan state, supaya tiap halaman di bawah cukup menjelaskan isinya sendiri. Bahasa UI: Bahasa Indonesia dengan sapaan "Anda".

### Guard akses (dicek berurutan di setiap halaman non-publik)

1. Tidak ada token → arahkan ke `/masuk?next=<route asal>`.
2. Token ada, `roles` kosong (dari `GET /me`) → arahkan ke `/pilih-peran`.
3. Peran ada, onboarding peran aktif belum selesai (`onboarding.store_completed` / `umkm_completed` = false) → arahkan ke `/onboarding/toko` atau `/onboarding/umkm`.
4. Membuka halaman peran yang tidak dimiliki (mis. UMKM membuka `/toko/...`) → arahkan ke dashboard peran aktif.
5. Pengguna yang sudah login membuka `/`, `/masuk`, atau `/pilih-peran` (bila peran sudah ada) → arahkan ke dashboard peran aktif.

### Sesi & peran aktif

- Simpan `access` dan `refresh` dari `POST /auth/google`. Saat API menjawab 401, panggil `POST /auth/token/refresh` sekali lalu ulangi request; bila refresh gagal, hapus token dan arahkan ke `/masuk`.
- Peran aktif (`store` atau `umkm`) disimpan di perangkat. Default: satu-satunya peran yang dimiliki; bila punya dua, peran terakhir yang dipakai (awal: `store`).
- Semua endpoint dengan parameter `as` (`GET /applications`, `GET /stock`) mengirim peran aktif: `as=store` atau `as=umkm`.
- `GET /me` dipanggil sekali saat aplikasi dibuka dan setelah onboarding/ubah peran, lalu disimpan di state global.

### Format tampilan

| Data dari API | Contoh API | Tampilan |
| --- | --- | --- |
| Uang (integer rupiah) | `12500` | Rp12.500 |
| Persentase komisi | `{ "type": "percent", "value": 15 }` | Komisi 15% dari harga jual |
| Komisi nominal | `{ "type": "fixed", "value": 2000 }` | Komisi Rp2.000 per unit terjual |
| Tanggal | `2026-11-09` | Sen, 9 Nov 2026 |
| Tanggal + jam | `2026-11-04T15:30:00+07:00` | 4 Nov 2026, 15.30 |
| Jam / rentang jam | `08:00`, `10:00` | 08.00–10.00 |
| Waktu relatif (notifikasi, timeline) | `2026-11-04T15:30:00+07:00` | 5 menit lalu, 2 jam lalu, kemarin, lalu tanggal penuh setelah 7 hari |
| Jarak | `3.6` | 3,6 km |
| Hari | `mon`…`sun` | Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu |
| Masa simpan | `90` | 90 hari |

### Pemetaan error API ke UI

| `error.code` | Perilaku UI |
| --- | --- |
| `validation_error` (400) | Tampilkan pesan `details.<field>` di bawah input terkait, scroll ke field error pertama; pesan tanpa field (mis. `details.legal`, `details.non_field_errors`) tampil sebagai kotak peringatan di atas tombol simpan |
| `unauthenticated` (401) | Refresh token otomatis (lihat Sesi); gagal → `/masuk` dengan toast "Sesi Anda berakhir, silakan masuk lagi." |
| `permission_denied` (403) | Jalankan ulang guard akses; bila masih 403, tampilkan halaman "Akses tidak tersedia" |
| `not_found` (404) | Halaman "Data tidak ditemukan" dengan tombol kembali ke dashboard |
| `conflict` (409) | Dialog berisi `error.message` dengan tombol "Muat ulang" yang mengambil ulang data halaman (status kemungkinan sudah berubah) |
| `rate_limited` (429) | Toast "Terlalu banyak percobaan. Coba lagi sebentar lagi." |
| Gagal jaringan / 5xx | Banner "Gagal memuat data" + tombol "Coba lagi"; aksi form tetap bisa diulang tanpa kehilangan isian |

### State standar setiap halaman data

- Loading: skeleton sesuai bentuk konten (kartu, baris, form), bukan spinner layar penuh.
- Kosong: ilustrasi kecil, satu kalimat penjelasan, satu tombol aksi (disebut per halaman di bawah).
- Error: lihat tabel di atas.
- Offline: banner tipis "Anda sedang offline. Data mungkin tidak terbaru."; tombol simpan dinonaktifkan.

### Pola interaksi

- Daftar berpaginasi memakai muat otomatis saat scroll (infinite scroll) mengikuti `next`; pull-to-refresh di mobile.
- Tombol submit dinonaktifkan dan berlabel "Menyimpan…" saat request berjalan, mencegah kirim ganda.
- Aksi yang tidak bisa dibatalkan (kirim review, tolak, batalkan, selesaikan, tandai dikirim, konfirmasi terima, arsipkan produk, tutup peluang) wajib dialog konfirmasi.
- Setelah aksi berhasil: toast sukses singkat, lalu data halaman diambil ulang dari response atau refetch.
- Upload foto/dokumen: pilih file → validasi tipe & ukuran di client (jpg/png/webp/pdf, maks 5 MB) → `POST /uploads` dengan progress bar → pratinjau → simpan `id` sebagai `*_file_id(s)`. Gagal upload ditandai di thumbnail dengan tombol ulang.
- Badge lonceng diperbarui dengan `GET /notifications/unread-count` tiap 60 detik saat aplikasi aktif, dan saat aplikasi kembali ke foreground.

## Peta halaman

Aplikasi terdiri dari 22 halaman (P01–P22). Kode halaman dipakai di seluruh dokumen dan di matriks cakupan endpoint di bagian akhir.

&#91;embedded content: alur navigasi · toko dan UMKM\]

Pengguna masuk lewat P01–P03, menyelesaikan onboarding sesuai peran, lalu bekerja dari menu bawah; setiap pengajuan dan notifikasi bermuara di P19.

| Kode | Halaman | Route | Akses |
| --- | --- | --- | --- |
| P01 | Landing page | `/` | Publik |
| P02 | Masuk | `/masuk` | Publik |
| P03 | Pilih peran | `/pilih-peran` | Login |
| P04 | Profil toko (onboarding & ubah) | `/onboarding/toko`, `/profil/toko` | Login, peran `store` |
| P05 | Profil UMKM (onboarding & ubah) | `/onboarding/umkm`, `/profil/umkm` | Login, peran `umkm` |
| P06 | Beranda toko | `/toko` | `IsStore` |
| P07 | Peluang saya | `/toko/peluang` | `IsStore` |
| P08 | Form peluang (buat & ubah) | `/toko/peluang/baru`, `/toko/peluang/:id/ubah` | `IsStore` |
| P09 | Detail peluang (sisi toko) | `/toko/peluang/:id` | `IsStore` |
| P10 | Inbox pengajuan | `/toko/pengajuan` | `IsStore` |
| P11 | Stok di rak | `/toko/stok` | `IsStore` |
| P12 | Beranda UMKM | `/umkm` | `IsUmkm` |
| P13 | Produk saya | `/umkm/produk` | `IsUmkm` |
| P14 | Form produk (buat & ubah) | `/umkm/produk/baru`, `/umkm/produk/:id/ubah` | `IsUmkm` |
| P15 | Cari peluang (feed) | `/umkm/peluang` | `IsUmkm` |
| P16 | Detail peluang + ajukan | `/umkm/peluang/:id` | `IsUmkm` |
| P17 | Pengajuan saya | `/umkm/pengajuan` | `IsUmkm` |
| P18 | Stok produk saya di toko | `/umkm/stok` | `IsUmkm` |
| P19 | Detail kerja sama | `/kerja-sama/:id` | UMKM pengaju atau toko pemilik peluang |
| P20 | Notifikasi | `/notifikasi` | Login |
| P21 | Profil & pengaturan | `/profil` | Login |
| P22 | Halaman sistem (404, akses tidak tersedia, offline) | `*` | Semua |

Navigasi bawah (bottom nav) berbeda per peran aktif:

| Peran | Menu 1 | Menu 2 | Menu 3 | Menu 4 | Menu 5 |
| --- | --- | --- | --- | --- | --- |
| Toko | Beranda (P06) | Peluang (P07) | Pengajuan (P10) | Stok (P11) | Profil (P21) |
| UMKM | Beranda (P12) | Cari Peluang (P15) | Produk (P13) | Pengajuan (P17) | Profil (P21) |

P18 (stok UMKM) dibuka dari kartu di P12 dan tautan di P17. P19 dibuka dari kartu pengajuan, notifikasi, dan baris stok. P20 dibuka dari lonceng di header.

## Komponen global

Komponen ini dipakai berulang di banyak halaman; definisikan sekali di UI kit lalu pakai ulang, supaya label dan warna status selalu konsisten.

### Shell aplikasi

| Komponen | Isi | Data |
| --- | --- | --- |
| Header | Kiri: tombol kembali (halaman detail/form) atau judul halaman. Kanan: pengalih peran (hanya bila punya dua peran) dan lonceng notifikasi | `GET /me`, `GET /notifications/unread-count` |
| Lonceng notifikasi | Ikon lonceng + badge angka belum dibaca (tampil "99+" bila > 99, tersembunyi bila 0). Tap → P20 | `GET /notifications/unread-count` tiap 60 detik |
| Pengalih peran | Chip "Mode Toko" / "Mode UMKM". Tap → bottom sheet dua pilihan. Memilih peran yang onboarding-nya belum selesai → P04/P05 | `GET /me` |
| Navigasi bawah | 5 menu sesuai peran aktif (lihat Peta halaman), ikon + label, menu aktif disorot. Disembunyikan di P01–P05 dan di halaman form | — |
| Banner offline | Strip tipis di bawah header saat koneksi terputus | Event `online`/`offline` browser |
| Prompt pasang PWA | Kartu kecil "Pasang di layar utama" setelah kunjungan kedua; bisa ditutup dan tidak muncul lagi 14 hari | Event `beforeinstallprompt` |

### Chip & badge status

| Komponen | Nilai API → label | Warna |
| --- | --- | --- |
| Status kerja sama | `submitted` Diajukan · `approved` Disetujui · `in_delivery` Dalam pengiriman · `received` Diterima toko · `completed` Selesai · `rejected` Ditolak · `cancelled` Dibatalkan | Abu (diajukan), biru (disetujui, dalam pengiriman), hijau (diterima toko, selesai), merah (ditolak, dibatalkan) |
| Keputusan per produk | `pending` Menunggu · `approved` Disetujui · `rejected` Ditolak | Abu, hijau, merah |
| Status peluang | `open` Dibuka · `full` Kuota penuh · `closed` Ditutup | Hijau, kuning, abu |
| Stok | `available` Ada (mode angka: "Ada · 18") · `out_of_stock` Habis | Hijau, merah |
| Badge kecocokan | `high` Sangat cocok · `medium` Cocok · `low` Kurang cocok, beserta skor (mis. "Sangat cocok · 85") | Hijau, kuning, abu |

Tap badge kecocokan membuka bottom sheet "Kenapa cocok?" berisi `match.reasons`: ikon centang hijau bila `ok: true`, ikon silang merah bila `ok: false`, diikuti `label`.

### Kartu & baris berulang

| Komponen | Isi | Dipakai di |
| --- | --- | --- |
| Kartu peluang | Foto & nama toko, judul peluang, jarak (khusus UMKM), chip kategori, komisi, sisa kuota ("Sisa 2 dari 3 UMKM"), jadwal terima barang ringkas ("Sen & Kam, 08.00–10.00"), berlaku sampai, badge kecocokan (khusus UMKM) atau chip status peluang (khusus toko). Bila `my_application` ada: label "Sudah diajukan" + chip status | P06, P07, P12, P15 |
| Kartu pengajuan | Foto/logo + nama pihak lawan (`counterpart`), judul peluang, chip status, "2 produk · 1 disetujui", slot antar bila ada, waktu update relatif. Tap → P19 | P06, P10, P12, P17 |
| Kartu produk | Foto utama, nama, kategori, harga setor, harga jual saran, masa simpan, jumlah toko aktif (`active_placements`), label "Diarsipkan" bila tidak aktif | P13, P16 |
| Baris stok | Foto + nama produk, nama pihak lawan, harga jual, chip stok, waktu update stok. Sisi toko punya kontrol ubah stok | P11, P18, P19 |
| Kartu notifikasi | Ikon sesuai `type`, `title`, `body`, waktu relatif, titik biru bila belum dibaca | P20 |

### Input khusus

| Komponen | Perilaku |
| --- | --- |
| Pemilih lokasi | Peta Leaflet/OpenStreetMap dengan pin yang bisa digeser, tombol "Gunakan lokasi saya" (Geolocation API), tampil koordinat kecil di bawah peta. Menghasilkan `lat`, `lng` |
| Editor jam operasional | 7 baris Senin–Minggu: toggle "Buka/Tutup", input jam buka & tutup (langkah 15 menit), tombol "Salin ke semua hari". Menghasilkan `operating_hours[]` |
| Editor jadwal terima barang | Daftar slot: pilih hari, jam mulai, jam selesai, tombol tambah/hapus slot. Hari yang toko tutup tidak bisa dipilih |
| Upload foto/dokumen | Kotak "+ Tambah foto", thumbnail dengan progress, tombol hapus, seret untuk ubah urutan (foto pertama ditandai "Utama") |
| Input tagar | Ketik lalu Enter/koma menjadi chip; otomatis huruf kecil, spasi jadi tanda hubung, maks 10 |
| Input rupiah | Keyboard angka, tampil terformat "Rp12.500" saat diketik, dikirim sebagai integer |
| Kalkulator komisi | Dari harga jual + skema komisi menampilkan "Komisi toko Rp1.875 · UMKM menerima Rp10.625 per unit". Dihitung di client untuk pratinjau; angka final dari server (`commission_per_unit`, `umkm_income_per_unit`) |

### Umpan balik

- Toast: sukses (hijau), gagal (merah), info; hilang otomatis 4 detik.
- Dialog konfirmasi: judul berupa pertanyaan, satu kalimat dampak, tombol utama berlabel aksi (mis. "Ya, tolak"), tombol "Batal".
- Bottom sheet: untuk filter, pengalih peran, alasan kecocokan, dan form singkat (alasan batal, ubah stok).
- Skeleton & empty state: sesuai Konvensi umum.

## Halaman publik

### P01 · Landing page (`/`)

Tujuan: membuat pengunjung masuk dengan Google sesuai perannya. Halaman statis, tidak memanggil API; pengguna yang sudah login langsung diarahkan ke dashboard peran aktif.

| No | Section | Isi |
| --- | --- | --- |
| 1 | Header (sticky) | Logo; menu jangkar "Cara kerja" (`#cara-kerja`), "Untuk Toko" (`#untuk-toko`), "Untuk UMKM" (`#untuk-umkm`), "FAQ" (`#faq`); tombol "Masuk" → P02. Mobile: menu jadi hamburger |
| 2 | Hero | Headline "Produk UMKM lokal, langsung ke rak toko terdekat." · Subheadline "Toko membuka peluang, UMKM mengajukan produk. Jadwal antar, status kerja sama, sampai kabar stok habis tercatat rapi di satu aplikasi." · Tombol "Saya pemilik toko" → `/masuk?role=store` · Tombol "Saya pelaku UMKM" → `/masuk?role=umkm` · Teks kecil "Gratis selama masa pilot. Cukup masuk dengan akun Google." · Mockup layar feed peluang di HP |
| 3 | Strip bukti | "Sedang diuji bersama 2 toko ritel dan 5 UMKM di \[kota pilot\]" + nama/logo toko pilot (dengan izin) |
| 4 | Masalah yang diselesaikan | Kolom Toko: susah menemukan pemasok lokal yang legalitasnya jelas; catatan titip jual masih di buku; tidak tahu UMKM mana yang dekat dan bisa antar rutin. Kolom UMKM: sulit menembus rak toko ritel; tidak tahu syarat tiap toko; baru sadar stok habis saat datang ke toko |
| 5 | Cara kerja (`#cara-kerja`) | Toggle tab "Untuk Toko" / "Untuk UMKM" (tab terbuka mengikuti hash `#untuk-toko` / `#untuk-umkm`). Tab Toko: 1) Buat profil toko dan tandai lokasi di peta. 2) Pasang peluang: kategori, syarat, kuota, komisi, jadwal terima barang. 3) Tinjau pengajuan dan setujui per produk, sekaligus pilih slot antar dan harga jual. 4) Terima barang dan perbarui stok; UMKM otomatis dikabari saat habis. Tab UMKM: 1) Daftar dan isi legalitas usaha (NIB, PIRT, halal bila ada). 2) Unggah produk lengkap dengan foto, harga, masa simpan. 3) Temukan peluang toko terdekat dengan badge kecocokan. 4) Ajukan produk, antar sesuai jadwal, pantau status dan stok dari HP |
| 6 | Fitur utama | 6 kartu: Peluang terdekat (filter jarak & kategori) · Badge kecocokan · Persetujuan per produk · Jadwal antar terstruktur · Timeline status kerja sama · Notifikasi stok habis (aplikasi + email) |
| 7 | Komisi transparan | Kartu hitungan: harga jual Rp12.500, komisi toko 15% = Rp1.875, UMKM menerima Rp10.625 per unit terjual. Catatan: "Skema komisi ditentukan toko di tiap peluang dan terlihat sebelum Anda mengajukan." |
| 8 | Testimoni pilot | 2–3 kutipan asli peserta pilot (foto, nama, nama usaha). Section disembunyikan sampai kutipan tersedia |
| 9 | FAQ (`#faq`) | Accordion: Apakah berbayar? · Bagaimana komisi dihitung dan kapan dibayarkan? · Legalitas apa yang dibutuhkan UMKM? · Siapa yang mengantar barang? · Bagaimana kalau produk tidak laku atau mendekati kedaluwarsa? · Bisa jadi toko dan UMKM sekaligus? (Ya) · Perlu install aplikasi? (Tidak, buka di browser lalu "Tambahkan ke layar utama") · Bagaimana data saya dijaga? |
| 10 | CTA penutup | "Siap mulai?" + dua tombol yang sama dengan hero |
| 11 | Footer | Kontak WhatsApp & email, Kebijakan Privasi, Syarat & Ketentuan, media sosial, © tahun |

Catatan: jawaban FAQ soal pembayaran komisi dan produk tidak laku menunggu keputusan tim (belum diatur di MVP). Lacak klik setiap CTA secara terpisah per peran.

### P02 · Masuk (`/masuk`)

Tujuan: login satu langkah dengan Google. Query opsional: `role` (`store`/`umkm`, dari CTA landing) dan `next` (route tujuan dari guard).

| Section | Isi |
| --- | --- |
| Kepala | Logo, judul "Masuk", teks "Satu akun Google untuk toko maupun UMKM." Bila ada `role`: "Anda akan masuk sebagai pemilik toko" / "…sebagai pelaku UMKM" |
| Tombol login | Tombol resmi Google Identity Services "Masuk dengan Google" |
| Kaki | "Dengan masuk, Anda menyetujui Syarat & Ketentuan dan Kebijakan Privasi" (dua tautan); tautan "Kembali ke beranda" → P01 |

Alur setelah Google mengembalikan `id_token`:

1. `POST /auth/google` → simpan `access`, `refresh`, dan `user`.
2. Bila `user.roles` kosong dan ada `role` → `PUT /me/roles` dengan `[role]` → P04 atau P05.
3. Bila `user.roles` kosong tanpa `role` → P03.
4. Bila peran ada tapi onboarding belum selesai → P04/P05.
5. Selain itu → `next` (bila ada) atau dashboard peran aktif.

State: tombol menampilkan spinner "Sedang masuk…" selama request. Error 401 → kotak merah "Gagal masuk dengan Google. Silakan coba lagi." Popup diblokir → "Izinkan pop-up untuk masuk dengan Google."

### P03 · Pilih peran (`/pilih-peran`)

Tujuan: menentukan `roles`. Dibuka otomatis untuk pengguna baru tanpa peran, dan dari P21 ("Ubah peran") dengan pilihan saat ini sudah tercentang.

| Section | Isi |
| --- | --- |
| Judul | "Anda ingin memakai aplikasi sebagai apa?" · subjudul "Bisa diubah kapan saja di Profil." |
| Pilihan (kartu radio, satu dipilih) | "Pemilik toko" — "Cari produk UMKM lokal untuk rak toko Anda." · "Pelaku UMKM" — "Titipkan produk Anda di toko ritel terdekat." · "Keduanya" — "Saya punya toko dan juga memproduksi barang." |
| Tombol | "Lanjutkan" (nonaktif sampai ada pilihan) |

Aksi: `PUT /me/roles` dengan `["store"]`, `["umkm"]`, atau `["store","umkm"]` → `GET /me` → onboarding pertama yang belum selesai (urutan: toko, lalu UMKM) atau kembali ke P21 bila dibuka dari sana. Error 409 (melepas peran yang masih punya pengajuan aktif) → dialog berisi `error.message` dan pilihan tetap seperti sebelumnya.

## Onboarding & profil

P04 dan P05 memakai satu form yang sama dalam dua mode: mode onboarding (stepper 3 langkah, dari `/onboarding/...`) dan mode ubah (satu halaman berisi semua section, dari `/profil/...`). Kedua mode menyimpan dengan satu `PUT` di akhir.

### P04 · Profil toko (`/onboarding/toko`, `/profil/toko`)

Data awal: `GET /me/store-profile` (404 = belum ada, form kosong). Simpan: `PUT /me/store-profile`. Foto: `POST /uploads` dengan `purpose=store_photo`.

| Langkah / section | Field (key API) | Label & komponen | Wajib | Validasi & catatan |
| --- | --- | --- | --- | --- |
| 1 · Info toko | `name` | "Nama toko", teks | Ya | 3–100 karakter |
| 1 · Info toko | `phone` | "Nomor WhatsApp", input telepon | Ya | Diawali `08` atau `+62`; pesan "Masukkan nomor yang diawali 08 atau +62." |
| 1 · Info toko | `photo_file_id` | "Foto depan toko", upload 1 foto | Tidak | Membantu UMKM mengenali toko saat antar barang |
| 2 · Lokasi | `address` | "Alamat lengkap", textarea | Ya | Contoh placeholder: "Jl. Soekarno Hatta No. 12, Lowokwaru" |
| 2 · Lokasi | `lat`, `lng` | Pemilih lokasi (peta + "Gunakan lokasi saya") | Ya | Teks bantuan: "Geser pin tepat ke depan toko. Lokasi ini dipakai UMKM untuk menghitung jarak." |
| 3 · Jam operasional | `operating_hours[]` | Editor jam operasional 7 hari | Ya | Minimal 1 hari buka; jam tutup > jam buka; hari tutup kirim `is_closed: true` |

Tombol mode onboarding: "Lanjut" (langkah 1–2), "Kembali", dan "Simpan & mulai" (langkah 3). Indikator langkah "1 dari 3" di atas form. Tombol mode ubah: "Simpan perubahan", plus teks "Terakhir diperbarui <`updated_at`>".

Setelah berhasil: `GET /me` → toast "Profil toko tersimpan." → mode onboarding: lanjut ke P05 bila peran UMKM juga dipilih dan belum selesai, selain itu ke P06; mode ubah: kembali ke P21. Error 400 dikembalikan ke langkah yang memuat field error pertama.

### P05 · Profil UMKM (`/onboarding/umkm`, `/profil/umkm`)

Data awal: `GET /me/umkm-profile` (404 = form kosong; `owner_name` diisi awal dari `user.name`). Simpan: `PUT /me/umkm-profile`. Upload: `purpose=umkm_logo` untuk logo, `purpose=legal_document` untuk dokumen.

| Langkah / section | Field (key API) | Label & komponen | Wajib | Validasi & catatan |
| --- | --- | --- | --- | --- |
| 1 · Info usaha | `business_name` | "Nama usaha", teks | Ya | 3–100 karakter |
| 1 · Info usaha | `owner_name` | "Nama pemilik", teks | Ya | — |
| 1 · Info usaha | `phone` | "Nomor WhatsApp", input telepon | Ya | Format sama dengan toko |
| 1 · Info usaha | `description` | "Cerita singkat usaha", textarea | Tidak | Maks 300 karakter, penghitung karakter tampil |
| 1 · Info usaha | `logo_file_id` | "Logo atau foto usaha", upload 1 foto | Tidak | — |
| 2 · Lokasi produksi | `address` | "Alamat produksi", textarea | Ya | — |
| 2 · Lokasi produksi | `lat`, `lng` | Pemilih lokasi | Ya | Teks bantuan: "Dipakai untuk mencari toko terdekat dari tempat Anda." |
| 3 · Legalitas | `legal.nib` | "NIB (Nomor Induk Berusaha)", angka | Tidak | 13 digit; pesan "NIB terdiri dari 13 angka." |
| 3 · Legalitas | `legal.pirt_number` | "Nomor PIRT", teks | Tidak | — |
| 3 · Legalitas | `legal.halal_number` | "Nomor sertifikat halal", teks | Tidak | — |
| 3 · Legalitas | `legal_document_file_ids[]` | "Foto/scan dokumen", upload jpg/png/pdf, maks 5 file | Tidak | Tampil nama file + tombol lihat |

Kotak info di langkah 3: "Legalitas tidak wajib untuk mendaftar, tetapi banyak toko mensyaratkan NIB atau PIRT. Kelengkapan legalitas menaikkan badge kecocokan Anda." Di mode ubah, tampilkan ringkasan dari `legal.has_nib`, `has_pirt`, `has_halal` sebagai tiga chip centang/silang di atas section Legalitas.

Tombol & alur sama dengan P04. Setelah berhasil: `GET /me` → toast "Profil usaha tersimpan." → mode onboarding ke P12 (yang menampilkan langkah "Tambah produk pertama"); mode ubah kembali ke P21.

## Halaman toko

### P06 · Beranda toko (`/toko`)

Tujuan: menunjukkan apa yang perlu dikerjakan toko hari ini. Tidak ada endpoint dashboard khusus; angka diambil dari `count` endpoint list (pakai `page_size=1` bila hanya butuh angka).

| Section | Isi | Data |
| --- | --- | --- |
| Sapaan | "Halo, \<nama toko>" + tanggal hari ini | `GET /me` |
| Langkah awal (hanya bila belum ada peluang) | Kartu "Pasang peluang pertama Anda agar UMKM sekitar bisa mengajukan produk." + tombol "Pasang peluang" → P08 | `GET /me/opportunities` (`count` = 0) |
| Ringkasan (4 kartu angka, masing-masing bisa di-tap) | "Pengajuan baru" → P10 tab Baru · "Barang akan datang" (disetujui + dalam pengiriman) → P10 tab Disetujui · "Stok habis" → P11 filter Habis · "Peluang aktif" → P07 tab Dibuka | `GET /applications?as=store&status=submitted`, `…status=approved`, `…status=in_delivery`, `GET /stock?as=store&stock_status=out_of_stock`, `GET /me/opportunities?status=open` |
| Perlu ditinjau | Maks 3 kartu pengajuan `submitted` terbaru + tautan "Lihat semua" → P10. Kosong: "Belum ada pengajuan baru." | `GET /applications?as=store&status=submitted` |
| Jadwal antar mendatang | Daftar pengajuan `approved` dan `in_delivery`, urut `delivery_slot.start_at` terdekat: tanggal & jam slot, nama UMKM, jumlah produk, chip status. Slot hari ini diberi label "Hari ini". Tap → P19. Kosong: "Belum ada jadwal antar." | Dua request di atas |
| Stok habis | Maks 3 baris stok habis + "Lihat semua" → P11. Section disembunyikan bila 0 | `GET /stock?as=store&stock_status=out_of_stock` |
| Tombol mengambang | "+ Pasang peluang" → P08 | — |

### P07 · Peluang saya (`/toko/peluang`)

Data: `GET /me/opportunities?status=<tab>`.

| Section | Isi |
| --- | --- |
| Header | Judul "Peluang saya" + tombol "+ Peluang baru" → P08 |
| Tab status | Semua · Dibuka (`open`) · Kuota penuh (`full`) · Ditutup (`closed`) |
| Daftar | Kartu peluang versi toko: judul, chip status, kategori, komisi, kuota terpakai "1/3 UMKM", jadwal terima ringkas, berlaku sampai, dan "2 pengajuan baru" dari `application_counts.submitted` (disorot bila > 0). Tap → P09 |
| Kosong | Tab Semua: "Belum ada peluang. Pasang peluang agar UMKM sekitar bisa mengajukan produk." + tombol "Pasang peluang". Tab lain: "Tidak ada peluang dengan status ini." |

### P08 · Form peluang (`/toko/peluang/baru`, `/toko/peluang/:id/ubah`)

Data: `GET /categories`, `GET /me/store-profile` (untuk membatasi jadwal sesuai jam operasional). Mode ubah juga `GET /me/opportunities/{id}`. Simpan: `POST /me/opportunities` atau `PATCH /me/opportunities/{id}` (mode ubah hanya mengirim field yang berubah).

| Section | Field (key API) | Label & komponen | Wajib | Validasi & catatan |
| --- | --- | --- | --- | --- |
| 1 · Info dasar | `title` | "Judul peluang", teks; placeholder "Cari camilan lokal untuk rak dekat kasir" | Ya | 5–120 karakter |
| 1 · Info dasar | `description` | "Deskripsi", textarea; placeholder "Ukuran rak, target pembeli, dll." | Tidak | Maks 500 karakter |
| 2 · Produk yang dicari | `category_ids[]` | "Kategori", chip multi-pilih dari `/categories` | Ya | Minimal 1 |
| 2 · Produk yang dicari | `requirements.min_shelf_life_days` | "Masa simpan minimal", angka + akhiran "hari" | Tidak | ≥ 1 |
| 2 · Produk yang dicari | `requirements.max_retail_price` | "Harga jual maksimal", input rupiah | Tidak | > 0 |
| 3 · Syarat legalitas | `requirements.requires_nib`, `requires_pirt`, `requires_halal` | Tiga toggle: "Wajib NIB", "Wajib PIRT", "Wajib sertifikat halal" | — | Default semua mati |
| 3 · Syarat legalitas | `requirements.notes` | "Syarat lain", textarea; placeholder "Kemasan wajib mencantumkan komposisi." | Tidak | Maks 300 karakter |
| 4 · Kuota | `quota` | "Jumlah UMKM yang diterima", stepper | Ya | 1–50; mode ubah: tidak boleh < `quota_used` (tampil "Sudah terpakai: 1") |
| 4 · Kuota | `max_products_per_umkm` | "Maksimal produk per UMKM", stepper | Ya | 1–10, default 3 |
| 5 · Komisi | `commission.type` | Radio "Persentase dari harga jual" / "Nominal per unit terjual" | Ya | Default persentase |
| 5 · Komisi | `commission.value` | Angka + akhiran "%" atau input rupiah | Ya | Persentase 1–50; nominal > 0 |
| 5 · Komisi | — | Kalkulator komisi dengan contoh harga jual Rp10.000 (bisa diubah) | — | Hanya pratinjau, tidak dikirim |
| 6 · Jadwal terima barang | `receiving_schedule[]` | Editor jadwal terima barang | Ya | Minimal 1 slot; slot harus di dalam jam operasional (pesan "Toko tutup pada jam ini.") |
| 7 · Masa berlaku | `valid_until` | "Berlaku sampai", pemilih tanggal | Ya | ≥ hari ini; default +30 hari |

Tombol: "Pasang peluang" (buat) atau "Simpan perubahan" (ubah), dan "Batal" (konfirmasi bila form sudah diisi). Mode ubah menampilkan kotak info: "Perubahan komisi dan syarat hanya berlaku untuk pengajuan baru." Peluang `closed` tidak bisa dibuka di mode ubah (tombol "Ubah" disembunyikan di P09). Setelah berhasil → toast "Peluang dipasang." / "Perubahan disimpan." → P09.

### P09 · Detail peluang, sisi toko (`/toko/peluang/:id`)

Data: `GET /me/opportunities/{id}`, `GET /applications?as=store&opportunity_id={id}&status=<tab>`.

| Section | Isi |
| --- | --- |
| Kepala | Judul, chip status peluang, "Berlaku sampai \<valid\_until>", dibuat \<created\_at> |
| Kuota | Progress bar `quota_used`/`quota` dengan teks "1 dari 3 UMKM disetujui", plus angka pengajuan per status dari `application_counts` |
| Detail | Deskripsi, kategori (chip), syarat (masa simpan minimal, harga jual maksimal, legalitas wajib, syarat lain), komisi (format Konvensi umum), maksimal produk per UMKM, jadwal terima barang per hari |
| Pengajuan untuk peluang ini | Tab Baru · Disetujui · Dalam pengiriman · Aktif · Riwayat, berisi kartu pengajuan → P19. Kosong: "Belum ada pengajuan untuk peluang ini." |
| Aksi (bawah) | "Ubah" → P08 (tidak tampil bila `closed`) · "Tutup peluang" (tidak tampil bila `closed`) → dialog "Tutup peluang ini? Peluang tidak akan tampil lagi di feed UMKM. Pengajuan yang masuk tetap bisa Anda tinjau." → `POST /me/opportunities/{id}/close` → toast "Peluang ditutup." |

### P10 · Inbox pengajuan (`/toko/pengajuan`)

Data: `GET /applications?as=store&status=<tab>&opportunity_id=<filter>`; daftar peluang untuk filter dari `GET /me/opportunities`.

| Section | Isi |
| --- | --- |
| Header | Judul "Pengajuan" + tombol filter "Semua peluang ▾" (bottom sheet daftar peluang) |
| Tab status | Baru (`submitted`, dengan badge angka) · Disetujui (`approved`) · Dalam pengiriman (`in_delivery`) · Aktif (`received`) · Riwayat (`rejected`, `completed`, `cancelled`) |
| Daftar | Kartu pengajuan; tab Disetujui & Dalam pengiriman menampilkan slot antar di baris kedua dan diurutkan slot terdekat; tab lain diurutkan `updated_at` terbaru |
| Kosong | Baru: "Belum ada pengajuan baru. UMKM yang tertarik dengan peluang Anda akan muncul di sini." · Lainnya: "Tidak ada pengajuan di sini." |

### P11 · Stok di rak (`/toko/stok`)

Data: `GET /stock?as=store&stock_status=<filter>`. Ubah: `PATCH /applications/{application_id}/items/{item_id}/stock`.

| Section | Isi |
| --- | --- |
| Ringkasan | "\<N> produk UMKM di rak · \<M> habis" (dari dua `count`) |
| Filter | Chip Semua · Ada · Habis |
| Daftar | Baris stok, item habis di urutan atas. Mode angka: stepper −/+ dan input jumlah, tersimpan otomatis 1 detik setelah berhenti mengetik. Mode ada/habis: toggle "Ada / Habis". Baris menampilkan "Diperbarui \<waktu relatif>". Tap area produk → P19 |
| Konfirmasi habis | Saat jumlah jadi 0 atau toggle ke Habis: dialog "Tandai habis? \<Nama UMKM> akan menerima notifikasi untuk kirim ulang." Batal mengembalikan nilai sebelumnya |
| Kosong | "Belum ada produk UMKM di rak. Produk muncul di sini setelah Anda mengonfirmasi barang diterima." |

Setelah PATCH berhasil: baris diperbarui dari response, toast "Stok diperbarui." Error 409 (pengajuan sudah tidak `received`) → dialog lalu muat ulang daftar.

## Halaman UMKM

### P12 · Beranda UMKM (`/umkm`)

Tujuan: mengarahkan UMKM ke langkah berikutnya: tambah produk, ajukan, antar, dan pantau stok.

| Section | Isi | Data |
| --- | --- | --- |
| Sapaan | "Halo, \<nama usaha>" + tanggal hari ini | `GET /me` |
| Langkah awal (hilang bila semua selesai) | Checklist 3 langkah: "Lengkapi profil usaha" (selalu centang) · "Tambah produk pertama" → P14 · "Ajukan ke peluang pertama" → P15 | `GET /me/products` (`count`), `GET /applications?as=umkm` (`count`) |
| Pengingat legalitas | Kartu kuning bila `has_nib` atau `has_pirt` false: "Lengkapi NIB dan PIRT untuk membuka lebih banyak peluang." → `/profil/umkm` | `GET /me/umkm-profile` |
| Ringkasan (4 kartu angka) | "Menunggu keputusan" → P17 tab Menunggu · "Siap diantar" → P17 tab Disetujui · "Dijual di toko" → P17 tab Dijual · "Stok habis" → P18 filter Habis | `GET /applications?as=umkm&status=submitted`, `…approved`, `…received`, `GET /stock?as=umkm&stock_status=out_of_stock` |
| Jadwal antar mendatang | Pengajuan `approved` dan `in_delivery`, urut slot terdekat: tanggal & jam slot, nama toko, jumlah produk disetujui, chip status, label "Hari ini"/"Besok". Tap → P19. Kosong: "Belum ada jadwal antar." | `GET /applications?as=umkm&status=approved`, `…in_delivery` |
| Peluang cocok untuk Anda | Maks 3 kartu peluang + "Lihat semua" → P15. Kosong: "Belum ada peluang yang sangat cocok di sekitar Anda." + "Cari peluang" | `GET /opportunities?match=high&sort=match&page_size=3` |
| Stok habis | Maks 3 baris stok habis + "Lihat semua" → P18. Disembunyikan bila 0 | `GET /stock?as=umkm&stock_status=out_of_stock` |

### P13 · Produk saya (`/umkm/produk`)

Data: `GET /me/products?search=&category=&is_active=`, `GET /categories`.

| Section | Isi |
| --- | --- |
| Header | Judul "Produk saya" + tombol "+ Produk" → P14 |
| Pencarian & filter | Kolom cari (cari setelah berhenti mengetik 400 ms) dan chip kategori (gulir horizontal) |
| Tab | Aktif (`is_active=true`) · Diarsipkan (`is_active=false`) |
| Daftar | Kartu produk; teks "Dijual di 2 toko" dari `active_placements`. Tap → P14 mode ubah. Menu "⋯": tab Aktif → "Ubah", "Arsipkan"; tab Diarsipkan → "Aktifkan lagi" |
| Kosong | Aktif: "Belum ada produk. Tambahkan produk agar bisa mengajukan ke toko." + "Tambah produk" · Diarsipkan: "Tidak ada produk yang diarsipkan." |

Arsipkan: dialog "Arsipkan \<nama produk>? Produk tidak bisa dipilih untuk pengajuan baru." → `DELETE /me/products/{id}` → toast "Produk diarsipkan." Error 409 → dialog "Produk masih ada di pengajuan aktif." Aktifkan lagi: `PATCH /me/products/{id}` dengan `{ "is_active": true }`.

### P14 · Form produk (`/umkm/produk/baru`, `/umkm/produk/:id/ubah`)

Data: `GET /categories`; mode ubah `GET /me/products/{id}`. Simpan: `POST /me/products` atau `PATCH /me/products/{id}`. Foto: `POST /uploads` dengan `purpose=product_photo`.

| Section | Field (key API) | Label & komponen | Wajib | Validasi & catatan |
| --- | --- | --- | --- | --- |
| 1 · Foto | `photo_file_ids[]` | Upload foto 1–5, seret untuk mengurutkan, foto pertama berlabel "Utama" | Ya | Pesan "Tambahkan minimal 1 foto." |
| 2 · Info produk | `name` | "Nama produk", teks; placeholder "Keripik Tempe Pedas 100 g" | Ya | 3–100 karakter; teks bantuan "Sertakan ukuran atau berat." |
| 2 · Info produk | `category_id` | "Kategori", pilihan tunggal dari `/categories` | Ya | — |
| 2 · Info produk | `description` | "Deskripsi", textarea | Tidak | Maks 500 karakter |
| 2 · Info produk | `tags[]` | "Tagar", input tagar; contoh "pedas, oleh-oleh" | Tidak | Maks 10, maks 30 karakter |
| 3 · Harga | `base_price` | "Harga setor ke toko", input rupiah | Ya | > 0 |
| 3 · Harga | `suggested_retail_price` | "Harga jual yang disarankan", input rupiah | Ya | ≥ harga setor; pesan "Harga jual tidak boleh lebih rendah dari harga setor." |
| 3 · Harga | — | Teks hitung otomatis "Selisih untuk toko: Rp3.000 per unit" | — | Hanya tampilan |
| 4 · Kedaluwarsa | `shelf_life_days` atau `expiry_date` | Radio "Masa simpan (hari)" / "Tanggal kedaluwarsa tetap", lalu input angka atau pemilih tanggal | Ya, salah satu | Field yang tidak dipilih dikirim `null` |

Mode ubah menambah: teks "Sedang dijual di \<active\_placements> toko" di atas form, dan section "Arsipkan produk" di paling bawah (aturan sama dengan P13). Tombol: "Simpan produk" / "Simpan perubahan" dan "Batal". Setelah berhasil → toast "Produk disimpan." → kembali ke halaman asal (P13, atau P16 bila dibuka dari sana lewat parameter `return`).

### P15 · Cari peluang (`/umkm/peluang`)

Data: `GET /opportunities?lat=&lng=&radius_km=&category=&match=&sort=&page=`. Filter disimpan di URL agar bisa dibagikan dan bertahan saat kembali dari P16.

| Section | Isi |
| --- | --- |
| Header | Judul "Cari peluang" + teks asal lokasi "Dari lokasi usaha Anda ▾" (pilihan "Gunakan lokasi saat ini" mengirim `lat`/`lng` dari GPS) |
| Bar filter (chip gulir horizontal) | Jarak: 1 · 3 · 5 (default) · 10 · 25 km → `radius_km` · Kategori (bottom sheet multi-pilih, default kategori produk Anda) → `category` · Kecocokan: Semua · Sangat cocok · Cocok · Kurang cocok → `match` · Urutkan: Paling cocok (default) · Terdekat · Terbaru → `sort` · Tombol "Atur ulang" |
| Banner tanpa produk | Bila UMKM belum punya produk aktif: "Tambahkan produk dulu agar bisa mengajukan." → P14 |
| Hasil | "\<count> peluang ditemukan", lalu kartu peluang versi UMKM (jarak, badge kecocokan, sisa kuota, status pengajuan Anda bila ada). Tap → P16 |
| Kosong | "Belum ada peluang dalam radius \<n> km." + tombol "Perluas ke \<n berikutnya> km" (sembunyi di 25 km) |

Catatan: tampilan peta interaktif penuh termasuk Tahap 2, jadi feed MVP hanya berupa daftar.

### P16 · Detail peluang + ajukan (`/umkm/peluang/:id`)

Data: `GET /opportunities/{id}`. Kirim: `POST /applications`.

| Section | Isi |
| --- | --- |
| Kepala toko | Foto & nama toko, alamat, jarak, jam operasional (dapat dibuka-tutup, dari `store.operating_hours`) |
| Ringkasan peluang | Judul, kategori, "Sisa \<quota\_remaining> dari \<quota> UMKM", "Berlaku sampai \<valid\_until>" |
| Kecocokan | Badge kecocokan besar + daftar `match.reasons` terbuka (centang/silang + label) |
| Detail & syarat | Deskripsi; syarat: masa simpan minimal, harga jual maksimal, legalitas wajib, syarat lain (`requirements.notes`); maksimal \<max\_products\_per\_umkm> produk per UMKM |
| Komisi | Teks skema komisi + kalkulator komisi memakai harga jual saran produk layak pertama |
| Jadwal terima barang | Daftar hari & jam, mis. "Senin, 08.00–10.00"; teks "Toko akan memilih salah satu slot saat menyetujui." |
| Pilih produk | Daftar `my_products` dengan checkbox. `eligible: true` bisa dipilih; `eligible: false` nonaktif dengan `ineligible_reasons` di bawah nama. Penghitung "1 dari maks 3 dipilih"; checkbox lain terkunci bila batas tercapai. Tautan "+ Tambah produk baru" → P14 (`return` ke halaman ini) |
| Catatan untuk toko | `note`, textarea opsional maks 300 karakter; placeholder "Mis. kapasitas produksi, hari antar yang bisa." |
| Tombol (sticky bawah) | "Ajukan \<n> produk" (nonaktif bila 0 dipilih) → dialog ringkasan (toko, produk terpilih, komisi) → `POST /applications` → toast "Pengajuan terkirim." → P19 |

Kondisi khusus: bila `my_application` ada, section Pilih produk, Catatan, dan tombol diganti kartu "Anda sudah mengajukan" + chip status + "Lihat pengajuan" → P19. Bila `quota_remaining` = 0 atau peluang tidak lagi tersedia (404/409): banner "Peluang ini sudah penuh atau ditutup." dan tombol nonaktif. Error 400 `details.legal` → kotak peringatan berisi pesannya + tautan "Lengkapi legalitas" → `/profil/umkm`.

### P17 · Pengajuan saya (`/umkm/pengajuan`)

Data: `GET /applications?as=umkm&status=<tab>`.

| Section | Isi |
| --- | --- |
| Header | Judul "Pengajuan saya" + tautan "Stok di toko" → P18 |
| Tab status | Menunggu (`submitted`) · Disetujui (`approved`, badge angka) · Dalam pengiriman (`in_delivery`) · Dijual (`received`) · Riwayat (`rejected`, `completed`, `cancelled`) |
| Daftar | Kartu pengajuan dengan nama toko sebagai `counterpart`. Tab Disetujui menampilkan slot antar dan diurutkan slot terdekat |
| Kosong | Menunggu: "Belum ada pengajuan. Temukan peluang yang cocok untuk produk Anda." + "Cari peluang" → P15 · Lainnya: "Tidak ada pengajuan di sini." |

### P18 · Stok produk saya di toko (`/umkm/stok`)

Data: `GET /stock?as=umkm&stock_status=<filter>`. Halaman hanya-baca: stok diubah oleh toko.

| Section | Isi |
| --- | --- |
| Ringkasan | "\<N> produk dijual di toko · \<M> habis" |
| Filter | Chip Semua · Ada · Habis |
| Daftar | Baris stok (nama toko sebagai `counterpart`), item habis di atas dengan latar merah muda dan teks "Hubungi toko untuk kirim ulang". Tap → P19 |
| Kosong | "Belum ada produk Anda yang dijual di toko." |

## P19 · Detail kerja sama (`/kerja-sama/:id`)

Satu halaman untuk toko dan UMKM; isi dan tombol berubah sesuai peran aktif, `status`, dan `available_actions` dari server. Frontend tidak menghitung sendiri aksi yang boleh dilakukan.

Data: `GET /applications/{id}`, `GET /applications/{id}/timeline`. Khusus toko saat status `submitted`: `GET /me/opportunities/{opportunity.id}` untuk `receiving_schedule`. Aksi: `POST /applications/{id}/review`, `/ship`, `/receive`, `/complete`, `/cancel`, dan `PATCH /applications/{id}/items/{item_id}/stock`.

### Section 1 · Kepala

- Chip status kerja sama dan judul peluang (tap → P09 untuk toko, P16 untuk UMKM).
- Kartu pihak lawan: toko melihat logo & nama UMKM plus tiga chip legalitas dari `umkm.legal` (NIB, PIRT, Halal: centang/silang); UMKM melihat foto, nama, dan alamat toko.
- "Diajukan \<created\_at>" · "Diperbarui \<updated\_at>".

### Section 2 · Banner langkah berikutnya

| Status | Teks untuk toko | Teks untuk UMKM |
| --- | --- | --- |
| `submitted` | "Tinjau produk di bawah, lalu setujui atau tolak." | "Menunggu keputusan toko." |
| `approved` | "Menunggu UMKM mengantar pada \<slot>." | "Antar barang ke \<toko> pada \<slot>. Tekan Tandai dikirim saat berangkat." |
| `in_delivery` | "Barang dalam perjalanan. Konfirmasi saat sudah diterima." | "Menunggu toko mengonfirmasi penerimaan." |
| `received` | "Produk sedang dijual. Perbarui stok saat terjual." | "Produk sedang dijual. Anda akan dikabari saat stok habis." |
| `completed` | "Kerja sama selesai." | "Kerja sama selesai." |
| `rejected` | "Anda menolak semua produk." | "Toko menolak semua produk. Lihat alasannya di bawah." |
| `cancelled` | "Kerja sama dibatalkan." + alasan (catatan event terakhir di timeline) | Sama |

### Section 3 · Jadwal antar (tampil bila `delivery_slot` ada)

Tanggal dan jam slot ("Senin, 9 Nov 2026 · 08.00–10.00"), label "Hari ini"/"Besok" bila relevan, alamat toko (untuk UMKM), dan `review_note` sebagai "Catatan dari toko".

### Section 4 · Skema komisi

Teks dari `opportunity.commission`, mis. "Komisi toko 15% dari harga jual."

### Section 5 · Produk dalam pengajuan

Satu kartu per `items[]`:

| Bagian kartu | Tampil saat | Isi |
| --- | --- | --- |
| Info produk | Selalu | Foto, nama, harga setor (`base_price`), harga jual saran, masa simpan, chip keputusan |
| Hasil persetujuan | `decision` = `approved` | "Jumlah disetujui: 24" · "Harga jual: Rp12.500" · "Komisi toko: Rp1.875/unit" · "Diterima UMKM: Rp10.625/unit" |
| Alasan tolak | `decision` = `rejected` | "Alasan: \<reject\_reason>" |
| Penerimaan & stok | Status `received` atau `completed` | "Diterima: 24 unit" + chip stok. Toko pada status `received` (aksi `update_stock`): kontrol stok sama dengan P11. UMKM: hanya-baca |

Di bawah daftar: "Catatan dari UMKM" berisi `note` bila ada.

### Section 6 · Form approval (hanya toko, status `submitted`, aksi `review`)

Menggantikan tampilan Section 5 menjadi form per produk.

| Bagian | Field (key API) | Komponen | Aturan |
| --- | --- | --- | --- |
| Per produk | `items[].decision` | Segmented "Setujui" / "Tolak" (awal belum dipilih) | Semua produk wajib diputuskan; tombol kirim nonaktif sampai lengkap |
| Per produk disetujui | `items[].approved_quantity` | Stepper "Jumlah yang diterima" | ≥ 1 |
| Per produk disetujui | `items[].sell_price` | Input rupiah "Harga jual di toko", awal = harga jual saran | ≥ harga setor; pesan "Harga jual minimal Rp\<base\_price>." |
| Per produk disetujui | — | Kalkulator komisi langsung di bawah harga | Pratinjau saja |
| Per produk ditolak | `items[].reject_reason` | Chip cepat "Kategori sudah penuh", "Harga tidak sesuai", "Kemasan belum memenuhi syarat", "Lainnya" + textarea | Wajib diisi |
| Slot antar (tampil bila ≥ 1 disetujui) | `delivery_slot.date` | Pilihan tanggal 14 hari ke depan, mulai besok, hanya hari yang ada di `receiving_schedule` | Wajib |
| Slot antar | `delivery_slot.start`, `end` | Pilihan slot jam dari `receiving_schedule` hari tersebut | Wajib |
| Pencatatan stok | `stock_mode` | Radio "Catat jumlah (angka)" (default) / "Cukup ada atau habis" | — |
| Catatan | `note` | Textarea "Catatan untuk UMKM"; placeholder "Mis. bawa nota serah terima." | Opsional, maks 300 karakter |

Ringkasan sticky di bawah: "1 disetujui · 1 ditolak" + tombol "Kirim keputusan". Konfirmasi: "Kirim keputusan? Keputusan tidak bisa diubah setelah dikirim." Bila semua ditolak, judul dialog menjadi "Tolak semua produk?". Error 409 kuota penuh → dialog "Kuota peluang sudah penuh. Tambah kuota di peluang atau tolak pengajuan ini." dengan tautan "Ubah peluang" → P08.

### Section 7 · Tombol aksi (sticky bawah, sesuai `available_actions`)

| Aksi | Label tombol | Interaksi | Request | Toast sukses |
| --- | --- | --- | --- | --- |
| `ship` (UMKM) | "Tandai dikirim" (utama) | Bottom sheet catatan opsional, mis. "Nama kurir" | `POST /ship` dengan `note` | "Ditandai dalam pengiriman." |
| `receive` (toko) | "Konfirmasi barang diterima" (utama) | Bottom sheet per produk disetujui: stepper "Jumlah diterima" (awal = `approved_quantity`, rentang 0 s.d. jumlah disetujui) + catatan | `POST /receive` dengan `items[]` dan `note` | "Barang diterima. Produk masuk ke Stok di rak." |
| `complete` (keduanya) | "Selesaikan kerja sama" (sekunder) | Dialog "Selesaikan kerja sama ini? Stok tidak bisa diubah lagi." + catatan opsional | `POST /complete` dengan `note` | "Kerja sama diselesaikan." |
| `cancel` (keduanya) | "Batalkan" (teks merah) | Bottom sheet alasan wajib, chip cepat "Produksi terhambat", "Jadwal tidak cocok", "Lainnya" | `POST /cancel` dengan `reason` | "Pengajuan dibatalkan." |
| `review` (toko) | Ditangani Section 6 | — | — | "Keputusan terkirim. UMKM akan dikabari." |
| `update_stock` (toko) | Ditangani Section 5 | — | — | "Stok diperbarui." |

Setelah aksi berhasil: ganti data halaman dengan response, ambil ulang timeline, dan perbarui badge lonceng. Error 409 (status sudah berubah oleh pihak lain) → dialog lalu muat ulang halaman.

### Section 8 · Timeline status

Daftar vertikal dari `GET /applications/{id}/timeline`, urut lama → baru, event terbaru disorot. Tiap event: titik berwarna sesuai `to_status`, `label`, "oleh \<actor.name> (Toko/UMKM)", `note` bila ada (teks miring), dan waktu relatif. Kosong tidak mungkin terjadi (selalu ada event `submitted`).

## Halaman bersama

### P20 · Notifikasi (`/notifikasi`)

Data: `GET /notifications?unread=<tab>`. Aksi: `POST /notifications/{id}/read`, `POST /notifications/read-all`.

| Section | Isi |
| --- | --- |
| Header | Judul "Notifikasi" + tombol teks "Tandai semua dibaca" (nonaktif bila tidak ada yang belum dibaca) |
| Tab | Semua · Belum dibaca (`unread=true`) |
| Daftar | Kartu notifikasi dikelompokkan "Hari ini", "Kemarin", "Sebelumnya" |
| Kosong | Semua: "Belum ada notifikasi." · Belum dibaca: "Semua notifikasi sudah dibaca." |

Ikon per `type`: `application_submitted` (amplop masuk), `application_approved` (centang hijau), `application_rejected` (silang merah), `application_status_changed` (truk/panah), `stock_out` (kotak kosong merah).

Tap kartu: `POST /notifications/{id}/read` (tanpa menunggu) → buka `data.deeplink` (P19). Bila notifikasi untuk peran yang sedang tidak aktif (mis. `application_submitted` saat mode UMKM), pindahkan peran aktif ke `store` dulu dengan toast "Beralih ke Mode Toko". "Tandai semua dibaca" → `POST /notifications/read-all` → semua titik biru hilang, badge lonceng jadi 0.

### P21 · Profil & pengaturan (`/profil`)

Data: `GET /me`, plus `GET /me/store-profile` dan/atau `GET /me/umkm-profile` untuk ringkasan.

| Section | Isi |
| --- | --- |
| Akun | Foto, nama, dan email Google (`avatar_url`, `name`, `email`); teks kecil "Data akun mengikuti akun Google Anda." |
| Peran saya | Chip peran yang dimiliki + tombol "Ubah peran" → P03. Bila baru punya satu peran: tombol "Daftarkan juga sebagai UMKM" / "…sebagai pemilik toko" → P03 dengan pilihan "Keduanya" tercentang |
| Profil toko (bila peran `store`) | Foto, nama, alamat, jumlah hari buka; tombol "Ubah" → `/profil/toko` |
| Profil UMKM (bila peran `umkm`) | Logo, nama usaha, alamat, tiga chip legalitas; tombol "Ubah" → `/profil/umkm` |
| Notifikasi email | Teks "Notifikasi email dikirim ke \<email>." (MVP belum punya pengaturan notifikasi) |
| Bantuan | Hubungi admin lewat WhatsApp · FAQ (→ P01 `#faq`) · Syarat & Ketentuan · Kebijakan Privasi |
| Tentang | Versi aplikasi |
| Keluar | Tombol merah "Keluar" → dialog "Keluar dari akun ini?" → `POST /auth/logout` → hapus token & peran aktif → P01 |

### P22 · Halaman sistem

| Halaman | Kapan | Isi |
| --- | --- | --- |
| Tidak ditemukan | Route tidak dikenal atau API 404 | Ilustrasi, "Halaman atau data tidak ditemukan.", tombol "Kembali ke beranda" |
| Akses tidak tersedia | API 403 setelah guard dijalankan ulang | "Halaman ini khusus untuk \<pemilik toko/UMKM>.", tombol "Ganti mode" (bila punya peran itu) atau "Kembali ke beranda" |
| Offline | Membuka halaman yang belum tersimpan di cache saat offline | "Anda sedang offline. Periksa koneksi internet Anda.", tombol "Coba lagi" |
| Kesalahan server | API 5xx berulang di pemuatan awal halaman | "Terjadi kesalahan di server. Coba beberapa saat lagi.", tombol "Coba lagi" |

Service worker PWA menyimpan shell aplikasi (HTML, CSS, JS, ikon) agar halaman sistem Offline selalu bisa tampil; data API tidak disimpan offline di MVP.

## Matriks cakupan endpoint

Semua 38 endpoint di spesifikasi API dipakai minimal oleh satu halaman; tidak ada halaman yang membutuhkan endpoint di luar spesifikasi, kecuali empat penyempurnaan opsional di bawah tabel.

| Endpoint | Dipakai di |
| --- | --- |
| `POST /auth/google` | P02 |
| `POST /auth/token/refresh` | Global (penanganan 401) |
| `POST /auth/logout` | P21 |
| `GET /me` | Global (saat aplikasi dibuka), P03, P04, P05, P06, P12, P21 |
| `PUT /me/roles` | P02, P03 |
| `POST /uploads` | P04, P05, P14 |
| `GET /categories` | P08, P13, P14, P15 |
| `GET /me/store-profile` | P04, P08, P21 |
| `PUT /me/store-profile` | P04 |
| `GET /me/umkm-profile` | P05, P12, P21 |
| `PUT /me/umkm-profile` | P05 |
| `GET /me/products` | P12, P13 |
| `POST /me/products` | P14 |
| `GET /me/products/{id}` | P14 |
| `PATCH /me/products/{id}` | P13 (aktifkan lagi), P14 |
| `DELETE /me/products/{id}` | P13, P14 |
| `GET /me/opportunities` | P06, P07, P10 (filter) |
| `POST /me/opportunities` | P08 |
| `GET /me/opportunities/{id}` | P08, P09, P19 (jadwal untuk form approval) |
| `PATCH /me/opportunities/{id}` | P08 |
| `POST /me/opportunities/{id}/close` | P09 |
| `GET /opportunities` | P12, P15 |
| `GET /opportunities/{id}` | P16 |
| `POST /applications` | P16 |
| `GET /applications` | P06, P09, P10, P12, P17 |
| `GET /applications/{id}` | P19 |
| `POST /applications/{id}/review` | P19 |
| `POST /applications/{id}/cancel` | P19 |
| `POST /applications/{id}/ship` | P19 |
| `POST /applications/{id}/receive` | P19 |
| `POST /applications/{id}/complete` | P19 |
| `GET /applications/{id}/timeline` | P19 |
| `PATCH /applications/{id}/items/{item_id}/stock` | P11, P19 |
| `GET /stock` | P06, P11, P12, P18 |
| `GET /notifications` | P20 |
| `GET /notifications/unread-count` | Header (semua halaman setelah login) |
| `POST /notifications/{id}/read` | P20 |
| `POST /notifications/read-all` | P20 |

### Penyempurnaan opsional untuk backend

Halaman di atas tetap bisa dibangun tanpa perubahan ini (dengan cara sementara yang disebut), tetapi akan lebih ringan bila backend menambahkannya:

| Kebutuhan | Halaman | Cara sementara tanpa perubahan |
| --- | --- | --- |
| `GET /applications` menerima `status` multi-nilai, mis. `status=rejected,completed,cancelled` | Tab Riwayat di P09, P10, P17 | Tiga request lalu digabung dan diurutkan di client |
| `GET /applications` menerima `ordering=delivery_slot_start` | Jadwal antar di P06, P10, P12, P17 | Urutkan hasil di client |
| Item list `GET /me/opportunities` menyertakan `application_counts` | P07 | Tampilkan tanpa angka "pengajuan baru" |
| `GET /applications/{id}` menyertakan nomor telepon pihak lawan | P18, P19 (tombol "Hubungi via WhatsApp") | Tombol tidak ditampilkan; cukup teks "Hubungi toko untuk kirim ulang" |

Satu hal perlu dikonfirmasi ke backend: `PATCH /me/products/{id}` menerima `is_active: true` untuk mengaktifkan lagi produk yang diarsipkan (P13).
