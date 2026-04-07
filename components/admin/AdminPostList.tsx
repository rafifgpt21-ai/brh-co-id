'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { deletePost } from '@/lib/actions/post';
import { motion, AnimatePresence } from 'framer-motion';

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export function AdminPostList({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'Published' | 'Draft'>('all');
  const [isPending, startTransition] = useTransition();
  const [deleteModal, setDeleteModal] = useState<{ id: string, title: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Post; direction: 'asc' | 'desc' } | null>({
    key: 'updatedAt',
    direction: 'desc',
  });

  const requestSort = (key: keyof Post) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    const valA = a[key];
    const valB = b[key];

    if (valA < valB) {
      return direction === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const filteredPosts = sortedPosts.filter((post) => {
    const matchSearch = post.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = activeTab === 'all' || post.status === activeTab;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string, title: string) => {
    setDeleteModal({ id, title });
  };

  const confirmDelete = () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    setDeleteModal(null);

    startTransition(async () => {
      const result = await deletePost(id);
      if (result.success || result.error === 'Post tidak ditemukan') {
        setPosts(posts.filter((p) => p.id !== id));
      } else {
        alert(result.error || 'Gagal menghapus');
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs = [
    { key: 'all' as const, label: 'Semua Karya' },
    { key: 'Published' as const, label: 'Published' },
    { key: 'Draft' as const, label: 'Draft' },
  ];

  return (
    <div className="w-full pb-24 max-w-[1400px] mx-auto sm:px-6 lg:px-8">

      {/* 1. Header & Kontrol */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-3 md:py-4 sticky top-20 bg-surface/95 backdrop-blur-md z-20 px-1 md:px-0">

        {/* Filter Tab */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 font-semibold text-sm rounded-full whitespace-nowrap transition-all ${activeTab === tab.key
                ? 'bg-on-surface text-surface-container-lowest shadow-sm hover:shadow-md'
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low border border-outline-variant/30'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/50 text-[18px]">search</span>
            <input
              type="text"
              placeholder="Cari dalam karya..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-low/50 focus:bg-surface-container-low border border-outline-variant/30 rounded-full py-2.5 sm:py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:border-on-surface/40 transition-all text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>

          <Link href="/admin/post/new" className="shrink-0 ml-1 hidden sm:flex">
            <Button className="rounded-full! bg-primary text-on-primary hover:bg-primary/90 px-8 py-2.5 h-11 text-sm font-bold shadow-none flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>Tambah Baru</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Action Button (Mobile Only) */}
      <Link href="/admin/post/new" className="sm:hidden fixed bottom-8 right-6 z-50">
        <Button className="w-16 h-16 rounded-full! bg-primary text-on-primary shadow-2xl hover:bg-primary/90 flex items-center justify-center p-0">
          <span className="material-symbols-outlined text-[36px]">add</span>
        </Button>
      </Link>

      {/* 2. Area Data */}
      <div className={`bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>

        {/* Desktop Header Row */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-4 bg-surface-container-low/30 border-b border-outline-variant/30 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
          <button 
            onClick={() => requestSort('title')}
            className="col-span-1 lg:col-span-5 flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer text-left"
          >
            Judul Karya
            {sortConfig?.key === 'title' && (
              <span className="material-symbols-outlined text-[16px] animate-in fade-in duration-300">
                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => requestSort('category')}
            className="col-span-2 flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer text-left"
          >
            Kategori
            {sortConfig?.key === 'category' && (
              <span className="material-symbols-outlined text-[16px] animate-in fade-in duration-300">
                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>

          <button 
            onClick={() => requestSort('updatedAt')}
            className="col-span-2 flex items-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer text-left"
          >
            Terakhir Diubah
            {sortConfig?.key === 'updatedAt' && (
              <span className="material-symbols-outlined text-[16px] animate-in fade-in duration-300">
                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>

          <button 
            onClick={() => requestSort('status')}
            className="col-span-1 flex items-center justify-center gap-1.5 hover:text-on-surface transition-colors cursor-pointer"
          >
            Status
            {sortConfig?.key === 'status' && (
              <span className="material-symbols-outlined text-[16px] animate-in fade-in duration-300">
                {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
              </span>
            )}
          </button>

          <div className="col-span-2 text-right">Aksi</div>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-outline-variant/20">
          {filteredPosts.map((post) => (
            <div key={post.id} className="group grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start lg:items-center px-5 sm:px-6 lg:px-8 py-5 hover:bg-surface-container-low/50 transition-colors">

              {/* Kolom 1: Judul */}
              <div className="col-span-1 lg:col-span-5 flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant/80">
                  <span className="material-symbols-outlined text-[24px]">
                    {post.category === 'Buku' ? 'auto_stories' : post.category === 'Jurnal' ? 'science' : post.category === 'Opini' ? 'forum' : 'article'}
                  </span>
                </div>

                <div className="flex-1 pr-2">
                  <Link href={`/admin/post/${post.id}`}>
                    <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-2 lg:line-clamp-1 leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                  {/* Mobile meta */}
                  <div className="flex lg:hidden flex-wrap items-center gap-2 mt-1.5 text-xs text-on-surface-variant/80 font-medium">
                    <span className="bg-surface-container-low px-2 py-0.5 rounded-md">{post.category}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant/60"></span>
                    <span>{formatDate(post.updatedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-outline-variant/60"></span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${post.status === 'Published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-surface-container text-on-surface-variant'
                      }`}>
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom 2: Kategori */}
              <div className="hidden lg:block col-span-2 text-sm font-semibold text-on-surface-variant/80">
                {post.category}
              </div>

              {/* Kolom 3: Tanggal */}
              <div className="hidden lg:block col-span-2 text-sm text-on-surface-variant/80">
                {formatDate(post.updatedAt)}
              </div>

              {/* Kolom 4: Status Badge */}
              <div className="hidden lg:flex col-span-1 items-center justify-center">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${post.status === 'Published'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                  {post.status}
                </span>
              </div>

              {/* Kolom 5: Action Buttons */}
              <div className="col-span-1 lg:col-span-2 flex items-center justify-end gap-1.5 w-full lg:w-auto mt-2 lg:mt-0 transition-opacity">
                <Link
                  href={`/post/${post.slug}`}
                  target="_blank"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Lihat"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                </Link>
                <Link
                  href={`/admin/post/${post.id}`}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
                  title="Edit Karya"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </Link>
                <button
                  onClick={() => handleDelete(post.id, post.title)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center hover:bg-error-container text-on-surface-variant hover:text-error transition-colors cursor-pointer"
                  title="Hapus Karya"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

            </div>
          ))}

          {filteredPosts.length === 0 && (
            <div className="py-24 text-center">
              <div className="inline-flex w-20 h-20 items-center justify-center rounded-3xl bg-surface-container mb-5 text-on-surface-variant/30">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <p className="text-lg font-bold text-on-surface-variant">
                {search ? 'Tidak ditemukan' : 'Belum ada karya'}
              </p>
              <p className="text-sm text-on-surface-variant/60 mt-1 max-w-sm mx-auto">
                {search
                  ? `Tidak ada hasil untuk "${search}". Coba kata kunci lain.`
                  : 'Anda belum menambahkan artikel atau buku. Mulai tambahkan karya baru!'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Custom Modal Delete */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal(null)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-lowest rounded-4xl p-8 shadow-2xl border border-outline-variant/20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-error-container/20 flex items-center justify-center text-error mb-6">
                  <span className="material-symbols-outlined text-4xl">delete_forever</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Konfirmasi Hapus</h3>
                <p className="text-sm text-on-surface-variant font-medium leading-relaxed mb-8">
                  Apakah Anda yakin ingin menghapus <span className="text-on-surface font-bold italic">"{deleteModal.title}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button
                    onClick={() => setDeleteModal(null)}
                    variant="outline"
                    className="flex-1 rounded-full h-12 text-sm font-bold border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={confirmDelete}
                    className="flex-1 rounded-full h-12 text-sm font-bold bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/20"
                  >
                    Hapus Permanen
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
