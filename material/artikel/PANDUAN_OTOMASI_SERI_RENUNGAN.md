# Panduan Otomasi Seri Renungan Sufistik BRH

Dokumen ini adalah instruksi operasional untuk melanjutkan seri renungan sufistik BRH secara utuh: merancang tema, menulis naskah, membuat ilustrasi, menyiapkan dan menjalankan seed, mengunggah gambar, serta memverifikasi hasil. Panduan gaya yang menjadi sumber kebenaran wajib adalah [`PANDUAN_GAYA_ARTIKEL.md`](./PANDUAN_GAYA_ARTIKEL.md).

## Perintah Singkat untuk Seri Berikutnya

Salin perintah berikut kepada agent:

> Lanjutkan seri renungan sufistik BRH berikutnya dengan mengikuti `material/artikel/PANDUAN_OTOMASI_SERI_RENUNGAN.md`. Jalankan seluruh alur secara otomatis sampai artikel dan gambar tersimpan di proyek, validasi lolos, seed database selesai, gambar publik terhubung, dan hasil akhir diverifikasi. Mulai seri pada tanggal hari ini di zona Asia/Jakarta; hanya artikel hari ini yang `Published`, semua artikel berikutnya `Draft`. Gunakan tema, judul, masalah, corak, rujukan, metafora, dan hikmah yang tidak mengulang seri sebelumnya. Byline: Budi Rahman Hakim, Ph.D.

Agent tidak perlu meminta konfirmasi tambahan selama tidak ada konflik slug/judul, kredensial yang hilang, kegagalan layanan, atau perubahan destruktif di luar cakupan seri.

## Sumber yang Wajib Dibaca

Sebelum menulis atau mengubah kode, baca seluruh sumber berikut:

1. `AGENTS.md` proyek dan panduan Next.js yang relevan di `node_modules/next/dist/docs/`.
2. `material/artikel/PANDUAN_GAYA_ARTIKEL.md` secara penuh.
3. Rancangan seri terbaru: file `material/artikel/Planned/artikelN.md` dengan nomor terbesar.
4. Semua judul, tema, rujukan, corak naratif, metafora, dan hikmah pada:
   - `material/artikel/Planned/`;
   - `material/artikel/Published/published-articles.md`;
   - data artikel di database bila tersedia.
5. Skrip seed dan unggah gambar seri terbaru sebagai pola teknis, bukan sebagai sumber isi.

Jika tugas meminta ilustrasi raster, gunakan skill `imagegen` dan baca `SKILL.md` miliknya sebelum membuat gambar.

## Parameter Tetap

- Bahasa: Indonesia baku yang cair, hangat, reflektif, membumi, dan tidak menggurui.
- Penulis: `Budi Rahman Hakim, Ph.D.`
- Kategori: `Artikel`
- Judul: dua sampai empat kata.
- Isi: tepat sembilan paragraf, tidak termasuk byline.
- Panjang: 650–850 kata.
- Penutup: satu *ḥikmah inti* orisinal bercetak tebal sebagai kalimat terakhir paragraf kesembilan.
- Frekuensi: satu artikel setiap tiga hari.
- Cakupan: satu bulan sejak tanggal mulai, biasanya 11 artikel pada hari ke-0, 3, 6, 9, 12, 15, 18, 21, 24, 27, dan 30.
- Waktu database: `12:00:00.000Z` atau pukul 19.00 WIB.
- Status: hanya artikel dengan tanggal terbit sama dengan hari eksekusi di Asia/Jakarta yang `Published`; seluruh tanggal setelahnya `Draft`.
- Ilustrasi: PNG 1:1 minimal 1000×1000, kartun editorial minimalis, tanpa tulisan, angka, logo, watermark, tokoh publik, atau wajah orang nyata yang dapat dikenali.

## Arsitektur Isi Wajib

Setiap artikel mengikuti urutan yang ditetapkan dalam panduan gaya:

1. adegan atau benda konkret sebagai hook;
2. fenomena zaman yang aktual;
3. diagnosis batin;
4. khazanah klasik;
5. jembatan kontemporer;
6. akar ruhani BRH/TQN;
7. latihan kecil yang dapat dilakukan;
8. dampak etis dan sosial;
9. resolusi yang kembali ke metafora pembuka dan ditutup hikmah inti.

