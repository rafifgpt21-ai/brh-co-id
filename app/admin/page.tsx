import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function AdminDashboard() {
  const session = await auth();
  
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user?.role !== "ADMIN") {
    // RBAC: Hanya admin yang boleh masuk dashboard
    redirect("/");
  }

  // Data Dummy Diperkaya untuk menunjukkan kepadatan informasi
  const posts = [
    { id: "1", title: "Filsafat Sains Islami", category: "Buku", date: "21 Mar 2026", status: "Published", views: "1.2k" },
    { id: "2", title: "Epistemologi Tasawuf Nusantara", category: "Jurnal", date: "20 Mar 2026", status: "Draft", views: "-" },
    { id: "3", title: "Sejarah Peradaban Islam Abad Pertengahan", category: "Artikel", date: "15 Mar 2026", status: "Published", views: "342" },
    { id: "4", title: "Metodologi Penelitian Tafsir Kontemporer", category: "Buku", date: "10 Mar 2026", status: "Published", views: "890" },
    { id: "5", title: "Diskursus Kritis Pendidikan Agama", category: "Opini", date: "05 Mar 2026", status: "Draft", views: "-" },
  ];

  return (
    <div className="w-full pb-24 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 1. Header & Kontrol (Kepadatan Tinggi) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 md:py-3 sticky top-0 bg-surface/90 backdrop-blur-md z-20">
        
        {/* Filter Tab Berbentuk Pill (Sangat Rounded) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          <button className="px-5 py-2.5 bg-on-surface text-surface-container-lowest font-semibold text-sm rounded-full whitespace-nowrap shadow-sm hover:shadow-md transition-shadow">
            Semua Karya
          </button>
          <button className="px-5 py-2.5 bg-surface-container-lowest text-on-surface-variant font-medium text-sm rounded-full whitespace-nowrap hover:bg-surface-container-low border border-outline-variant/30 transition-colors">
            Published
          </button>
          <button className="px-5 py-2.5 bg-surface-container-lowest text-on-surface-variant font-medium text-sm rounded-full whitespace-nowrap hover:bg-surface-container-low border border-outline-variant/30 transition-colors">
            Draft
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Cari dalam karya..." 
              className="w-full bg-surface-container-low/50 focus:bg-surface-container-low border border-outline-variant/30 rounded-full py-2.5 sm:py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-on-surface/40 transition-all text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>
          
          <button className="w-11 h-11 shrink-0 bg-surface-container-lowest border border-outline-variant/30 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors tooltip" aria-label="Filter" title="Filter Pencarian">
            <span className="material-symbols-outlined text-[20px]">tune</span>
          </button>
          
          <Link href="/admin/post/new" className="shrink-0 ml-1">
            <Button className="rounded-full bg-primary text-on-primary hover:bg-primary/90 px-5 py-2.5 h-11 text-sm font-bold shadow-none flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">Tambah Baru</span>
            </Button>
          </Link>
          
        </div>
      </div>

      {/* 2. Area Data (Grid Layout & Sudut Membulat) */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
        
        {/* Desktop Header Row */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-container-low/30 border-b border-outline-variant/30 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
          <div className="col-span-5">Judul Karya</div>
          <div className="col-span-2">Kategori</div>
          <div className="col-span-2">Terakhir Diubah</div>
          <div className="col-span-1 text-center">Views</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-1 text-right">Aksi</div>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-outline-variant/20">
          {posts.map((post) => (
            <div key={post.id} className="group grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center px-5 sm:px-6 lg:px-8 py-5 hover:bg-surface-container-low/50 transition-colors">
              
              {/* Kolom 1: Judul Utama & Meta Mobile */}
              <div className="col-span-1 lg:col-span-5 flex items-start sm:items-center gap-4">
                {/* Ikon Tipe Karya (Meningkatkan kecepatan pemindaan mata) */}
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant/80">
                   <span className="material-symbols-outlined text-[24px]">
                     {post.category === 'Buku' ? 'auto_stories' : post.category === 'Jurnal' ? 'science' : 'article'}
                   </span>
                </div>
                
                <div className="flex-1 pr-2">
                  <Link href={`/admin/post/${post.id}`}>
                    <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 lg:line-clamp-1 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  {/* Tampil hanya di Mobile */}
                  <div className="flex lg:hidden flex-wrap items-center gap-2 mt-1.5 text-xs text-on-surface-variant/80 font-medium">
                    <span className="bg-surface-container-low px-2 py-0.5 rounded-md">{post.category}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant/60"></span>
                    <span>{post.date}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant/60"></span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      post.status === 'Published' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Kategori (Desktop) */}
              <div className="hidden lg:block col-span-2 text-sm font-semibold text-on-surface-variant/80">
                {post.category}
              </div>

              {/* Kolom 3: Tanggal (Desktop) */}
              <div className="hidden lg:block col-span-2 text-sm text-on-surface-variant/80">
                {post.date}
              </div>

              {/* Kolom 4: Views (Desktop) */}
              <div className="hidden lg:flex col-span-1 text-sm font-semibold text-on-surface-variant/80 items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50">visibility</span>
                {post.views}
              </div>

              {/* Kolom 5: Status Badge (Desktop) */}
              <div className="hidden lg:flex col-span-1 items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  post.status === 'Published' 
                    ? 'bg-success/15 text-success' 
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  {post.status}
                </span>
              </div>

              {/* Kolom 6: Action Buttons */}
              <div className="col-span-1 lg:col-span-1 flex items-center justify-end gap-1.5 w-full lg:w-auto mt-2 lg:mt-0 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/post/${post.id}`}>
                  <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors focus:ring-2 focus:ring-primary/50" title="Edit Karya">
                    <span className="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                </Link>
                <button className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors focus:ring-2 focus:ring-error/50" title="Hapus Karya">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              
            </div>
          ))}

          {posts.length === 0 && (
            <div className="py-24 text-center">
              <div className="inline-flex w-20 h-20 items-center justify-center rounded-3xl bg-surface-container mb-5 text-on-surface-variant/30">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <p className="text-lg font-bold text-on-surface-variant">Belum ada karya</p>
              <p className="text-sm text-on-surface-variant/60 mt-1 max-w-sm mx-auto">Anda belum menambahkan artikel atau buku sama sekali. Mulai tambahkan karya baru!</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Pagination */}
      {posts.length > 0 && (
        <div className="pt-8 flex justify-center pb-8">
          <button className="text-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors group flex items-center gap-2 px-6 py-3 border border-outline-variant/30 bg-surface-container-lowest rounded-full hover:bg-surface-container-low hover:border-outline-variant/50 shadow-sm">
            Tampilkan Lebih Banyak
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      )}
    </div>
  );
}
