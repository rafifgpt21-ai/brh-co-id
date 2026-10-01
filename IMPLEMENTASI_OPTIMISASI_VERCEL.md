# Implementasi pengurangan usage Vercel

Tanggal: 1 Oktober 2026. Implementasi tersedia di workspace, belum dideploy. Desain, teks kartu, pencarian, bahasa, watermark dan aturan unduh PDF dipertahankan. Kontrol akun/admin muncul setelah session selesai dimuat; link katalog mengambil halaman ketika diklik.

## Perubahan yang diterapkan

| Perubahan | Usage yang dituju | Perilaku akhir |
| --- | --- | --- |
| PDF publik langsung dari UploadThing | Fast Origin Transfer, invocations, memory | File dengan status Published dan domain storage yang diizinkan dimuat langsung oleh browser. Kegagalan direct delivery beralih sekali ke proxy. Draft tetap melalui pemeriksaan admin. |
| Proxy PDF memakai streaming | Memory dan pekerjaan relay saat fallback | Mendukung GET, HEAD, Range dan conditional headers. Tidak menampung seluruh file di Buffer. Respons private/no-store agar perubahan akses diperiksa ulang. |
| Cache konten lebih lama | CPU, query berulang, regenerasi cache | Artikel, daftar, metadata file dan related posts memakai profil hours. Agenda memakai revalidate 5 menit/expire 10 menit agar pergantian waktu tetap terlihat. |
| Invalidasi sesuai dependensi | CPU, regenerasi dan cache writes yang tidak perlu | Simpan/hapus artikel menginvalidasi daftar, identitas/slug lama dan baru, kategori related lama dan baru serta metadata file. Detail artikel lain tidak ikut diinvalidasi. Karya pilihan beranda mengikuti ID artikel yang dipilih. |
| Kartu katalog ringkas | Origin Transfer, serialisasi, ukuran output | Explore dan media pembelajaran hanya mengirim data kartu. Indeks pencarian bilingual disimpan di server dan dipakai bersama untuk semua query; isi artikel lengkap tidak dikirim ke komponen katalog. Related posts memakai select field yang diperlukan. |
| Session bersama di client | Rendering runtime publik dan pemeriksaan akun berulang | Header, floating actions dan view count memakai provider bersama. Tidak ada polling interval/focus. Feed publik dicache tanpa session; draft/admin diperoleh melalui Server Action yang tetap memeriksa izin. |
| Prefetch selektif | Request CDN, invocations dan rendering yang tidak dipakai | Kartu katalog/related tidak prefetch. OptimisticLink lainnya secara default prefetch saat hover/focus, dengan pilihan explicit untuk viewport prefetch. Prefetch route yang relevan memakai static shell. |
| Navigasi bahasa lebih hemat | Request navigasi tambahan | Perpindahan bahasa publik tidak lagi disertai refresh kedua. Cookie locale hanya ditulis ketika diperlukan, dan tidak saat prefetch. |
| Ukuran gambar sesuai slot | Varian/ukuran image delivery | sizes kartu mengikuti breakpoint sebenarnya. TTL gambar 31 hari, WebP dan kualitas 75 yang sudah ada tetap digunakan. |
| Persiapan gambar script secara lokal | Ukuran sumber dan pekerjaan decode/transfer pada miss | Upload seri II/III menyiapkan WebP kualitas 90 sebelum upload, mempertahankan resolusi dan sumber asli. Jika hasil lebih besar, sumber PNG tetap dipakai. Ini belum menghapus kebutuhan transformasi Next Image. |
| Cache report analytics | CPU/database saat admin membuka report | Agregasi dan lifetime count memakai revalidate 2 menit/expire 5 menit. Otorisasi dilakukan sebelum akses; pencatatan kunjungan tetap berjalan. Angka admin dapat sedikit tertunda. |
| Health check ringan | Query dan komputasi monitor berulang | GET /api/chat mengembalikan liveness tanpa enam count database. Diagnosis database tersedia di /api/chat/diagnostics khusus admin dengan no-store. POST chatbot tetap berjalan seperti sebelumnya. |
| Invalidasi untuk import script | Konsistensi setelah direct DB writes | Endpoint POST /api/revalidate memakai secret, bukan akses publik. Script seed/upload seri II/III memanggilnya setelah perubahan berhasil. |

## Hasil pengukuran lokal

Pengukuran menggunakan 70 artikel Published yang ada, melalui pembacaan database tanpa mutasi.

| Payload JSON kartu | Sebelum | Sesudah | Pengurangan |
| --- | ---: | ---: | ---: |
| Indonesia | 307.665 byte | 32.784 byte | 89,3% |
| Inggris | 311.165 byte | 32.109 byte | 89,7% |

Ini pengurangan data kartu yang diserialisasi, bukan persentase pengurangan total HTML, seluruh bandwidth atau tagihan Vercel. Hasil pencarian dan teks kartu dibandingkan dengan algoritma sebelumnya pada data aktual.