Seluruh paragraf harus terbaca sebagai satu renungan, bukan sembilan catatan terpisah. Rujukan diparafrasakan dan menyatu dengan narasi; jangan mengarang kutipan langsung, nomor halaman, atau klaim khusus.

## Aturan Antirepetisi

Sebelum menentukan tema, buat inventaris internal dari seluruh seri terdahulu dan tolak calon yang bertabrakan pada salah satu unsur berikut:

- judul atau pola judul yang terlalu mirip;
- masalah utama;
- konsep sufistik utama;
- metafora pembuka dan penutup;
- corak penulisan;
- kitab klasik;
- buku, penulis, atau laporan kontemporer;
- ayat utama;
- latihan praktis;
- rumusan hikmah.

Karya Syeikh ‘Abd al-Qādir al-Jīlānī, Syeikh Aḥmad Ṣāḥib al-Wafā Tāj al-‘Ārifīn, dan Syeikh Muḥammad ‘Abd al-Ghaos Saefulloh Maslul harus hadir dalam rancangan setiap seri, masing-masing secara relevan dan tidak dipaksakan. Gunakan karya berbeda bila seri sebelumnya sudah memakai karya tertentu, sejauh rujukannya dapat diverifikasi.

## Riset Aktualitas

Gunakan pencarian web untuk isu yang dapat berubah. Utamakan sumber primer atau otoritatif seperti lembaga pemerintah, OJK, BPS, WHO, ILO, UNEP, UN Women, penerbit resmi, dan karya penulis aslinya. Riset berfungsi untuk:

- memastikan isu benar-benar aktual;
- memeriksa angka atau perkembangan regulasi;
- memverifikasi judul dan penulis rujukan;
- mencegah klaim yang kedaluwarsa atau dibuat-buat.

Artikel tetap berupa renungan, bukan ringkasan berita. Angka hanya digunakan bila membuat pengalaman pembaca lebih jelas.

## Berkas yang Harus Dibuat

Untuk Seri ke-`N`, buat paket berikut:

```text
material/artikel/Planned/artikel{N+1}.md
material/artikel/Planned/seri-{n}-{rentang-bulan-tahun}/
  ├─ artikel-01.md
  ├─ ...
  ├─ artikel-11.md
  └─ IMAGE_PROMPTS.md
public/images/articles/seri-{n}-{rentang-bulan-tahun}/
  ├─ artikel-01.png
  ├─ ...
  └─ artikel-11.png
scripts/seed-seri-{n}-{rentang-bulan-tahun}.ts
scripts/upload-seri-{n}-{rentang-bulan-tahun}-images.ts
```

`artikel{N+1}.md` memuat tema besar, kesinambungan dari seri lama, gerak tematik, kalender, masalah aktual, konsep sufistik, corak penulisan, alur sembilan paragraf, dan rujukan utama semua artikel.

Setiap file artikel memakai front matter berikut:

```yaml
---
title: Judul Maksimal Empat Kata
slug: judul-maksimal-empat-kata
category: Artikel
status: Published
author: Budi Rahman Hakim, Ph.D.
series: Nama Seri
publishedAt: YYYY-MM-DDT12:00:00.000Z
image: /images/articles/nama-folder-seri/slug.png
---
```

Hanya file pertama menggunakan `Published` apabila tanggalnya adalah hari eksekusi; file lain menggunakan `Draft`.

## Alur Pembuatan Gambar

1. Tulis seluruh konsep gambar di `IMAGE_PROMPTS.md`.
2. Gunakan satu panggilan ImageGen per gambar. Panggilan dapat dikerjakan paralel dalam kelompok kecil.
3. Setiap prompt menyebutkan penggunaan aset, adegan, subjek anonim, gaya, komposisi 1:1, suasana, palet, dan larangan.
4. Periksa visual satu per satu. Tolak bila terdapat teks, logo, wajah publik, anatomi rusak yang mengganggu, rasio bukan 1:1, atau metafora bertentangan dengan artikel.
5. Salin hasil final dari direktori gambar bawaan Codex ke folder `public/images/articles/...`; pertahankan file sumber bawaan.
6. Pastikan nama file persis sama dengan slug artikel.

## Kontrak Skrip Seed

