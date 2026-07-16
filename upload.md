# Panduan Upload dan Lifecycle File UploadThing

Dokumen ini menjelaskan proses upload, kompresi, penggantian, penghapusan, rollback, dan audit file UploadThing pada aplikasi BRH.

## Ringkasan alur

1. Admin memilih gambar di browser.
2. Browser memvalidasi dan mengompresi gambar sebelum upload.
3. File hasil kompresi diunggah langsung ke UploadThing.
4. Respons UploadThing disimpan sebagai `UploadReceipt` (`key`, `url`, `type`, dan `size`).
5. URL dan receipt dikirim bersama data post atau quick post ke server action.
6. Server menyimpan database terlebih dahulu.
7. File lama baru dihapus setelah perubahan database berhasil dan tidak ada referensi lain.
8. Jika penyimpanan gagal, file baru di-rollback. Server selalu memeriksa referensi aktif sebelum menghapus.

`next/image` tetap dipakai untuk optimasi saat gambar ditampilkan, tetapi penghematan storage dilakukan oleh kompresi sebelum upload.

## Format dan batas gambar

Format sumber yang didukung:

- JPEG
- PNG
- WebP statis
- AVIF statis

GIF, SVG, WebP/AVIF animasi, dan file gambar rusak ditolak. File sumber dibatasi maksimal 20 MiB dan 40 megapiksel. Jika browser gagal melakukan kompresi, upload dihentikan dan file asli tidak dikirim.

Profil kompresi:

| Penggunaan | Sisi terpanjang | Target ukuran | Kualitas awal/minimum |
|---|---:|---:|---:|
| Thumbnail post | 1200 px | 180 KiB | 76% / 55% |
| Gambar quick post | 1600 px | 300 KiB | 74% / 55% |
| Block gambar post | 1920 px | 450 KiB | 78% / 60% |

Kompresor mempertahankan rasio, transparansi, dan orientasi EXIF. Gambar tidak diperbesar. Jika target belum tercapai, kualitas diturunkan bertahap lalu dimensi diturunkan. Hasil di atas 1 MiB ditolak oleh aplikasi dan `imageUploader`.

PDF tidak dikompresi dan tetap dibatasi maksimal 16 MiB.

## Upload post biasa

### Thumbnail

- Pilih thumbnail melalui editor admin.
- Tunggu status kompresi selesai. Editor menampilkan ukuran sebelum dan sesudah kompresi.
- Menekan hapus hanya mengubah draft editor; file lama belum langsung dihapus.
- Setelah tombol simpan/publish berhasil mengubah database, thumbnail lama akan dihapus bila tidak dipakai di tempat lain.

### Block gambar atau PDF

- Gambar block dikompresi menggunakan profil `content`; PDF diteruskan tanpa perubahan.
- Mengganti file membuat file baru menjadi staged dan file lama tetap aman sampai post berhasil disimpan.
- Menghapus block tidak langsung menghapus storage. Penghapusan dilakukan setelah perubahan block tersimpan di database.
- Jika satu URL digunakan beberapa block atau post, file dipertahankan sampai referensi terakhir dilepas.

### Kegagalan

- Jika satu batch berhasil tetapi batch berikutnya gagal, seluruh receipt dari percobaan tersebut di-rollback.
- Jika database menolak data, server menghapus upload baru dan mempertahankan file lama.
- Jika koneksi terputus setelah database mungkin sudah commit, klien meminta rollback. Server mengecek database lagi sehingga file yang sudah aktif tidak akan terhapus.

## Upload dan edit quick post

Gambar hanya berlaku untuk quick post tipe `NORMAL`.

- Composer mendukung tambah, ganti, dan hapus gambar sebelum publish.
- Modal edit quick post mendukung tambah, ganti, dan hapus gambar.
- File baru dikompresi saat dipilih tetapi baru diunggah ketika tombol simpan ditekan.
- Membatalkan composer/modal hanya membuang file lokal; tidak ada file UploadThing yang perlu dihapus.
- Mengganti gambar menyimpan URL baru ke database terlebih dahulu, lalu menghapus gambar lama.
- Menghapus gambar menyimpan `imageUrl = null`, lalu menghapus gambar lama.
- Mengubah tipe `NORMAL` menjadi `AGENDA` atau `QUOTE` mengosongkan `imageUrl` dan membersihkan gambar lama setelah database berhasil.
- Menghapus quick post menghapus record database terlebih dahulu, kemudian membersihkan gambarnya.

