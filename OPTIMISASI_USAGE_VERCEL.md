# Rencana optimisasi usage Vercel — BRH Insight

Tanggal audit: 1 Oktober 2026. Status: **implementasi utama tersedia di workspace; hasil dan pekerjaan lanjutan tercatat di [IMPLEMENTASI_OPTIMISASI_VERCEL.md](IMPLEMENTASI_OPTIMISASI_VERCEL.md). Belum dideploy ke produksi.**

## 1. Tujuan dan batasan

Tujuan utama adalah mengurangi konsumsi Vercel, terutama **Fluid Active CPU, Fast Origin Transfer, dan Image Transformations**, sambil mempertahankan tampilan dan fungsi website.

- Pertahankan desain, isi, animasi, layout, URL publik, bahasa ID/EN, SEO, pencarian, chatbot, serta fitur admin.
- Pertahankan viewer PDF: watermark, pencarian teks, zoom, navigasi halaman, dan aturan unduh berdasarkan kategori.
- Utamakan perubahan cara mengambil, menyimpan, dan menyajikan data/aset. Perubahan tampilan bukan bagian rencana.
- Kompromi kecil yang dapat dipertimbangkan: konten publik yang sedikit tertunda saat cache diperbarui, angka analytics admin terlambat 1–5 menit, atau navigasi sedikit lebih lambat pada link yang jarang dibuka.
- Jangan menjadikan upgrade paket, mematikan fitur, atau migrasi seluruh hosting sebagai langkah utama.
- Jika beban dialihkan ke UploadThing atau penyedia lain, catat penggunaan dan biayanya. Pengurangan usage Vercel harus terlihat jelas, tanpa mengabaikan keandalan jalur baru.

## 2. Baseline dari screenshot

Angka berikut dibaca dari screenshot Vercel **Last 30 days**; batas mengikuti dashboard akun saat screenshot diambil.

| Metrik | Usage / batas | Terpakai | Prioritas |
| --- | --- | ---: | --- |
| Fluid Active CPU | 3 jam 10 menit / 4 jam | 79,2% | Sangat tinggi |
| Fast Origin Transfer | 7,01 GB / 10 GB | 70,1% | Sangat tinggi |
| Image Optimization — Transformations | 3,3K / 5K | ~66% | Tinggi |
| ISR Writes | 106K / 200K | ~53% | Tinggi |
| Image Optimization — Cache Writes | 35K / 100K | ~35% | Menengah |
| Functions Storage | 3,19 GB / 10 GB | 31,9% | Menengah |
| CDN Requests | 270K / 1M | ~27% | Menengah |
| Function Invocations | 205K / 1M | ~20,5% | Menengah; berhubungan dengan CPU |
| Image Optimization — Cache Reads | 49K / 300K | ~16,3% | Sekunder |
| Fluid Provisioned Memory | 29,3 GB-hours / 360 GB-hours | ~8,1% | Sekunder |

CPU hanya memiliki sisa sekitar **50 menit**, dan Origin Transfer sekitar **2,99 GB**. Prioritas tidak cukup ditentukan oleh jumlah request saja: endpoint yang jarang dipanggil tetapi mengirim PDF besar atau membuat gambar dapat lebih mahal.

Analytics BRH Insight untuk rentang yang ditampilkan, 2 September–1 Oktober 2026:

| Indikator | Nilai |
| --- | ---: |
| Total tayangan | 1.190 |
| Pengunjung unik | 347 |
| Sesi | 500 |
| Tayangan per sesi | 2,38 |
| Pembaca PDF `/pdf-viewer` | 231 tayangan; 108 unik |
| Katalog `/explore` | 225 tayangan; 86 unik |
| Beranda `/` | 177 tayangan; 107 unik |

Tiga halaman tersebut mencakup **633 dari 1.190 tayangan, sekitar 53,2%**. Jalur PDF, katalog, dan beranda menjadi skenario uji utama.

### Cara membaca angka dengan benar

