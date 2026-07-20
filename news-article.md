# Panduan Publikasi Artikel dari Folder Material

Panduan ini dipakai untuk menerbitkan artikel berita maupun artikel orisinal dari folder `material/artikel/...`. Tanggal post mengikuti metadata naskah dan gambar yang sama dipakai sebagai thumbnail serta block gambar.

Tool reusable tersedia di `.agent/tools/seed-news-article.ts`.

## Struktur bahan

Satu folder bahan umumnya memuat:

- `artikel.md`
- satu gambar JPEG, PNG, WebP, atau AVIF; gambar boleh belum ada jika memakai `--status Draft --no-image`

Format `artikel.md` yang disarankan:

```md
# Judul Artikel

Paragraf pertama.

Paragraf kedua.

penulis : NAMA PENULIS (Keterangan)
sumber : https://example.com/path/judul-artikel
waktu terbit : Jumat, 17 Juli 2026 08:19 WIB
```

Judul dicari berurutan dari `--title`, metadata `judul`, heading Markdown, lalu slug terakhir URL sumber. Metadata `penulis` dan `waktu terbit` wajib ada untuk format berita. `sumber` bersifat opsional; jika ada, nilainya harus berupa URL HTTP/HTTPS. Tool memahami WIB, WITA, dan WIT.

Format artikel orisinal juga dapat dibaca langsung:

```md
## Pulang dari Bising

**18 Juli 2026 | Fajar Kesadaran**
**Oleh: Budi Rahman Hakim, Ph.D.**

Isi artikel.
```

Untuk tanggal tanpa jam, tool memakai `08:00 WIB`. Nilai tersebut dapat diubah dengan `--time` dan `--timezone`, atau diganti sepenuhnya dengan `--published-at`.

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

# Override metadata tanpa mengubah artikel.md
npx tsx .agent/tools/seed-news-article.ts --folder "..." --author "Nama Penulis" --published-at "18 Juli 2026 12:30 WIB"

# Atur slug, kategori, dan caption
npx tsx .agent/tools/seed-news-article.ts --folder "..." --slug "slug-khusus" --category "Opini" --caption "Keterangan gambar"

# Tambahkan sumber untuk naskah yang tidak memuat metadata sumber
npx tsx .agent/tools/seed-news-article.ts --folder "..." --source "https://example.com/artikel" --source-label "Nama Media"

# Pilih gambar dan posisi block gambar
npx tsx .agent/tools/seed-news-article.ts --folder "..." --image "cover.jpg" --image-after 4 --commit

# Simpan sebagai draft
npx tsx .agent/tools/seed-news-article.ts --folder "..." --status Draft --commit

# Simpan draft teks terlebih dahulu; thumbnail dan block gambar ditambahkan nanti
npx tsx .agent/tools/seed-news-article.ts --folder "..." --status Draft --no-image --commit
```

## Susunan post

Tool membuat post kategori `Artikel` (atau nilai `--category`) dengan urutan:

1. block Teks sebelum gambar;
2. block Gambar;
3. block Teks lanjutan, penulis, dan waktu terbit;
4. block Link berjudul `Baca di <nama sumber>` jika URL sumber tersedia.

Pada mode `--no-image`, tool membuat satu block Teks lengkap tanpa thumbnail dan tanpa block Gambar. Mode ini sengaja dibatasi untuk `Draft`; gambar dapat ditambahkan kemudian melalui Post Editor sebelum publikasi.

Sumber tidak ditempelkan sebagai URL mentah di block teks. Gambar yang sama diunggah sebagai dua aset terpisah karena profil thumbnail dan konten berbeda.

## Kompresi gambar

Tool meniru profil di `lib/image-compression.ts`:

| Pemakaian | Sisi terpanjang | Target |
|---|---:|---:|
| Thumbnail | 960 px | 110 KiB |
| Quick post (browser) | 1280 px | 200 KiB |
| Block gambar | 1600 px | 280 KiB |

Kompresi berlangsung di browser atau mesin lokal sebelum upload ke UploadThing. JPEG dan PNG selalu dicoba dikonversi ke WebP; WebP/AVIF yang sudah efisien dapat langsung dipakai. Tool menurunkan kualitas dan dimensi secara bertahap, tetapi mempertahankan sumber bila hasil konversi justru lebih besar. Sumber di atas 20 MiB, lebih dari 40 megapiksel, animasi, atau hasil di atas 1 MiB ditolak. Dry-run menampilkan persentase penghematan tiap profil.

## Tanggal, duplikasi, dan rollback

- `publishedAt`, `createdAt`, dan `updatedAt` diisi dari `waktu terbit`, bukan waktu tool dijalankan.
- Tool menolak post dengan judul atau slug yang sudah ada.
- File baru di-upload sebelum record dibuat.
- Jika upload sebagian atau penulisan database gagal, key UploadThing baru dihapus.
- Post `Published` otomatis dicoba masuk ke indeks chatbot. Kegagalan indeks tidak menghapus post yang sudah berhasil.

## Verifikasi setelah seeding

Pastikan output akhir memuat `success: true`, `postId`, dan `slug`. Setelah itu periksa:

- halaman `/id/post/<slug>` merespons 200;
- judul, tanggal, thumbnail, block gambar, penulis, dan block Link (jika ada sumber) tampil;
- record database berstatus `Published` atau `Draft` sesuai opsi;
- `createdAt` cocok dengan zona waktu pada `artikel.md`.

Catatan: tool ini dibuat karena file picker native pada editor browser tidak dapat diisi secara andal oleh otomasi, sedangkan editor tidak menyediakan field untuk mengubah `createdAt`. Untuk upload manual biasa, editor admin tetap menjadi jalur utama karena sudah menjalankan kompresi dan lifecycle UploadThing.
