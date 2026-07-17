# Panduan Seeding Artikel Berita

Panduan ini dipakai untuk menerbitkan artikel berita dari folder `material/artikel/...` ketika tanggal post harus mengikuti metadata naskah dan gambar yang sama dipakai sebagai thumbnail serta block gambar.

Tool reusable tersedia di `.agent/tools/seed-news-article.ts`.

## Struktur bahan

Satu folder bahan harus memuat:

- `artikel.md`
- satu gambar JPEG, PNG, WebP, atau AVIF

Format `artikel.md` yang disarankan:

```md
# Judul Artikel

Paragraf pertama.

Paragraf kedua.

penulis : NAMA PENULIS (Keterangan)
sumber : https://example.com/path/judul-artikel
waktu terbit : Jumat, 17 Juli 2026 08:19 WIB
```

Judul dicari berurutan dari `--title`, metadata `judul`, heading `#`, lalu slug terakhir URL sumber. Metadata `penulis`, `sumber`, dan `waktu terbit` wajib ada. Tool memahami WIB, WITA, dan WIT.

Jika folder mempunyai lebih dari satu gambar, tentukan gambar dengan `--image nama-file.jpg`.

## Alur aman

Selalu mulai dengan dry-run. Tanpa `--commit`, tool hanya membaca bahan, memvalidasi metadata, memproses gambar secara lokal, mengecek post duplikat, dan menampilkan ringkasan tanpa mengunggah atau menulis database.

```bash
npx tsx .agent/tools/seed-news-article.ts --folder "material/artikel/Jumat 17 juli"
```

Periksa judul, slug, tanggal ISO, jumlah paragraf, ukuran hasil gambar, dan `existingPost`. Jika benar dan `existingPost` bernilai `null`, jalankan:

```bash
npx tsx .agent/tools/seed-news-article.ts --folder "material/artikel/Jumat 17 juli" --commit
```

Opsi yang berguna:

```bash
# Override judul
npx tsx .agent/tools/seed-news-article.ts --folder "..." --title "Judul Artikel" --commit

# Pilih gambar dan posisi block gambar
npx tsx .agent/tools/seed-news-article.ts --folder "..." --image "cover.jpg" --image-after 4 --commit

# Simpan sebagai draft
npx tsx .agent/tools/seed-news-article.ts --folder "..." --status Draft --commit
```

## Susunan post

Tool membuat post kategori `Artikel` dengan urutan:

1. block Teks sebelum gambar;
2. block Gambar;
3. block Teks lanjutan, penulis, dan waktu terbit;
4. block Link berjudul `Baca di <nama sumber>`.

Sumber tidak ditempelkan sebagai URL mentah di block teks. Gambar yang sama diunggah sebagai dua aset terpisah karena profil thumbnail dan konten berbeda.

## Kompresi gambar

Tool meniru profil di `lib/image-compression.ts`:

| Pemakaian | Sisi terpanjang | Target |
|---|---:|---:|
| Thumbnail | 1200 px | 180 KiB |
| Block gambar | 1920 px | 450 KiB |

Gambar yang sudah berada di bawah target dan batas dimensi tetap memakai file asli. Gambar lain dikonversi ke WebP dengan penurunan kualitas dan dimensi bertahap. Sumber di atas 20 MiB, lebih dari 40 megapiksel, animasi, atau hasil di atas 1 MiB ditolak.

## Tanggal, duplikasi, dan rollback

- `createdAt` dan `updatedAt` diisi dari `waktu terbit`, bukan waktu tool dijalankan.
- Tool menolak post dengan judul atau slug yang sudah ada.
- File baru di-upload sebelum record dibuat.
- Jika upload sebagian atau penulisan database gagal, key UploadThing baru dihapus.
- Post `Published` otomatis dicoba masuk ke indeks chatbot. Kegagalan indeks tidak menghapus post yang sudah berhasil.

## Verifikasi setelah seeding

Pastikan output akhir memuat `success: true`, `postId`, dan `slug`. Setelah itu periksa:

- halaman `/id/post/<slug>` merespons 200;
- judul, tanggal, thumbnail, block gambar, penulis, dan block Link tampil;
- record database berstatus `Published` atau `Draft` sesuai opsi;
- `createdAt` cocok dengan zona waktu pada `artikel.md`.

Catatan: tool ini dibuat karena file picker native pada editor browser tidak dapat diisi secara andal oleh otomasi, sedangkan editor tidak menyediakan field untuk mengubah `createdAt`. Untuk upload manual biasa, editor admin tetap menjadi jalur utama karena sudah menjalankan kompresi dan lifecycle UploadThing.
