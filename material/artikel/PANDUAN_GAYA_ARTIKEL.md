# Panduan Gaya Artikel BRH

Panduan ini disusun dari audit **17 artikel** dengan `category = Artikel` dan `status = Published` pada 3 September 2026. Sumber audit tersedia dalam bentuk arsip terbaca dan ekspor JSON persis di folder `material/artikel/Published/`.

## Identitas Tulisan

Artikel BRH adalah renungan sufistik yang memasuki persoalan sehari-hari, membaca lapisan batinnya, lalu mengembalikan pembaca kepada adab dan tindakan yang dapat dijalankan. Tulisan tidak berhenti sebagai motivasi, tidak menjadi kuliah teori, dan tidak memakai agama sebagai teguran dari tempat yang tinggi. Suaranya hangat, jernih, reflektif, inklusif, dan dekat.

Gunakan identitas berikut secara konsisten:

- Penulis: **Budi Rahman Hakim, Ph.D.**
- Kategori sistem: `Artikel`
- Sudut pandang utama: **kita**, diselingi **manusia** atau **seseorang**
- Judul: dua sampai empat kata, puitis tetapi konkret
- Panjang sasaran Seri II: **650–850 kata**
- Jumlah isi: **tepat sembilan paragraf**
- Penutup: satu *ḥikmah inti* orisinal dalam cetak tebal sebagai kalimat terakhir

## Arsitektur Sembilan Paragraf

1. **Hook konkret.** Mulai dengan adegan, benda, kebiasaan, atau pertanyaan yang segera dikenali pembaca. Hadirkan tegangan utama tanpa menjelaskan semuanya.
2. **Fenomena zaman.** Perluas adegan menjadi masalah sosial atau digital yang sedang dialami banyak orang.
3. **Diagnosis batin.** Geser fokus dari gejala luar menuju ego, nafs, ketakutan, kebutuhan akan pengakuan, atau kehilangan pusat diri.
4. **Khazanah klasik.** Masukkan satu tokoh atau karya tasawuf untuk menerangi masalah, bukan untuk memamerkan kutipan.
5. **Jembatan kontemporer.** Gunakan satu pemikir atau riset modern agar pembacaan tetap membumi dan dapat dipertanggungjawabkan.
6. **Akar ruhani BRH/TQN.** Hubungkan dengan *Miftāḥ al-Ṣudūr*, *Faḍā’il al-Syuhūr*, *Tanbih*, tradisi *khidmah*, dzikrullah, atau nilai yang relevan.
7. **Latihan praktis.** Berikan tindakan kecil, spesifik, dan mungkin dilakukan pada hari yang sama. Pertanyaan reflektif boleh dipakai.
8. **Dampak etis.** Tunjukkan bagaimana kejernihan batin mengubah cara memperlakukan keluarga, rekan, masyarakat, teknologi, atau pihak yang lebih rentan.
9. **Resolusi dan hikmah.** Kembali kepada metafora pembuka, ringkas gerak batin tulisan, lalu akhiri dengan satu kalimat tebal yang dapat berdiri sendiri.

## Bahasa dan Irama

- Gunakan bahasa Indonesia baku yang cair. Kalimat boleh puitis, tetapi maknanya harus langsung tertangkap.
- Bangun irama dengan pasangan kontras: ramai–sunyi, terlihat–benar, meminta–menyerahkan, memberi–menguasai, dekat–hadir.
- Gunakan pengulangan secukupnya untuk daya pukau, misalnya: “tidak semua…”, “kita dapat…”, atau “ada saat…”. Jangan mengulang gagasan yang sama dengan sinonim semata.
- Utamakan kata konkret: meja makan, layar, kursi kosong, telepon, pintu, tangan, wajah, jalan, napas. Benda konkret menjadi pintu menuju gagasan batin.
- Istilah Arab ditulis miring dan dijelaskan singkat pada kemunculan pertama. Contoh: *‘afw* (memaafkan), *riḍā* (kelapangan menerima), *khidmah* (pelayanan).
- Nama الله boleh ditulis dengan aksara Arab seperti pada korpus terbaru. Jangan mencampurnya dengan banyak variasi sebutan dalam satu artikel.
- Ayat Al-Qur’an hadir sebagai peneguh alur, bukan tempelan. Cantumkan surah dan ayat dalam format `QS. al-Syūrā [42]: 40`.
- Hindari seruan berlebihan, tanda seru, bahasa menggurui, klaim mutlak, jargon akademik tanpa penjelasan, dan pembukaan generik seperti “di era modern ini”.