- 205K invocations dibandingkan 1.190 tayangan menghasilkan rasio kasar ~172:1. Ini **indikasi untuk investigasi**, bukan bukti 172 invocations setiap kunjungan. Analytics aplikasi mengecualikan admin, bot yang dikenali, opt-out, dan DNT/GPC; juga melewatkan browser yang tidak menjalankan tracker. Periode aktif analytics, preview deployment, prefetch, API, dan crawler dapat berbeda dari cakupan Vercel.
- ISR Writes adalah **unit data 8 KB**, bukan jumlah regenerasi. Ukuran payload ikut menentukan usage. Vercel juga menyatakan regenerasi dengan konten yang tidak berubah tidak menambah ISR write units. Karena itu, audit ukuran dan perubahan output, bukan hanya TTL. [Sumber: ISR usage](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing).
- Fast Origin Transfer adalah transfer antara CDN dan Functions; Fast Data Transfer adalah transfer antara CDN dan pengunjung. Cache CDN dapat mengurangi beban origin, tetapi request dan transfer ke pengunjung tetap ada. Fast Data Transfer tidak terlihat pada screenshot, sehingga baseline-nya perlu ditambahkan. [Sumber: CDN usage](https://vercel.com/docs/manage-cdn-usage).
- Pada Fluid Compute, waktu menunggu database/API tidak dihitung sebagai Active CPU. Pengurangan waktu tunggu terutama membantu latency dan memory; pengurangan rendering, serialisasi, transformasi gambar, dan request yang mencapai Function membantu CPU. [Sumber: Fluid Compute](https://vercel.com/docs/functions/usage-and-pricing).

## 3. Temuan audit repository

Audit ini membaca kode lokal dan dokumentasi resmi. Belum mengakses breakdown dashboard Vercel, log produksi, konfigurasi CORS storage, atau indeks database aktual. **Temuan kode berikut terverifikasi; besar kontribusinya terhadap usage masih harus diukur.** Kode lokal juga belum dipastikan identik dengan deployment produksi.

| Temuan kode | Lokasi | Implikasi yang perlu dibuktikan |
| --- | --- | --- |
| Next.js 16.2.0 dengan `cacheComponents: true` | `package.json`, `next.config.ts` | Gunakan model Cache Components versi terpasang; jangan menerapkan resep caching Next.js lama. |
| PDF eksternal pada full viewer otomatis menuju `/api/proxy-pdf` | `components/pdf/FullPDFViewer.tsx` | Byte PDF melewati Function Vercel, meskipun asal file di UploadThing. |
| Proxy PDF mengambil seluruh file dengan `arrayBuffer()`, tidak meneruskan Range, dan hanya memberi `public, max-age=3600` | `app/api/proxy-pdf/route.ts` | Ada alokasi buffer penuh; cache browser satu jam belum membuktikan shared CDN cache efektif. |
| Pengecekan file viewer menjalankan session dan query relasi `blocks.url`, mengambil post penuh | `lib/actions/post.ts`: `getPostByFileUrl` | Metadata untuk otorisasi dapat dibuat lebih kecil dan lookup lebih efisien. |
| Banyak query publik memakai `cacheLife("minutes")` | `lib/data/public-content.ts`, `lib/actions/quick-post.ts` | Profil terpasang merevalidasi setelah 1 menit ketika ada request berikutnya; tidak berarti cron berjalan tiap menit. |
| Detail, daftar, dan related posts berbagi tag global `posts`; beberapa mutasi menginvalidasi banyak path | `lib/data/public-content.ts`, `lib/actions/post.ts` | Satu edit dapat membatalkan cache lebih luas daripada data yang berubah. |
| Katalog mengambil post beserta seluruh blocks; search/filter dilakukan di server; tampilan awal hanya 12 kartu | `app/[lang]/explore/page.tsx`, `components/katalog/KatalogClient.tsx` | Konten artikel penuh ikut menjadi props client walaupun kartu hanya membutuhkan ringkasan. |
| `getRelatedPublishedPosts` mengambil semua post kategori lalu mengurutkan dan memotong | `lib/data/public-content.ts` | Ada pekerjaan serta hasil query yang dapat dikurangi tanpa mengganti hasil visible. |
| Header desktop dan drawer, floating actions, dan view count admin menggunakan `auth()` | `components/layout/Header.tsx`, `components/chat/FloatingActions.tsx`, `components/analytics/AdminViewCount.tsx` | Halaman dengan shell statis tetap memiliki bagian runtime. Banyak pemanggilan belum tentu berarti banyak query DB atau invocation terpisah. |
| Beranda, catatan, dan pengabdian memiliki jalur session/runtime; agenda memakai waktu sekarang | `app/[lang]/page.tsx`, `app/[lang]/catatan/*`, `app/[lang]/pengabdian/page.tsx`, `lib/actions/quick-post.ts` | Pemisahan data publik/admin berpotensi mengurangi rendering runtime; cache agenda perlu menangani transisi waktu. |
| Link memakai prefetch bawaan Next.js serta `router.prefetch` saat pointer enter/focus; explore/detail memilih mode runtime | `components/navigation/NavigationFeedback.tsx`, `app/[lang]/explore/page.tsx`, `app/[lang]/post/[slug]/page.tsx` | Audit request spekulatif yang benar-benar terkirim. Next.js dapat melakukan deduplikasi; jangan menganggap semuanya duplikat. |
| Optimisasi gambar sudah memakai TTL 31 hari, hanya WebP, dan kualitas 75 | `next.config.ts` | Tiga optimisasi dasar sudah ada; mengulang rekomendasi tersebut tidak menghasilkan penghematan baru. |
| Upload UI sudah mengompresi gambar di browser, tetapi script artikel seri III mengunggah byte PNG sumber | `lib/image-compression.ts`, `scripts/upload-seri-iii-september-oktober-images.ts` | Jalur upload tidak seragam. Sejumlah PNG lokal ~2,4–2,7 MiB; penggunaan URL tersebut di produksi harus diverifikasi. |
| Share-image menjalankan `sharp` dan `ImageResponse` saat CDN miss; sudah memiliki shared TTL 1 hari | `app/api/share-image/[file]/route.ts` | Kandidat CPU mahal pada cache miss; ukur frekuensi sebelum memindahkan proses. |
| Fallback cover buku membaca file melalui API; mapping cover saat ini sudah berisi URL UploadThing | `app/api/book-cover/[slug]/route.ts`, `lib/featured-books.ts` | Kandidat perbaikan kecil, bukan bukti hotspot aktif. |
| Tracker mengirim satu POST per tayangan yang lolos dedupe; endpoint menulis event dan total dalam transaksi | `components/analytics/PageViewTracker.tsx`, `app/api/analytics/view/route.ts`, `lib/analytics/server.ts` | Analytics menambah invocation, tetapi 1.190 event tersimpan tidak cukup menjelaskan 205K tanpa melihat request gagal/ditolak. |
| Dashboard menjalankan 10 agregasi, ditambah lookup judul | `lib/analytics/report.ts` | Cache report privat dan indeks berpotensi membantu penggunaan admin. Script indeks sudah ada; status penerapannya belum diketahui. |
| `GET /api/chat` menjalankan enam count database untuk diagnosis | `app/api/chat/route.ts` | Dapat menjadi beban bila dipakai monitor/bot. Widget yang dibaca hanya memanggil POST saat pengguna mengirim pesan; polling GET dari widget tidak ditemukan. |

## 4. Urutan kerja

| Tahap | Pekerjaan | Metrik utama | Potensi | Dampak pengalaman |
| --- | --- | --- | --- | --- |
| P0 | Atribusi usage, periksa bot/prefetch/monitor/preview | Semua, terutama CPU | Menentukan sumber penghematan terbesar | Tidak ada |
| P1-A | Sajikan PDF publik langsung dari storage/CDN asal | Origin Transfer, invocations, memory | Tinggi bila proxy menyumbang banyak byte | Tidak ada jika CORS/Range berfungsi |
| P1-B | Perpanjang cache konten dan persempit invalidasi | CPU, invocations; ISR jika output berubah | Tinggi pada konten yang jarang berubah | Sedikit keterlambatan sebagai fallback |
| P1-C | Perkecil data katalog, beranda, dan related posts | Origin Transfer, CPU, ukuran output | Menengah–tinggi | Tidak ada |
| P2-A | Kurangi kerja runtime akun/admin di halaman publik | CPU, invocations, Origin Transfer | Tinggi bila rendering publik dominan | Kontrol akun dapat selesai setelah hydration |
| P2-B | Batasi prefetch yang tidak terpakai | Invocations, CDN Requests, CPU | Menengah; bergantung deduplikasi/cache | Link tertentu sedikit lebih lambat |
| P2-C | Audit varian gambar; siapkan ukuran sebelum delivery | Image Transformations, cache writes/reads | Tinggi untuk batas gambar | Tidak ada setelah QA visual |
| P3 | Share-image, analytics admin, health check, bundle/retention | CPU, Functions Storage | Bergantung breakdown | Minimal |

Potensi di tabel bukan estimasi persentase. Setelah P0, urutan P1/P2 dapat berubah sesuai penyumbang CPU dan byte terbesar. Jika ditemukan abuse dominan, mitigasi terarah menjadi pekerjaan pertama.

## 5. P0 — Tetapkan atribusi usage sebelum implementasi

- [ ] Samakan rentang tanggal dan zona waktu antara dashboard aplikasi, Usage Vercel, dan deployment yang sedang aktif.
- [ ] Filter project ini; pisahkan production, preview, deployment lama, domain `www`, domain apex, dan domain deployment jika data tersedia.
- [ ] Ambil snapshot usage total dan kenaikan harian 7 hari terakhir, termasuk Fast Data Transfer yang belum ada pada screenshot.
- [ ] Buat tabel top route/function: jumlah request, Active CPU total dan per request, ukuran respons, durasi, status, cache hit/miss, serta tipe traffic.
- [ ] Prioritaskan `/api/proxy-pdf`, `/explore`, `/post/*`, `/`, `/api/share-image/*`, `/_next/image`, `/api/analytics/view`, `GET/POST /api/chat`, dan `/api/auth/*`.
- [ ] Periksa request prefetch/RSC, URL query yang sangat bervariasi, crawler, bot, 404, retry berulang, uptime monitor, dan cache miss antarregion.
- [ ] Periksa header produksi untuk URL publik yang sama: `Cache-Control`, `Set-Cookie`, `Vary`, `x-vercel-cache`, serta header cache Next.js jika tersedia. Uji anonim dan login secara terpisah.
- [ ] Cocokkan commit produksi dengan kode yang diaudit; gunakan hasil build yang sesuai untuk mengidentifikasi bagian prerender dan runtime. Manifest `.next` lokal lama bukan bukti kondisi produksi saat ini.
- [ ] Gunakan dashboard/log yang tersedia pada paket sekarang. Jika breakdown rinci tidak tersedia, gabungkan sampel log, inspeksi network browser, dan pengukuran skenario terkendali; jangan membeli observability hanya untuk menjalankan audit awal.

**Keluaran:** daftar tiga penyumbang CPU terbesar dan tiga penyumbang Origin Transfer terbesar, lengkap dengan bukti. Bila atribusi tidak lengkap, dokumentasikan celahnya dan dahulukan perubahan yang jalur penghematannya jelas.

**Mitigasi traffic:** blokir pola abuse yang terbukti melalui Firewall sebelum Function bila fasilitas paket mendukung. Terapkan aturan sempit dan pengecualian crawler mesin pencari/social preview yang dibutuhkan. Gunakan log/monitor terlebih dahulu jika tersedia. Rate limit di dalam handler dapat mengurangi pekerjaan lanjutan, tetapi request sudah mencapai Function; jangan mengklaim invocation hilang. [Sumber: Vercel Firewall](https://vercel.com/docs/vercel-firewall).

## 6. P1 — Penghematan tanpa perubahan tampilan

### P1-A. Hindari relay PDF melalui Function untuk file publik

**Keputusan utama:** untuk file yang memang publik, browser mengambil PDF langsung dari UploadThing/CDN sumber, sedangkan UI viewer tetap sama.

1. Inventarisasi file publik, draft, dan restricted beserta ukuran dan storage URL. Watermark/aturan tombol unduh tetap dipertahankan; klasifikasi akses menentukan eligibility direct delivery.
2. Verifikasi dari origin website bahwa storage mengizinkan CORS dan pembacaan PDF oleh PDF.js. Periksa Range/206, `Content-Length`, `Accept-Ranges`, dan exposure header yang diperlukan; jangan mengasumsikan dukungan provider.
3. Pilih direct URL untuk file publik yang lolos. Simpan fallback terkontrol untuk provider/file yang gagal, tanpa membuat setiap pembukaan mencoba direct dan mengunduh ulang penuh lewat proxy.
4. Perkecil lookup viewer menjadi metadata otorisasi/kategori yang diperlukan. Cache hanya metadata publik yang aman dengan invalidasi saat publish, unpublish, penggantian, atau penghapusan file. Session/draft tidak masuk shared cache.
5. Jika CORS tidak dapat dipenuhi di storage sekarang, bandingkan delivery melalui CDN/storage eksternal yang mendukungnya. Ini alternatif khusus delivery PDF, bukan migrasi seluruh website.
6. Bila proxy sementara masih diperlukan, stream respons dan dukung semantik Range secara benar. Streaming mengurangi buffer, **tidak otomatis mengurangi byte atau invocation**. Shared caching hanya untuk file publik yang memenuhi syarat; jangan menyimpan file besar ke cache data Next.js sebagai jalan pintas.

Endpoint proxy saat ini memeriksa host, sedangkan pemeriksaan draft ada di halaman viewer. Karena itu, jangan menganggap semua URL yang diterima proxy aman untuk shared caching atau direct public delivery. Verifikasi aturan akses pada jalur file yang dipilih.

Vercel membatasi respons Function yang dapat di-cache: 10 MB non-streaming/20 MB streaming, dan request dengan Range tidak memenuhi kriteria cache CDN tersebut. Menambahkan shared TTL pada proxy bukan solusi universal untuk PDF. [Sumber: kriteria CDN cache](https://vercel.com/docs/caching/cdn-cache).

**Ukuran keberhasilan:** pada PDF publik yang dipindahkan, network browser tidak meminta byte PDF dari `/api/proxy-pdf`; byte dan invocation route tersebut turun. Besar penghematan total mengikuti porsi route pada baseline, bukan jumlah tayangan viewer saja.

**QA:** baca PDF kecil/besar di mobile/desktop; buka halaman jauh, search, zoom, reload, unduh kategori yang diizinkan, watermark, dan akses draft/admin. Jangan mengurangi ketajaman halaman PDF demi angka transfer.

### P1-B. Cache lebih lama, dengan invalidasi yang tepat

**Keputusan utama:** konten editorial tidak perlu memeriksa ulang setiap satu menit bila perubahan sudah diketahui lewat publish/edit.

| Jenis data | Kebijakan awal yang diusulkan | Pemicu pembaruan |
| --- | --- | --- |
| Detail artikel terbit, metadata, related posts | Profil `hours`; pertimbangkan `days` setelah invalidasi terbukti | Publish/edit/unpublish/delete, perubahan slug/kategori |
| Katalog, publikasi, media pembelajaran, karya pilihan | Profil `hours` | Perubahan item yang memengaruhi daftar atau pilihan home |
| Kutipan dan arsip yang tidak bergantung waktu | Profil `hours` | Mutasi quick post |
| Agenda mendatang/lampau | Jangan langsung menaikkan ke `days`; mulai batas pendek 5–15 menit atau hitung transisi dari data agenda stabil di client | Mutasi dan peralihan waktu agenda |
| Report analytics untuk admin | Cache privat 1–5 menit, dengan filter sebagai key | TTL; refresh eksplisit bila dibutuhkan |
| Session, otorisasi, data draft/admin | Tetap privat dan diverifikasi | Perubahan session/izin/data |

Langkah kerja:

- [ ] Pisahkan tag detail per post dari tag daftar. Contoh scope konseptual: detail post, daftar kategori, home featured, dan quick post tertentu.
- [ ] Pastikan query detail tidak tetap bergantung pada tag global yang membuat setiap edit membatalkan semua detail.
- [ ] Invalidasi dependensi yang benar saat kategori/slug berubah, termasuk slug lama/baru dan kedua bahasa. Related posts dan daftar tetap konsisten.
- [ ] Pertahankan pembaruan langsung untuk admin setelah menyimpan melalui `updateTag` bila membutuhkan read-your-own-writes. Jangan mengganti semua invalidasi dengan stale-while-revalidate, terutama unpublish/delete/restricted content.
- [ ] Pakai pembaruan background hanya untuk data yang boleh sedikit stale. Hindari revalidasi path berulang tanpa dependensi yang nyata.
- [ ] Inventarisasi mutasi dari Server Actions **dan script seed/upload**, termasuk perubahan `updatedAt` tanpa perubahan isi. Script yang mengubah database langsung harus mempunyai jalur invalidasi terautentikasi atau prosedur pembaruan cache yang jelas.
- [ ] Jangan menambah cron sering hanya untuk menggantikan TTL satu menit. Agenda harus berubah kategori tepat sesuai toleransi waktu yang ditentukan.
- [ ] Audit bagian output yang berubah tanpa perubahan editorial. Tanggal artikel yang tersimpan bukan masalah dengan sendirinya; timestamp/random yang dibuat setiap render dapat menyebabkan output berbeda.

**Catatan Next.js 16.2:** `cacheLife("minutes")` terpasang memiliki stale client 5 menit, revalidate server 1 menit, expire 1 jam. `hours` memiliki revalidate 1 jam. Revalidasi dipicu request; memperpanjangnya tidak menjamin penghematan 60 kali. `use cache` runtime biasa juga dapat berada di memori instance, bukan otomatis cache durable bersama. Utamakan data/UI publik yang masuk prerender; remote cache hanya dipertimbangkan untuk hotspot berulang setelah menghitung read/write/latency tambahannya.

**Ukuran keberhasilan:** regenerasi/query/render berulang turun; konten tidak berubah menghasilkan output stabil. Publikasi baru muncul pada permintaan baru setelah invalidasi, unpublish tidak menyisakan konten yang seharusnya tertutup, dan navigasi tab yang sudah terbuka diuji terhadap stale client cache.

### P1-C. Kirim hanya data yang dibutuhkan kartu dan pencarian

**Keputusan utama:** daftar tidak perlu mengirim seluruh isi artikel beserta blok kedua bahasa ke browser.

1. Pisahkan data kartu dari data detail: id, slug, judul terlokalisasi, kategori, tanggal, thumbnail, dan snippet yang sama dengan sekarang. Batasi data home pada item yang benar-benar ditampilkan.
2. Siapkan data pencarian terpisah yang tetap mewakili bidang yang sekarang dicari: judul ID/EN, kategori, isi teks tanpa HTML, judul/caption blok. Penghematan payload tidak boleh mempersempit hasil pencarian tanpa sengaja.
3. Bandingkan dua pendekatan pada dataset nyata: daftar ringan dengan filter/search di client dan URL tetap sinkron, atau search server dengan query terukur dan hasil ringan. Pilih yang memakai lebih sedikit CPU/request/byte tanpa membuat download awal membesar berlebihan.
4. Untuk search server, normalisasi input, batasi panjang, dan kurangi cache key dari variasi semantik yang sama. Hindari remote cache untuk setiap kata pencarian unik; pertahankan perilaku substring/normalisasi yang sudah ada.
5. Optimalkan related posts dengan projection dan pengurutan/pembatasan yang tetap mengikuti `publishedAt || createdAt`. Mengganti ke urutan `createdAt` saja akan mengubah konten visible dan tidak memenuhi tujuan.
6. Evaluasi pagination server hanya jika dataset besar. Tombol load more dan urutan hasil tetap sama; tambahan request dari pagination harus dibandingkan dengan pengurangan payload.

**Ukuran keberhasilan:** total payload HTML/RSC/data pada skenario katalog turun dengan target awal **≥30%**, tanpa kehilangan hasil pencarian, snippet, urutan, kategori, atau navigasi back/forward. Target ini untuk payload skenario, bukan janji pengurangan Origin Transfer proyek sebesar 30%.

## 7. P2 — Kurangi request dan komputasi publik yang tidak diperlukan

### P2-A. Pisahkan konten publik dari personalisasi akun/admin

- Jadikan konten editorial dan feed publik dapat disajikan sebagai konten publik ter-cache/prerender. Data draft, kontrol edit, view count admin, dan composer tetap melalui jalur privat.
- Periksa seluruh rantai layout, metadata, header, floating actions, serta home/catatan/pengabdian. Mengurangi `auth()` di satu komponen saja belum menghapus semua bagian runtime.
- Satukan kebutuhan session desktop/drawer/floating controls. Session memakai JWT; jangan berasumsi setiap `auth()` mengakses database.
- Bandingkan rendering sekarang dengan UI publik statis + satu bootstrap session privat yang dipakai bersama sepanjang navigasi client. Bootstrap tidak boleh dipanggil ulang oleh setiap kartu/komponen atau melakukan polling.
- Bila memakai penanda login untuk menghindari bootstrap pada anonim, penanda hanya petunjuk UI; server tetap memverifikasi session untuk semua tindakan/data privat. Tangani login, logout, expiry, dan lintas tab.
- Pertahankan fallback dan ruang komponen supaya tidak terjadi layout shift. Kontrol akun dapat terlambat sesaat setelah hydration; pengalaman anonim harus tetap sama.
- Periksa pembacaan `searchParams` di metadata artikel yang sekarang membedakan URL share. Pisahkan metadata editorial stabil dari variasi share bila hasil preview/canonical tetap benar; jangan menghilangkan variasi yang dibutuhkan social sharing.
- Pertimbangkan prerender slug populer pada build secara terbatas setelah mengukur output dan biaya build. Tetap dukung artikel baru on demand; jangan mewajibkan deploy untuk setiap publikasi.

**Gerbang keputusan:** terapkan arsitektur ini hanya bila total invocation dan CPU pada sesi lengkap turun **setelah menghitung endpoint bootstrap baru**. Membungkus session dengan Suspense memberi shell cepat, tetapi bagian dinamis tetap berjalan; caching data saja tidak membuktikan halaman anonim bebas Function.

### P2-B. Prefetch selektif dengan biaya yang terukur

1. Ukur jumlah prefetch yang menjadi navigasi nyata, terutama kartu katalog dan link viewer PDF.
2. Kurangi prefetch runtime untuk detail yang belum akan dibuka; dahulukan prefetch shell statis, atau prefetch saat pengguna menunjukkan niat yang jelas.
3. Hilangkan pemicu ganda hanya bila network membuktikan request tambahan. Wrapper `OptimisticLink` saat ini tetap menjalankan `router.prefetch` pada hover/focus, sehingga memberi `prefetch=false` di pemanggil saja belum tentu menghentikannya.
4. Pertahankan prefetch pada navigasi utama/populer bila membantu UX dengan biaya rendah.
5. Jangan prefetch isi PDF atau data privat melalui link publik.

**Ukuran keberhasilan:** request spekulatif, invocations, dan byte per sesi turun; navigasi tetap memakai feedback yang sama. Uji mouse, keyboard focus, dan touch.

### P2-C. Kurangi transformasi gambar tanpa mengubah desain

**Pertahankan yang sudah benar:** TTL 31 hari, satu format WebP, dan satu kualitas 75. Audit cache hit, varian, dan sumber sebelum mengubah konfigurasi ini. Pengurangan ukuran/varian adalah jalur penghematan yang disarankan Vercel, tetapi penggunaan `unoptimized` perlu dinilai terhadap transfer. [Sumber: image usage](https://vercel.com/docs/image-optimization/managing-image-optimization-costs).

- [ ] Kelompokkan request `/_next/image` berdasarkan source URL, width, quality, format, hit/miss, dan ukuran respons. Prioritaskan sumber dengan banyak varian dan traffic.
- [ ] Sesuaikan `sizes` dengan slot aktual untuk cover/kartu/hero dan kebutuhan DPR 1/2/3. Kurangi width yang tidak pernah dibutuhkan setelah memeriksa perangkat pengguna; jangan mengorbankan ketajaman retina atau gambar artikel penuh.
- [ ] Audit gambar decorative blur dan cover utama yang memakai sumber sama. Dua elemen dengan cache key sama dapat memakai respons yang sama; jangan menghitungnya sebagai dua transformasi pasti.
- [ ] Gunakan URL sumber stabil. Version/hash berubah hanya ketika isi file berubah, bukan setiap render atau pembaruan metadata unrelated.
- [ ] Samakan pipeline upload UI dan script: buat varian WebP/JPEG yang sesuai sebelum diunggah, simpan master untuk kebutuhan resolusi penuh. Dahulukan aset baru dan aset populer; tidak perlu memigrasikan semua file sekaligus.
- [ ] Untuk gambar berukuran siap tampil yang sudah disajikan CDN UploadThing, evaluasi direct delivery dengan responsive variants/custom loader atau bypass per gambar. Varian dibuat sekali melalui proses lokal/build/publish yang terkontrol, bukan resize baru pada setiap request Vercel.
- [ ] Untuk logo/aset kecil yang tidak mendapat manfaat optimisasi, bypass secara selektif dengan file siap pakai dan ukuran yang tepat.
- [ ] Batasi sumber optimizer hanya ke path yang diperlukan; `remotePatterns` sudah ketat untuk UploadThing. Evaluasi `localPatterns` berdasarkan aset aktual tanpa mematahkan URL internal yang dipakai.

**Gerbang keputusan:** jangan menerapkan `unoptimized` global pada PNG 2–3 MiB. Hal itu dapat menurunkan Transformations sambil memperbesar transfer dan waktu muat. Direct URL eksternal mengalihkan delivery dari Vercel; `unoptimized` untuk file di `public/` tetap memakai CDN Vercel.

**Ukuran keberhasilan:** varian/transformasi per sumber populer turun; cache writes/reads ikut dipantau. Warna, crop, ukuran slot, dan ketajaman setara pada desktop/mobile/DPR tinggi; LCP tidak memburuk.

## 8. P3 — Optimisasi tambahan berdasarkan hotspot

### Share-image dan cover buku

- Ukur CPU serta cache miss `/api/share-image/*` dan route `opengraph-image` ID/EN. Endpoint JPEG sudah memiliki shared TTL satu hari, jadi bukan mulai dari nol.
- Jika dominan, hasilkan gambar share sekali per versi konten/bahasa, memakai template yang sama, lalu simpan ke storage/CDN dengan URL versi stabil. Proses dilakukan lokal atau di pipeline publikasi; bila masih di Vercel, manfaatnya mengubah kerja per cache miss menjadi per publish.
- Preview Facebook/WhatsApp tetap memperbarui gambar ketika konten berubah. Pertahankan fallback bila pembuatan aset gagal; uji versioning dan cache crawler.
- Untuk cover buku fallback, ganti delivery file statis melalui Function dengan aset statis/CDN yang sama bila jalur tersebut benar-benar dipakai. Tetap pertahankan kompatibilitas URL lama jika ada referensi.

### Analytics tetap berguna, dengan overhead proporsional

- Pertahankan tracking lengkap sebagai default. Tidak perlu mengurangi akurasi analytics hanya karena jumlah invocations total besar.
- Ukur POST valid, invalid, duplicate, admin, bot, dan error. Filter murah dan validasi payload mendahului pekerjaan database yang mahal, sesuai perlindungan yang sudah ada.
- Pertahankan transaksi/dedupe agar total tidak berlipat. Pengurangan query tidak boleh merusak konsistensi event dan counter.
- Verifikasi indeks existing dan TTL melalui inspeksi read-only. Jangan menjalankan script indeks/migrasi produksi hanya untuk audit ini.
- Cache report admin setelah otorisasi, dengan key filter yang ternormalisasi. Respons HTTP tetap privat; jangan memakai shared CDN cache untuk dashboard/session.
- Jangan membuat counter tayangan publik berubah setiap request sebagai bagian output ISR; counter admin tetap berada di jalur privat.
- Batching event client hanya jika endpoint analytics terbukti signifikan. Bila dipakai, eventId dan waktu kejadian tetap dipertahankan, batch dibatasi, first visit memperoleh identitas dengan benar, flush saat pagehide, dan ada retry/dedupe. Ukur risiko kehilangan event.
- Sampling adalah opsi terakhir bila kebutuhan penghematan belum terpenuhi, dengan perubahan akurasi yang dinyatakan jelas. Sampling bukan rekomendasi awal.

### Health check, chatbot, dan alamat

- Audit siapa yang memanggil `GET /api/chat`. Pisahkan liveness ringan dari diagnosis database terautentikasi/on demand jika route tersebut banyak dipanggil. Hindari uptime monitor yang memicu enam count tiap interval pendek.
- Jangan memindahkan atau mematikan chatbot bila bukan hotspot. Cache retrieval/metadata stabil hanya jika aman terhadap perubahan konten; jangan menyamakan semua percakapan untuk menghemat request.
- Pencarian alamat sudah memakai debounce 400 ms dan pembatalan request. Optimisasi tambahan hanya jika log admin menunjukkan beban nyata; request yang dibatalkan browser mungkin sudah mencapai server.
- Interval pergantian panel hero berjalan di client dan tidak terbukti melakukan request. Jangan menghapus animasi untuk mengurangi CPU Vercel.

### Functions Storage dan output deployment

- Audit ukuran bundle per Function dan region, dependency yang benar-benar terbawa, serta deployment yang dipertahankan. Periksa `sharp`, Prisma engine, font OG, dan tracing cover tanpa mengasumsikan dependency yang terpasang otomatis masuk setiap bundle.
- Pisahkan dependency khusus login/diagnosis/OG dari jalur publik bila hasil tracing menunjukkan bundling yang tidak perlu. Jangan mengurangi kekuatan hashing password demi penghematan.
- Evaluasi frekuensi preview/deployment dan retention dengan tetap mempertahankan production aktif serta rollback yang diperlukan. Pembersihan deployment dilakukan pada tahap implementasi dengan daftar yang reviewable.
- Functions Storage berisi bundle Function per region, terpisah dari aset statis dan file UploadThing; penyimpanan diukur sepanjang waktu. Menghapus file di UploadThing tidak otomatis menurunkan metrik ini, dan mengurangi retention tidak menghapus usage historis yang sudah tercatat. [Sumber: Deployment Storage](https://vercel.com/docs/deployment-storage).
- Master PNG besar di `public/` terutama relevan pada output aset/deployment. Memindahkan master keluar output deploy hanya dilakukan setelah memastikan file tersebut tidak diakses UI; ini tidak otomatis mengurangi Functions Storage.

## 9. Target awal dan cara menghitung hasil

Target berikut adalah **sasaran penerimaan sementara**, bukan prediksi yang sudah terbukti. Validasi ulang setelah P0 berdasarkan kontribusi route, traffic, dan kemampuan paket. Jangan menjumlahkan persentase penghematan antarpekerjaan karena dampaknya dapat tumpang tindih.

| Metrik | Baseline 30 hari | Sasaran ekuivalen 30 hari pada traffic sebanding |
| --- | ---: | ---: |
| Active CPU | 190 menit | ≤120 menit |
| Fast Origin Transfer | 7,01 GB | ≤4 GB |
| Image Transformations | ~3.300 | ≤2.000 |
| ISR Writes | ~106K unit | ≤65K unit |
| Function Invocations | ~205K | ≤120K |
| CDN Requests | ~270K | ≤220K, target sekunder |

Image cache writes/reads, Functions Storage, Memory, dan Fast Data Transfer minimal tidak melonjak tanpa penjelasan. Jika direct delivery membuat biaya storage eksternal naik, laporkan bersama pengurangan Vercel.

Pengukuran:

1. Simpan baseline per hari dan per skenario sebelum perubahan; bedakan cold cache dari warm cache.
2. Terapkan satu kelompok perubahan, catat waktu deployment, lalu bandingkan skenario yang sama.
3. Pantau 48–72 jam untuk regresi dan minimal 7 hari yang sebanding untuk tren; beberapa route dengan traffic kecil memerlukan periode lebih panjang.
4. Bandingkan CPU ms per request sah, byte origin per pembukaan PDF/navigasi katalog, transformasi per source/version, dan request per sesi browser. Tayangan analytics menjadi konteks tambahan, bukan satu-satunya denominator bila coverage berubah.
5. Laporkan perubahan traffic bot, volume pengunjung, publikasi baru, dan cache warming setelah deploy. Proyeksi kenaikan harian ke 30 hari diberi label proyeksi.
6. Total rolling 30 hari tidak langsung turun setelah perbaikan; lihat **laju usage baru**, kemudian konfirmasi angka periode penuh setelah data lama keluar dari jendela.

## 10. Validasi dan rollback

Sebelum setiap tahap dianggap selesai:

- [ ] Build dan lint yang relevan lulus pada saat implementasi; halaman publik tidak memperoleh bagian runtime baru yang tidak diperlukan.
- [ ] Screenshot sebelum/sesudah dibandingkan untuk beranda, katalog, artikel, publikasi, viewer PDF, dan admin pada mobile/desktop ID/EN. Layout, warna, crop, font, dan animasi sama.
- [ ] Anonymous, USER, ADMIN, dan SUPER_ADMIN mendapat pengalaman dan izin yang benar; session/draft tidak bocor ke cache publik.
- [ ] Publish/edit/unpublish/delete, perubahan slug/kategori, karya pilihan, dan mutasi script menginvalidasi semua dependensi yang diperlukan.
- [ ] Agenda berpindah dari mendatang ke lampau sesuai toleransi yang ditetapkan, tanpa menunggu edit manual.
- [ ] Search, filter, load more, URL share, back/forward, deep link, dan pergantian bahasa tetap benar.
- [ ] Viewer dan download PDF berfungsi, termasuk CORS/Range serta fallback yang tidak mengunduh file berulang tanpa perlu.
- [ ] Analytics tetap dedupe, opt-out, DNT/GPC, session/visitor, dan mengecualikan admin seperti sebelumnya.
- [ ] Cache hit terverifikasi di produksi untuk jalur yang memang eligible; cache privat tetap privat. Jangan menyamakan hit shell PPR dengan hilangnya semua kerja Function.
- [ ] LCP/CLS dan latency navigasi tidak memburuk material pada sampel yang sebanding; gunakan kenaikan >10% pada latency/LCP atau layout shift baru sebagai pemicu investigasi, bukan kesimpulan dari satu sampel.
- [ ] Ada bukti metrik target tahap menurun. Perubahan yang hanya memindahkan beban ke metrik Vercel lain harus ditinjau kembali.

Pertahankan deployment sebelumnya selama masa validasi. Gunakan mekanisme rollback per kelompok: direct PDF kembali ke fallback, varian gambar kembali ke URL lama, cache kembali ke profil sebelumnya, dan prefetch kembali ke perilaku lama. Jangan menghapus master/aset lama sebelum jalur baru terbukti. Rollback wajib bila muncul akses salah, PDF gagal, konten terhapus masih tersaji, atau kenaikan usage yang meniadakan penghematan.

## 11. Paket implementasi yang disarankan

| Paket | Isi | Dependensi | Estimasi kerja aktif |
| --- | --- | --- | --- |
| 0 | Baseline, atribusi, header/cache, verifikasi deploy dan provider | Akses data dashboard/log | 0,5–1 hari |
| 1 | Direct PDF publik + cache editorial + payload daftar ringan, dipisah menjadi perubahan kecil | Paket 0; CORS/storage dan invalidasi | 2–4 hari |
| 2 | Session publik, prefetch, dan varian gambar | Bukti hotspot dan validasi Paket 1 | 3–6 hari |
| 3 | Share-image, report analytics, diagnosis chat, bundle/retention yang terbukti perlu | Breakdown usage terbaru | 1–3 hari |
| 4 | Evaluasi tren, penyesuaian target, dokumentasi hasil | Minimal 7 hari traffic sebanding | Pengamatan, bukan 7 hari coding |

Estimasi dapat berubah berdasarkan ukuran dataset dan akses observability. Jangan menunggu semua paket selesai untuk memperoleh penghematan: rilis kelompok kecil yang sudah tervalidasi dan ukur hasilnya.

**Urutan awal yang direkomendasikan:** atribusi → direct delivery PDF publik → cache lebih lama dengan invalidasi benar → data katalog ringan → pengurangan runtime/prefetch → varian gambar → hotspot tambahan. Jika audit menunjukkan Image Transformations atau abuse lebih dominan dari perkiraan, dahulukan pekerjaan tersebut.

## 12. Pedoman teknis yang wajib dibaca saat implementasi

Repository memakai Next.js **16.2.0** dengan Cache Components. Panduan versi terpasang menjadi acuan utama sesuai `AGENTS.md`:

- [Caching](node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md).
- [cacheLife dan profil waktunya](node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cacheLife.md).
- [use cache dan batas cache runtime](node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache.md).
- [Remote cache dan trade-off](node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-cache-remote.md).
- [updateTag](node_modules/next/dist/docs/01-app/03-api-reference/04-functions/updateTag.md) dan [revalidateTag](node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidateTag.md).
- [Route Handlers dengan Cache Components](node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md).
- [Route Segment Config](node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md) dan [instant navigation](node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/instant.md).
- [Image configuration](node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/images.md).

Dengan konfigurasi ini, jangan menjadikan `dynamic = "force-static"`, segment `revalidate`, `fetchCache`, atau resep `experimental_ppr` lama sebagai solusi. Bentuk satu argumen `revalidateTag` juga deprecated. Gunakan API yang didukung versi terpasang, kemudian buktikan hasil output build dan usage produksi.
