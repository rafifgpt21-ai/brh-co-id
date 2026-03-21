import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[870px] flex flex-col items-center justify-center px-8 text-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary-fixed blur-[120px] rounded-full"></div>
          <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
        </div>

        {/* Impact Chips */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <div className="bg-surface-container-lowest px-5 py-2 rounded-full text-xs font-label font-semibold tracking-widest uppercase text-secondary flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            10+ Buku
          </div>
          <div className="bg-surface-container-lowest px-5 py-2 rounded-full text-xs font-label font-semibold tracking-widest uppercase text-secondary flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">description</span>
            50+ Jurnal Ilmiah
          </div>
          <div className="bg-surface-container-lowest px-5 py-2 rounded-full text-xs font-label font-semibold tracking-widest uppercase text-secondary flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Pendiri Jagat 'Arsy
          </div>
        </div>

        {/* Main Typography */}
        <h1 className="font-headline font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tight text-primary leading-[1.1] mb-8 max-w-5xl">
          Menyemai Pemikiran,<br />
          <span className="text-secondary">Menggerakkan</span> Perubahan
        </h1>

        {/* Search Bar Area */}
        <div className="w-full max-w-2xl mt-8 relative group">
          <div className="absolute -inset-1 bg-linear-to-r from-secondary to-primary-container rounded-full blur opacity-10 group-focus-within:opacity-20 transition duration-500"></div>
          <div className="relative bg-surface-container-low/80 glass-effect rounded-full px-8 py-5 flex items-center gap-4 border border-outline-variant/15">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              className="bg-transparent border-none outline-none focus:ring-0 w-full font-body text-lg placeholder:text-on-surface-variant/60"
              placeholder="Cari topik tasawuf, sosial, atau judul buku..."
              type="text"
            />
            <button className="bg-secondary text-on-secondary px-6 py-2 rounded-full font-headline font-semibold text-sm hover:scale-105 transition-transform duration-200 cursor-pointer">
              Cari
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-16">
          <Link href="#arsip" className="group flex items-center gap-3 font-headline font-bold text-lg tracking-tight text-primary hover:text-secondary transition-colors duration-300">
            Jelajahi Pemikiran
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Bento Grid Content Section */}
      <section id="arsip" className="w-full px-6 md:px-12 lg:px-24 mx-auto py-24">
        <div className="mb-16">
          <span className="font-label text-xs font-bold tracking-[0.2em] text-secondary uppercase">Arsip Terkini</span>
          <h2 className="font-headline font-bold text-4xl mt-4 text-primary">Karya &amp; Diskusi Terbaru</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[800px]">
          {/* Large Feature Card */}
          <div className="md:col-span-2 md:row-span-2 group relative overflow-hidden bg-surface-container-lowest rounded-xl flex flex-col">
            <div className="aspect-4/3 overflow-hidden relative">
              <img
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Close up of an old academic book in a dark library"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKwcnobdhy26N1geKOSprSLG_tGxFXN1tJAXIkXPobUcmtrEKLTGjBrQ5PjwdjG43xRCvMsneXkBHi2T1OYYLyUwjiXVXLnJih_8YQ3MzqHektcCR5nPIlAkAA3CzptzEHKGknvm2zusr9ZmOOUqpH_qTXJt1Ezo47lOLFTJx4lDgvvaQAGz_zDgMAtgdiHtybXz5jjPMjzNo5e-SAwrNSMhztmdsgi5lefKDJ5UHyCpMHZugALmMwYQd8BgqfPXncytq8K-CqjhU"
              />
            </div>
            <div className="p-10 flex-1 flex flex-col justify-end">
              <span className="text-secondary font-label text-xs font-bold tracking-widest uppercase mb-4">Filosofi &amp; Tasawuf</span>
              <h3 className="font-headline font-bold text-3xl text-primary mb-4 leading-tight">Integrasi Akal dan Kalbu dalam Menjawab Tantangan Modernitas</h3>
              <p className="text-on-surface-variant line-clamp-3 mb-8 text-lg leading-relaxed">Sebuah tinjauan mendalam mengenai bagaimana spiritualitas Islam dapat menjadi kompas etis di tengah disrupsi teknologi abad ke-21.</p>
              <Link href="#" className="inline-flex items-center text-secondary font-bold gap-2 group/link">
                Baca Selengkapnya
                <span className="material-symbols-outlined text-[20px] group-hover/link:translate-x-1 transition-transform">east</span>
              </Link>
            </div>
          </div>

          {/* Secondary Card 1 */}
          <div className="md:col-span-2 md:row-span-1 group relative overflow-hidden bg-surface-container-lowest rounded-xl flex flex-col md:flex-row">
            <div className="p-8 flex-1 flex flex-col justify-center">
              <span className="text-on-primary-container font-label text-xs font-bold tracking-widest uppercase mb-3">Sosial &amp; Politik</span>
              <h3 className="font-headline font-bold text-xl text-primary mb-4">Paradigma Keadilan Sosial dalam Konstruksi Masyarakat Madani</h3>
              <Link href="#" className="inline-flex items-center text-secondary font-bold text-sm gap-2">
                Akses Riset
                <span className="material-symbols-outlined text-[18px]">launch</span>
              </Link>
            </div>
            <div className="w-full md:w-1/3 overflow-hidden relative">
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                alt="People discussing in a modern open space office"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjF9vjFSvnFkzTn4tv0wAu7Qwhekmzmz3RVTk98JE8-dfcJN6N_mN3wf7iV2oz63V2lXLqNqn6jHItuFu41ezudRqCKN4YcOlrccJHf7rcY0dVBYG1kUqGBBx2jgFe76pm5CqqAj8biHKhMdSE8DqN0LzS7VnN844v0p8GGvaIkduvWhZHKgAOqVPiiDnpoh4SBfUt5sf6U61t0vSL9eiyM7nwcTezBvvm0xRsrFHWUpmeduhVhQbigsaQPk6FC9wSGjRiAGmZxvo"
              />
            </div>
          </div>

          {/* Secondary Card 2 (Small) */}
          <div className="md:col-span-1 md:row-span-1 group relative overflow-hidden bg-primary-container rounded-xl p-8 flex flex-col justify-between text-on-primary">
            <div className="mb-6">
              <span className="material-symbols-outlined text-4xl text-secondary-fixed">format_quote</span>
            </div>
            <div>
              <p className="font-body italic text-lg leading-relaxed mb-6">"Pendidikan bukan sekadar transfer ilmu, melainkan penyucian jiwa."</p>
              <span className="font-headline font-bold text-sm tracking-tight opacity-80">— Refleksi Jagat 'Arsy</span>
            </div>
          </div>

          {/* Secondary Card 3 (Small) */}
          <div className="md:col-span-1 md:row-span-1 group relative overflow-hidden bg-surface-container rounded-xl p-8 flex flex-col justify-center text-center border border-outline-variant/10">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-surface-container-lowest rounded-full flex items-center justify-center text-secondary shadow-sm">
                <span className="material-symbols-outlined text-3xl">library_books</span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-lg text-primary mb-2">Katalog Buku</h3>
            <p className="text-on-surface-variant text-sm mb-6">Jelajahi 10+ karya literasi yang telah diterbitkan.</p>
            <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-xs font-headline font-bold uppercase tracking-widest hover:bg-secondary transition-colors cursor-pointer">
              Buka Katalog
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