## Cara Memasukkan Rujukan

Rujukan harus menyatu dengan narasi. Gunakan pola: nama tokoh/karya → gagasan yang relevan → konsekuensi bagi pengalaman pembaca. Parafrasa lebih diutamakan daripada kutipan langsung. Jangan mengarang nomor halaman, kutipan verbatim, atau klaim khusus yang belum diperiksa.

Satu artikel Seri II idealnya memuat:

- satu sumber tasawuf klasik;
- satu pemikir atau kajian kontemporer;
- satu sumber ruhani BRH/TQN yang relevan;
- satu ayat Al-Qur’an.

## Format Konten untuk Website

Pola blok yang paling konsisten pada artikel terbaru adalah:

1. blok `text`: nama penulis dan paragraf hook;
2. blok `image`: ilustrasi utama;
3. blok `text`: paragraf 2–9.

Aturan operasional:

- gunakan ilustrasi 1:1 tanpa tulisan, logo, watermark, atau wajah tokoh publik;
- ilustrasi harus menangkap suasana dan metafora, bukan menjelaskan artikel secara literal;
- gunakan gambar yang sama untuk `thumbnail` dan blok gambar utama;
- simpan naskah baru sebagai `Draft` sampai diperiksa manusia;
- isi `publishedAt` sesuai kalender editorial; standar waktu seri yang sudah terbit adalah pukul `12:00:00Z`;
- jangan mengubah artikel yang sudah ada ketika judul atau slug bertabrakan.

## Checklist Editorial

Sebelum naskah dinyatakan siap:

- [ ] Judul maksimal empat kata dan slug bersih.
- [ ] Isi tepat sembilan paragraf, di luar nama penulis.
- [ ] Paragraf pertama mempunyai adegan atau pertanyaan yang kuat.
- [ ] Masalah luar sudah digeser menuju diagnosis batin.
- [ ] Rujukan klasik, kontemporer, ruhani BRH/TQN, dan ayat relevan serta tidak dipaksakan.
- [ ] Ada satu latihan yang spesifik dan realistis.
- [ ] Ada akibat etis bagi hubungan atau kehidupan sosial.
- [ ] Tidak ada nada menghakimi korban, orang tua, anak, pihak miskin, atau kelompok yang berbeda.
- [ ] Kalimat terakhir adalah satu *ḥikmah inti* bercetak tebal.
- [ ] Gambar 1:1, tanpa tulisan dan tanpa tokoh publik.
- [ ] Status tetap `Draft`; seeding hanya dilakukan setelah persetujuan.

## Prompt Ringkas untuk Agent

> Tulis artikel BRH dalam bahasa Indonesia yang hangat, reflektif, dan membumi. Gunakan judul maksimal empat kata dan tepat sembilan paragraf dengan gerak: adegan konkret → fenomena sosial → diagnosis batin → khazanah tasawuf klasik → pemikir kontemporer → akar ruhani BRH/TQN → latihan praktis → dampak etis → resolusi. Gunakan sudut pandang “kita”, jelaskan istilah Arab dengan ringan, hindari nada menggurui, dan tutup dengan satu *ḥikmah inti* orisinal dalam cetak tebal sebagai kalimat terakhir. Sasaran panjang 650–850 kata.