Skrip seed harus aman dijalankan ulang dan mempunyai dua mode:

- tanpa `--apply`: hanya validasi, tidak menulis database;
- dengan `--apply`: membuat seluruh post dalam satu transaksi setelah semua validasi lolos.

Validasi minimal:

- seluruh front matter wajib ada;
- filename sama dengan slug;
- kategori dan byline tepat;
- judul maksimal empat kata;
- seri tepat;
- jadwal berjarak tiga hari;
- tepat satu `Published` untuk hari pertama dan sisanya `Draft`;
- tepat sembilan paragraf;
- 650–850 kata;
- kalimat terakhir bercetak tebal;
- setiap gambar lokal ada;
- tidak ada slug atau judul duplikat di paket maupun database;
- blok database tersusun `text > image > text`;
- thumbnail dan blok gambar memakai aset yang sama.

Jika ditemukan konflik database, berhenti tanpa mengubah post yang sudah ada.

## Kontrak Unggah Gambar

Skrip unggah harus:

1. memeriksa signature/format PNG, dimensi, dan rasio 1:1;
2. menghitung SHA-256 dan memakai `customId` berbasis checksum agar unggah dapat digunakan ulang;
3. melakukan dry run tanpa `--apply`;
4. mengunggah dengan akses publik ketika `--apply` diberikan;
5. memeriksa URL publik;
6. mengganti `thumbnail` dan URL blok gambar pada post terkait dalam transaksi;
7. memverifikasi kembali status, tanggal, thumbnail, dan blok;
8. menghapus unggahan baru yang belum direferensikan bila proses gagal sebelum pembaruan database.

## Urutan Eksekusi Otomatis

Jalankan berurutan dan hentikan bila satu tahap gagal:

```powershell
npm run validate:seri-{n}-{rentang-bulan-tahun}
npx tsx scripts/upload-seri-{n}-{rentang-bulan-tahun}-images.ts
npm run seed:seri-{n}-{rentang-bulan-tahun}
npm run upload:seri-{n}-{rentang-bulan-tahun}-images
npm run lint
```

Urutan seed mendahului unggah final karena skrip unggah perlu menemukan post yang akan diperbarui. Dry run unggah dilakukan sebelumnya untuk memastikan seluruh aset siap.

Sesudahnya, lakukan kueri baca-saja ke database dan pastikan:

- jumlah post sama dengan jumlah artikel;
- hanya artikel hari ini berstatus `Published`;
- semua artikel lain `Draft`;
- semua tanggal tepat dan berjarak tiga hari;
- semua URL gambar publik dapat diakses;
- semua post mempunyai tiga blok dalam urutan yang benar.

## Pemeriksaan Akhir

- [ ] Tema Seri baru meneruskan perjalanan seri lama tanpa mengulangnya.
- [ ] Semua judul maksimal empat kata dan belum pernah dipakai.
- [ ] Semua artikel tepat sembilan paragraf dan 650–850 kata.
- [ ] Rujukan klasik, kontemporer, BRH/TQN, dan ayat relevan serta terverifikasi.
- [ ] Tiga tokoh wajib hadir di tingkat seri.
- [ ] Semua hikmah inti orisinal dan bercetak tebal.
- [ ] Semua gambar 1:1, tanpa tulisan, logo, watermark, tokoh publik, atau wajah nyata.
- [ ] Rancangan, naskah, prompt, gambar, skrip seed, dan skrip unggah tersimpan di proyek.
- [ ] Dry run validasi dan gambar lolos.
- [ ] Seed berhasil tanpa konflik.
- [ ] Tepat satu post hari ini `Published`; sisanya `Draft`.
- [ ] Gambar publik terhubung pada thumbnail dan blok gambar.
- [ ] Verifikasi database dan lint selesai.

## Kondisi Berhenti

Hentikan otomasi dan laporkan bukti jika:

- slug atau judul sudah ada di database;
- tanggal mulai tidak dapat ditentukan dengan aman;
- kredensial database atau UploadThing tidak tersedia;
- ImageGen gagal menghasilkan aset;
- sumber wajib tidak dapat diverifikasi;
- perubahan akan menimpa karya pengguna yang sudah ada.

Jangan menghapus, menimpa, atau mengubah artikel lama untuk memaksa seed baru berhasil.