Dry-run 11 gambar seri III menghasilkan 27.663.548 → 3.483.462 byte (**87,4%** lebih kecil), semuanya tetap 1254 × 1254. Enam gambar seri II juga berhasil dipersiapkan. Tidak ada upload atau pembaruan URL produksi dalam pengujian ini; manfaat gambar berlaku ketika pipeline upload tersebut digunakan.

Pada browser lokal: katalog awal tidak mengirim RSC prefetch otomatis, kategori Buku menghasilkan 25 karya, dan pencarian tasawuf menghasilkan 33 karya. Perpindahan kategori/bahasa tidak menambah request session. Auth.js masih melakukan dua request bootstrap session pada pemuatan awal; tidak diklaim sebagai nol invocation.

PDF contoh 134 halaman berhasil dimuat dari origin UploadThing tanpa request /api/proxy-pdf. Zoom, search toolbar dan watermark tetap tersedia. Storage menerima Range 206, tetapi header range tidak seluruhnya terekspos oleh CORS; PDF.js dapat mengambil seluruh file. Fallback tetap mendukung Range.

## Verifikasi

- Build produksi Next.js dan pemeriksaan TypeScript.
- Lint: nol error; delapan warning yang sudah ada pada img/effect di file lain.
- `npm run test:usage`: kesamaan kartu/localization, pencarian di seluruh blocks, invalidasi slug/kategori lama-baru, validasi domain/protokol PDF.
- `npm run test:analytics`: utilitas analytics yang ada.
- `npm run usage:audit`: kesamaan kartu dan pencarian pada data aktual; anonymous/USER ditolak dari diagnosis, fixture session ADMIN lokal diizinkan; endpoint revalidation tanpa secret ditolak; health check; proxy menolak host lokal; PDF Range 206/1024 byte dan HEAD tanpa body.
- Browser desktop 1280 px dan mobile 390 px: katalog, kategori, bahasa, pencarian dan PDF. Katalog mobile tidak menimbulkan overflow horizontal. Beberapa fetch gambar lama sempat timeout pada storage dalam pengujian lokal; gambar pada screenshot katalog akhir berhasil dimuat.

Tidak tersedia fixture PDF Draft pada database untuk uji end-to-end. Tidak dibuat/dihapus artikel atau user untuk pengujian. Siklus publish → edit → unpublish → delete pada konten uji, login/logout dengan kredensial asli, serta kontrol edit draft di browser admin masih perlu diperiksa pada staging. Pemeriksaan role route menggunakan JWT fixture lokal, bukan akun produksi.

## Konfigurasi saat deployment

1. Deploy perubahan aplikasi ini melalui alur deployment proyek.
2. Isi `CONTENT_REVALIDATION_SECRET` dengan nilai acak yang kuat di environment Vercel dan environment lokal script import. Jangan memakai prefix NEXT_PUBLIC. Pastikan NEXT_PUBLIC_APP_URL mengarah ke deployment yang ingin diinvalidasi; helper menggunakan domain produksi ketika URL lokal dikonfigurasi.
3. Setelah import konten dari luar panel admin, jalankan `npm run cache:revalidate` bila script tidak otomatis memanggil helper. Tanpa secret, script memperingatkan dan konten baru bergantung pada TTL cache; pembaruan melalui panel admin sudah menginvalidasi tag langsung.
4. Monitor liveness memakai GET /api/chat. Pemeriksaan koneksi database memakai /api/chat/diagnostics dengan session admin; endpoint publik tidak lagi membuktikan database sehat.
5. Untuk audit lokal, jalankan production server pada port 3001 lalu `npm run usage:audit`. USAGE_AUDIT_URL dapat mengganti alamat/port localhost; audit menolak host eksternal dan tidak mengubah database.

## Tahap yang tetap memerlukan data produksi

- Ambil breakdown Vercel per route, deployment, cache hit/miss, status dan jenis traffic. Dashboard akun tidak tersedia dalam sesi ini, sehingga penghematan CPU/Origin Transfer produksi belum diukur.
- Periksa bot/abuse, monitor, preview traffic dan firewall berdasarkan sumber traffic; aturan global belum diubah.
- Audit varian /_next/image dan biaya miss. Prepared responsive variants/custom loader atau migrasi delivery gambar perlu dipilih setelah hotspot diketahui. Direct delivery PNG besar belum diaktifkan.
- Prerender aset share-image/OG per versi konten bila terbukti hotspot. TTL CDN yang sudah ada tetap dipakai.
- Atur retensi deployment/Functions Storage melalui akun Vercel setelah kebutuhan rollback diketahui.

Bandingkan jendela 7 hari setelah deployment, dengan traffic sebanding: CPU per 1.000 request, Origin Transfer per pageview, invocation per pageview, image transformations serta ISR reads/writes. Route PPR/dynamic masih dapat memanggil Function; hasil build tidak membuktikan seluruh route sudah bebas runtime. Catat hasil tersebut sebelum menentukan langkah berikutnya.