## Penghapusan post dan reset konten

Saat post dihapus, aplikasi mengumpulkan thumbnail serta seluruh URL block UploadThing. Record database dihapus lebih dahulu, kemudian file yang tidak lagi direferensikan dibersihkan.

Perintah reset konten juga mengambil snapshot seluruh URL post/quick post sebelum `deleteMany`, lalu membersihkan storage setelah record terhapus. Jika cleanup UploadThing gagal, reset database tetap selesai dan file yatim dapat ditangani melalui audit.

Jalankan reset hanya dengan konfirmasi yang sudah disediakan aplikasi:

```bash
npm run reset:content -- --confirm reset-brh-content
```

## File yang dilindungi

Lifecycle cleanup mengenali referensi berikut sebagai pemilik file:

- `Post.thumbnail`
- seluruh `Post.blocks[].url` UploadThing
- `QuickPost.imageUrl`
- `lib/material-book-cover-urls.json`
- `lib/uploadthing-protected-files.ts`

Jangan menulis URL UploadThing statis langsung di komponen. Tambahkan URL tersebut ke `STATIC_UPLOADTHING_ASSETS`, lalu gunakan konstanta manifest di halaman. Dengan demikian audit tidak akan salah menganggap aset sebagai file yatim.

`KnowledgeChunk.thumbnail` bukan sumber kepemilikan karena merupakan data turunan dari post/quick post.

## Audit storage

Audit selalu dimulai dengan dry-run:

```bash
npm run storage:audit
```

Output menampilkan total storage, file aktif, file yatim, ukuran yang berpotensi dihemat, serta kandidat yang melewati grace period tujuh hari. Perintah ini tidak menghapus file.

Simpan laporan JSON bila diperlukan:

```bash
npm run storage:audit -- --json=uploadthing-audit.json
```

Hapus file yatim berusia lebih dari tujuh hari:

```bash
npm run storage:audit -- --delete --older-than-days=7
```

Gunakan grace period yang lebih panjang jika sedang melakukan migrasi atau pemulihan data:

```bash
npm run storage:audit -- --delete --older-than-days=30
```

Sebelum menghapus, audit wajib berhasil membaca UploadThing, database, mapping sampul, dan manifest aset statis. Kandidat diperiksa ulang terhadap referensi aktif tepat sebelum delete.

## Menambah fitur upload baru

Setiap fitur baru yang menyimpan file UploadThing harus mengikuti checklist berikut:

1. Tentukan pemilik URL yang persisten di database atau manifest.
2. Kompres gambar sebelum memanggil `uploadFiles`.
3. Buat `UploadReceipt` dari setiap respons upload.
4. Kirim receipt bersama payload server action.
5. Validasi bahwa receipt benar-benar digunakan payload.
6. Rollback upload baru jika validasi, upload lanjutan, atau database gagal.
7. Saat replace/remove, commit database dahulu lalu panggil cleanup terpusat.
8. Tambahkan sumber referensi baru ke `collectLiveUploadThingKeys()`.
9. Pastikan audit dry-run tidak menandai file baru yang masih aktif.

Jangan memanggil `UTApi.deleteFiles` langsung dari komponen atau server action konten. Gunakan lifecycle helper agar file bersama dan aset statis tetap terlindungi.

## Troubleshooting

### Gambar ditolak sebelum upload

Periksa format, animasi, ukuran 20 MiB, batas 40 megapiksel, dan dukungan WebP browser. Gunakan Chrome, Edge, Firefox, atau Safari versi modern.

### Post tersimpan tetapi cleanup file lama gagal

Konten tetap dianggap berhasil disimpan. Jalankan `npm run storage:audit`, periksa kandidat, lalu jalankan mode delete setelah yakin.

### Build gagal pada `prisma generate` dengan `EPERM`

Di Windows, file `query_engine-windows.dll.node` mungkin sedang dikunci oleh dev server atau proses lain. Hentikan proses Node/Next yang memakai Prisma, lalu ulangi `npm run build`. Untuk memeriksa kompilasi aplikasi ketika Prisma client sudah tersedia, gunakan `npx next build`.

### Audit menampilkan file yang seharusnya dipakai halaman statis

Tambahkan URL tersebut ke `lib/uploadthing-protected-files.ts`, gunakan konstanta manifest pada halaman, lalu ulangi dry-run. Jangan menjalankan `--delete` sebelum kandidat dipastikan benar.
