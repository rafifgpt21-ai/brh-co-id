'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { deletePost, resetHomeFeaturedPostIds, saveHomeFeaturedPostIds } from '@/lib/actions/post';
import { motion, AnimatePresence } from 'framer-motion';
import { repostArticleToQuickPost } from '@/lib/actions/quick-post';
import Image from 'next/image';

type Post = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  thumbnail: string | null;
  excerpt: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ArticleRepost = {
  sourcePostId: string;
  content: string;
  includeThumbnail: boolean;
  status: 'Published' | 'Draft';
};

export function AdminPostList({
  initialPosts,
  initialHomeFeaturedPostIds,
  initialArticleReposts,
}: {
  initialPosts: Post[];
  initialHomeFeaturedPostIds: string[];
  initialArticleReposts: ArticleRepost[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'Published' | 'Draft'>('all');
  const [homeFeaturedPostIds, setHomeFeaturedPostIds] = useState(initialHomeFeaturedPostIds);
  const [featuredStatus, setFeaturedStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteModal, setDeleteModal] = useState<{ id: string, title: string } | null>(null);
  const [articleReposts, setArticleReposts] = useState<Record<string, ArticleRepost>>(() =>
    Object.fromEntries(initialArticleReposts.map((repost) => [repost.sourcePostId, repost]))
  );
  const [repostModal, setRepostModal] = useState<Post | null>(null);
  const [repostContent, setRepostContent] = useState('');
  const [repostStatus, setRepostStatus] = useState<'Published' | 'Draft'>('Published');
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [repostMessage, setRepostMessage] = useState('');
  const [repostToast, setRepostToast] = useState('');
  const [isRepostPending, startRepostTransition] = useTransition();
  const repostTextareaRef = useRef<HTMLTextAreaElement>(null);
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
    
    const valA = a[key] ?? '';
    const valB = b[key] ?? '';

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

  const publishedPosts = [...posts]
    .filter((post) => post.status === 'Published')
    .sort((a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );
  const featuredPostMap = new Map(posts.map((post) => [post.id, post]));
  const visibleHomeFeaturedPostIds = homeFeaturedPostIds.filter((id) => featuredPostMap.get(id)?.status === 'Published');
  const selectedFeaturedPosts = visibleHomeFeaturedPostIds
    .map((id) => featuredPostMap.get(id))
    .filter((post): post is Post => Boolean(post));
  const availableFeaturedPosts = publishedPosts.filter((post) => !visibleHomeFeaturedPostIds.includes(post.id));
  const canAddFeaturedPost = selectedFeaturedPosts.length < 5 && availableFeaturedPosts.length > 0;

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
        setHomeFeaturedPostIds((currentIds) => currentIds.filter((postId) => postId !== id));
      } else {
        alert(result.error || 'Gagal menghapus');
      }
    });
  };

  const openRepost = (post: Post) => {
    const existing = articleReposts[post.id];
    setRepostModal(post);
    setRepostContent(existing?.content || post.excerpt || `Baca karya terbaru BRH Insight: ${post.title}`);
    setRepostStatus(existing?.status || 'Published');
    setIncludeThumbnail(existing?.includeThumbnail ?? Boolean(post.thumbnail));
    setRepostMessage('');
  };

  const closeRepost = () => {
    if (isRepostPending) return;
    setRepostModal(null);
    setRepostMessage('');
  };

  const submitRepost = () => {
    if (!repostModal || !repostContent.trim()) {
      setRepostMessage('Ringkasan tidak boleh kosong.');
      return;
    }

    const sourcePost = repostModal;
    setRepostMessage('');
    startRepostTransition(async () => {
      const result = await repostArticleToQuickPost({
        postId: sourcePost.id,
        content: repostContent,
        includeThumbnail,
        status: repostStatus,
      });
      if (!result.success) {
        setRepostMessage(result.error || 'Gagal merepost artikel.');
        return;
      }

      setArticleReposts((current) => ({
        ...current,
        [sourcePost.id]: {
          sourcePostId: sourcePost.id,
          content: repostContent.trim(),
          includeThumbnail,
          status: repostStatus,
        },
      }));
      setRepostModal(null);
      setRepostToast(result.updated ? 'Repost berhasil diperbarui.' : 'Artikel berhasil direpost ke Perspektif BRH.');
    });
  };

  useEffect(() => {
    if (!repostModal) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => repostTextareaRef.current?.focus(), 120);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isRepostPending) {
        setRepostModal(null);
        setRepostMessage('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [repostModal, isRepostPending]);

  useEffect(() => {
    if (!repostToast) return;
    const timer = window.setTimeout(() => setRepostToast(''), 4000);
    return () => window.clearTimeout(timer);
  }, [repostToast]);

  const addFeaturedPost = (id: string) => {
    if (!id) return;
    setFeaturedStatus(null);
    setHomeFeaturedPostIds((currentIds) => {
      const validCurrentIds = currentIds.filter((postId) => featuredPostMap.get(postId)?.status === 'Published');
      if (validCurrentIds.includes(id) || validCurrentIds.length >= 5) return validCurrentIds;
      return [...validCurrentIds, id];
    });
  };

  const removeFeaturedPost = (id: string) => {
    setFeaturedStatus(null);
    setHomeFeaturedPostIds((currentIds) => currentIds.filter((postId) => postId !== id));
  };

  const moveFeaturedPost = (id: string, direction: 'up' | 'down') => {
    setFeaturedStatus(null);
    setHomeFeaturedPostIds((currentIds) => {
      const validCurrentIds = currentIds.filter((postId) => featuredPostMap.get(postId)?.status === 'Published');
      const index = validCurrentIds.indexOf(id);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= validCurrentIds.length) return validCurrentIds;

      const nextIds = [...validCurrentIds];
      [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
      return nextIds;
    });
  };

  const saveFeaturedPosts = () => {
    setFeaturedStatus(null);
    if (visibleHomeFeaturedPostIds.length !== 5) {
      setFeaturedStatus({ type: 'error', message: 'Lengkapi tepat 5 karya sebelum menyimpan Highlight.' });
      return;
    }
    startTransition(async () => {
      const result = await saveHomeFeaturedPostIds(visibleHomeFeaturedPostIds);
      if (result.success) {
        setHomeFeaturedPostIds(result.homeFeaturedPostIds || []);
        setFeaturedStatus({ type: 'success', message: 'Lima karya Highlight berhasil disimpan.' });
      } else {
        setFeaturedStatus({ type: 'error', message: result.error || 'Gagal menyimpan pilihan beranda.' });
      }
    });
  };

  const resetFeaturedPosts = () => {
    setFeaturedStatus(null);
    startTransition(async () => {
      const result = await resetHomeFeaturedPostIds();
      if (result.success) {
        setHomeFeaturedPostIds([]);
        setFeaturedStatus({ type: 'success', message: 'Pilihan Highlight dikosongkan.' });
      } else {
        setFeaturedStatus({ type: 'error', message: result.error || 'Gagal mereset pilihan beranda.' });
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-3 md:py-4 bg-surface/95 backdrop-blur-md px-1 md:px-0 lg:sticky lg:top-14 lg:z-40">

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

      <div className="mb-5 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[22px]">star</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-on-surface">Kelola Highlight</h2>
                <p className="text-sm font-medium text-on-surface-variant/70">
                  Pilih tepat 5 karya Published. Urutan di bawah menjadi urutan tampil di beranda.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value=""
              onChange={(event) => addFeaturedPost(event.target.value)}
              disabled={!canAddFeaturedPost || isPending}
              className="h-11 min-w-0 rounded-full border border-outline-variant/40 bg-surface px-4 text-sm font-bold text-on-surface outline-none transition focus:border-on-surface/50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-72"
            >
              <option value="">
                {selectedFeaturedPosts.length >= 5 ? 'Highlight sudah lengkap' : `Tambah karya (${selectedFeaturedPosts.length}/5)`}
              </option>
              {availableFeaturedPosts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
            <Button
              onClick={saveFeaturedPosts}
              disabled={isPending || selectedFeaturedPosts.length !== 5}
              className="h-11 rounded-full! bg-primary px-5 text-sm font-black text-on-primary hover:bg-primary/90 disabled:opacity-60"
            >
              Simpan
            </Button>
            <Button
              onClick={resetFeaturedPosts}
              disabled={isPending}
              variant="outline"
              className="h-11 rounded-full! border-outline-variant/40 px-5 text-sm font-black text-on-surface-variant hover:bg-surface-container-high disabled:opacity-60"
            >
              Reset
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => {
            const post = selectedFeaturedPosts[index];

            return (
              <div
                key={post?.id || index}
                className="flex min-h-20 items-center gap-3 rounded-2xl border border-outline-variant/25 bg-surface px-4 py-3"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${post ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant/50'}`}>
                  {index + 1}
                </div>
                {post ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-black leading-snug text-on-surface">{post.title}</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-secondary">{post.category}</p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        onClick={() => moveFeaturedPost(post.id, 'up')}
                        disabled={index === 0 || isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:opacity-30"
                        title="Naikkan urutan"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                      </button>
                      <button
                        onClick={() => moveFeaturedPost(post.id, 'down')}
                        disabled={index === selectedFeaturedPosts.length - 1 || isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface disabled:opacity-30"
                        title="Turunkan urutan"
                      >
                        <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                      </button>
                      <button
                        onClick={() => removeFeaturedPost(post.id)}
                        disabled={isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-error disabled:opacity-30"
                        title="Hapus dari beranda"
                      >
                        <span className="material-symbols-outlined text-[17px]">close</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-on-surface-variant/45">Belum dipilih</p>
                )}
              </div>
            );
          })}
        </div>

        {featuredStatus && (
          <p className={`mt-4 text-sm font-bold ${featuredStatus.type === 'success' ? 'text-green-700' : 'text-error'}`}>
            {featuredStatus.message}
          </p>
        )}
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
                  {visibleHomeFeaturedPostIds.includes(post.id) && post.status === 'Published' && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary">
                      <span className="material-symbols-outlined text-[14px]">star</span>
                      Highlight #{visibleHomeFeaturedPostIds.indexOf(post.id) + 1}
                    </span>
                  )}
                  {articleReposts[post.id] && (
                    <span className="mt-2 ml-1 inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-secondary">
                      <span className="material-symbols-outlined text-[14px]">repeat</span>
                      Perspektif BRH
                    </span>
                  )}
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
                {post.status === 'Published' && (
                  <button
                    type="button"
                    onClick={() => openRepost(post)}
                    className="mr-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-secondary/10 px-3.5 text-secondary transition hover:bg-secondary hover:text-on-secondary lg:mr-0 lg:w-11 lg:px-0"
                    title={articleReposts[post.id] ? 'Perbarui repost di Perspektif BRH' : 'Repost ke Perspektif BRH'}
                    aria-label={articleReposts[post.id] ? 'Perbarui repost di Perspektif BRH' : 'Repost ke Perspektif BRH'}
                  >
                    <span className="material-symbols-outlined text-[20px]">repeat</span>
                    <span className="text-xs font-black lg:hidden">{articleReposts[post.id] ? 'Perbarui repost' : 'Repost'}</span>
                  </button>
                )}
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
                  Apakah Anda yakin ingin menghapus <span className="text-on-surface font-bold italic">&quot;{deleteModal.title}&quot;</span>? Tindakan ini tidak dapat dibatalkan.
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

      <AnimatePresence>
        {repostModal && (
          <div className="fixed inset-0 z-100 flex items-end justify-center sm:items-center sm:p-5" role="presentation">
            <motion.button
              type="button"
              aria-label="Tutup dialog repost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeRepost}
              className="absolute inset-0 h-full w-full bg-on-surface/45 backdrop-blur-sm"
            />
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="repost-dialog-title"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[2rem] border border-outline-variant/20 bg-surface-container-lowest shadow-2xl sm:max-h-[88vh] sm:rounded-[2rem]"
            >
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-outline-variant/50 sm:hidden" />
              <header className="flex items-start gap-3 border-b border-outline-variant/20 px-5 py-4 sm:px-6 sm:py-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary text-on-secondary">
                  <span className="material-symbols-outlined text-[23px]">repeat</span>
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="repost-dialog-title" className="font-headline text-lg font-black leading-tight text-primary sm:text-xl">
                    {articleReposts[repostModal.id] ? 'Perbarui repost' : 'Repost ke Perspektif BRH'}
                  </h2>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-on-surface-variant/70">
                    Ringkasan ini akan tampil sebagai Perspektif BRH dan tetap terhubung ke artikel asli.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRepost}
                  disabled={isRepostPending}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-container text-on-surface-variant transition hover:text-on-surface disabled:opacity-50"
                  aria-label="Tutup"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </header>

              <div className="overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex items-center gap-3 rounded-2xl border border-outline-variant/25 bg-surface-container-low p-3">
                  {repostModal.thumbnail ? (
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-container">
                      <Image src={repostModal.thumbnail} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                  ) : (
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surface-container text-on-surface-variant">
                      <span className="material-symbols-outlined">article</span>
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Artikel sumber</p>
                    <p className="mt-1 line-clamp-2 text-sm font-black leading-snug text-on-surface">{repostModal.title}</p>
                  </div>
                </div>

                <label htmlFor="repost-content" className="mt-5 block text-xs font-black uppercase tracking-wider text-on-surface-variant">
                  Ringkasan Perspektif
                </label>
                <textarea
                  ref={repostTextareaRef}
                  id="repost-content"
                  value={repostContent}
                  onChange={(event) => {
                    setRepostContent(event.target.value);
                    setRepostMessage('');
                  }}
                  maxLength={2000}
                  rows={6}
                  disabled={isRepostPending}
                  placeholder="Tulis ringkasan singkat yang mengundang pembaca membuka artikel..."
                  className="mt-2 min-h-36 w-full resize-none rounded-2xl border border-outline-variant/35 bg-surface px-4 py-3 font-body text-base leading-relaxed text-on-surface outline-none transition focus:border-secondary focus:ring-4 focus:ring-secondary/10 disabled:opacity-60"
                />
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <p className={`text-xs font-bold ${repostMessage ? 'text-error' : 'text-on-surface-variant/55'}`} role="status">
                    {repostMessage || 'Bisa diedit sebelum dipublikasikan.'}
                  </p>
                  <span className="shrink-0 text-xs font-bold tabular-nums text-on-surface-variant/50">{repostContent.length}/2000</span>
                </div>

                {repostModal.thumbnail && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeThumbnail}
                    onClick={() => setIncludeThumbnail((current) => !current)}
                    disabled={isRepostPending}
                    className="mt-4 flex min-h-13 w-full items-center gap-3 rounded-2xl border border-outline-variant/25 px-4 py-3 text-left transition hover:bg-surface-container-low disabled:opacity-60"
                  >
                    <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${includeThumbnail ? 'bg-secondary' : 'bg-surface-container-high'}`}>
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${includeThumbnail ? 'left-6' : 'left-1'}`} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-on-surface">Tampilkan sampul artikel</span>
                      <span className="mt-0.5 block text-xs text-on-surface-variant/65">Gunakan gambar artikel pada kartu Perspektif BRH.</span>
                    </span>
                  </button>
                )}

                <fieldset className="mt-5">
                  <legend className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Simpan sebagai</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-surface-container p-1.5">
                    {(['Published', 'Draft'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setRepostStatus(status)}
                        disabled={isRepostPending}
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black transition disabled:opacity-60 ${repostStatus === status ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-lowest'}`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{status === 'Published' ? 'public' : 'edit_note'}</span>
                        {status === 'Published' ? 'Publish' : 'Draft'}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <footer className="border-t border-outline-variant/20 bg-surface-container-lowest px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-5">
                <button
                  type="button"
                  onClick={submitRepost}
                  disabled={isRepostPending || !repostContent.trim()}
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black text-on-primary shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55"
                >
                  <span className={`material-symbols-outlined text-[20px] ${isRepostPending ? 'animate-spin' : ''}`}>{isRepostPending ? 'progress_activity' : 'repeat'}</span>
                  {isRepostPending ? 'Menyimpan repost...' : articleReposts[repostModal.id] ? 'Perbarui repost' : 'Repost sekarang'}
                </button>
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repostToast && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            role="status"
            className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-110 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl bg-on-surface px-4 py-3 text-surface shadow-2xl"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-on-secondary">
              <span className="material-symbols-outlined text-[18px]">check</span>
            </span>
            <span className="text-sm font-bold leading-snug">{repostToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
