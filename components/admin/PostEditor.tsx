'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TiptapEditor } from './TiptapEditor';
import { savePost } from '@/lib/actions/post';
import { uploadFiles } from '@/lib/uploadthing'; // Ganti useUploadThing dengan uploadFiles
import { deleteFilesFromStorage } from '@/lib/uploadthing-server';
import { deletePost } from '@/lib/actions/post';
import { motion, AnimatePresence } from 'framer-motion';

type Block = {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'link';
  content: string;
  url?: string;
  title?: string;
  caption?: string;
  isLocked?: boolean;
};

const CATEGORIES = ['Buku', 'Jurnal', 'Artikel', 'Opini'];

export const PostEditor = ({ initialData }: { initialData?: any }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Buku');
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
  const [blocks, setBlocks] = useState<Block[]>(() =>
    initialData?.blocks ? JSON.parse(JSON.stringify(initialData.blocks)) : []
  );
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isMobileMetaOpen, setIsMobileMetaOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockFileInputRef = useRef<HTMLInputElement>(null);
  const [activeBlockTarget, setActiveBlockTarget] = useState<string | null>(null);

  // New states for deferred uploads
  const [stagedFiles, setStagedFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'Idle' | 'Uploading' | 'Saving' | 'Success' | 'Error'>('Idle');
  const [isSavingInProgress, setIsSavingInProgress] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const isDirty =
    title !== (initialData?.title || '') ||
    category !== (initialData?.category || 'Buku') ||
    thumbnail !== (initialData?.thumbnail || '') ||
    Object.keys(stagedFiles).length > 0 ||
    JSON.stringify(blocks.map(b => ({ ...b, id: b.id }))) !== JSON.stringify((initialData?.blocks || []).map((b: any) => ({ ...b, id: b.id })));

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor instanceof HTMLAnchorElement) {
        const href = anchor.getAttribute('href');
        // If it's an internal link
        if (href && (href.startsWith('/') || href.startsWith(window.location.origin))) {
          e.preventDefault();
          e.stopPropagation();
          setPendingPath(href);
          setShowUnsavedConfirm(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, true);
    return () => document.removeEventListener('click', handleAnchorClick, true);
  }, [isDirty]);

  const handleBack = () => {
    if (isDirty) {
      setPendingPath('/admin');
      setShowUnsavedConfirm(true);
    } else {
      router.push('/admin');
    }
  };


  const handleThumbnailClick = () => {
    fileInputRef.current?.click();
  };

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previews.thumbnail) URL.revokeObjectURL(previews.thumbnail);
      setStagedFiles(prev => ({ ...prev, thumbnail: file }));
      const objectUrl = URL.createObjectURL(file);
      setPreviews(prev => ({ ...prev, thumbnail: objectUrl }));
    }
  };

  const onBlockFileChange = (blockId: string, file: File) => {
    if (previews[blockId]) URL.revokeObjectURL(previews[blockId]);
    setStagedFiles(prev => ({ ...prev, [blockId]: file }));
    const objectUrl = URL.createObjectURL(file);
    setPreviews(prev => ({ ...prev, [blockId]: objectUrl }));
  };

  const onBlockFileSelect = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (blockFileInputRef.current) {
      blockFileInputRef.current.accept = block?.type === 'image' ? 'image/*' : 'application/pdf';
    }
    setActiveBlockTarget(blockId);
    blockFileInputRef.current?.click();
  };

  const handleBlockFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeBlockTarget) {
      onBlockFileChange(activeBlockTarget, file);
      e.target.value = ''; // Reset for same file selection
    }
  };

  // Consolidated Revocation Effect
  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      url: '',
      isLocked: false,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const removeBlock = (id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    const isEmpty = block.type === 'text'
      ? (!block.content || block.content.replace(/<[^>]*>/g, '').trim() === '')
      : (!block.url && !block.title && !block.caption && !stagedFiles[id]);

    if (isEmpty) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      // Cleanup staged files and previews
      if (stagedFiles[id]) {
        const newStaged = { ...stagedFiles };
        delete newStaged[id];
        setStagedFiles(newStaged);
      }
      if (previews[id]) {
        URL.revokeObjectURL(previews[id]);
        const newPreviews = { ...previews };
        delete newPreviews[id];
        setPreviews(newPreviews);
      }
      return;
    }

    setBlockToDelete(id);
  };

  const handleSave = async (status: 'Published' | 'Draft') => {
    if (!title.trim()) {
      alert('Judul tidak boleh kosong!');
      return;
    }

    setIsSavingInProgress(true);
    setSaveStatus('Uploading');

    // We don't necessarily need startTransition if we manage our own isSavingInProgress
    try {
      let finalThumbnail = thumbnail;
      let finalBlocks = [...blocks];

      // 1. Upload staged files
      const filesToUpload = Object.entries(stagedFiles);
      if (filesToUpload.length > 0) {
        const endpointsMapping = filesToUpload.map(([key, file]) => {
          if (key === 'thumbnail') return 'imageUploader';
          const block = blocks.find(b => b.id === key);
          return block?.type === 'pdf' ? 'pdfUploader' : 'imageUploader' as const;
        });

        // Upload in batch
        // Note: uploadFiles expects an array of files and an endpoint.
        // Since we might have different endpoints, we grouped them logic-wise.
        // But for simplicity and because UploadThing handles files, we can just loop or batch by endpoint.

        // Group by endpoint
        const byEndpoint: Record<string, { keys: string[], files: File[] }> = {
          imageUploader: { keys: [], files: [] },
          pdfUploader: { keys: [], files: [] }
        };

        filesToUpload.forEach(([key, file], index) => {
          const endpoint = endpointsMapping[index];
          byEndpoint[endpoint].keys.push(key);
          byEndpoint[endpoint].files.push(file);
        });

        for (const [endpoint, data] of Object.entries(byEndpoint)) {
          if (data.files.length > 0) {
            const res = await uploadFiles(endpoint as any, {
              files: data.files,
            });

            // Apply the new URLs back
            res.forEach((uploadedFile, i) => {
              const key = data.keys[i];
              const newUrl = uploadedFile.ufsUrl || uploadedFile.url;
              if (key === 'thumbnail') {
                finalThumbnail = newUrl;
              } else {
                finalBlocks = finalBlocks.map(b => b.id === key ? { ...b, url: newUrl } : b);
              }
            });
          }
        }
      }

      setSaveStatus('Saving');

      const result = await savePost({
        id: initialData?.id,
        title,
        category,
        thumbnail: finalThumbnail,
        status,
        blocks: finalBlocks.map((b) => ({
          id: b.id,
          type: b.type,
          content: b.content,
          url: b.url,
          title: b.title || '',
          caption: b.caption || '',
          isLocked: b.isLocked ?? false,
        })),
      });

      if (result.success) {
        setSaveStatus('Success');
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setSaveStatus('Error');
        alert(result.error || 'Gagal menyimpan');
        setSaveStatus('Idle');
      }
    } catch (error: any) {
      console.error("Upload/Save error:", error);
      setSaveStatus('Error');
      alert(`Terjadi kesalahan: ${error.message}`);
      setSaveStatus('Idle');
    } finally {
      setIsSavingInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;

    startTransition(async () => {
      const result = await deletePost(initialData.id);
      if (result.success) {
        router.push('/admin');
        router.refresh();
      } else {
        alert(result.error || 'Gagal menghapus');
        setShowDeleteConfirm(false);
      }
    });
  };

  return (
    <div className="min-h-screen">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onThumbnailChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={blockFileInputRef}
        onChange={handleBlockFileChange}
        className="hidden"
      />
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-secondary-fixed opacity-10 blur-[160px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-primary-fixed opacity-10 blur-[140px] rounded-full" />
      </div>

      {/* ════════════════════════════════════════
          Mobile / Intermediate — Fixed top bar (below main nav)
          Visible on: xs → md → lg-1  (hidden on lg+)
          ════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-[80px] inset-x-0 z-30">
        {/* Primary row */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/15 shadow-sm">
          {/* Back */}
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-container border border-outline-variant/20 text-secondary hover:bg-surface-container-high transition-all shrink-0 active:scale-95"
            title="Kembali"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>

          {/* Title + label */}
          <div className="flex-1 min-w-0 px-1">
            <p className="text-[8px] font-label font-bold tracking-[0.2em] text-secondary uppercase leading-none mb-1 opacity-70">
              {initialData?.id ? 'Edit Mode' : 'Draft Mode'}
            </p>
            <p className="text-sm font-headline font-bold text-primary truncate leading-tight">
              {title || 'Postingan Baru'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Save Button */}
            <button
              onClick={() => handleSave(initialData?.status || 'Published')}
              disabled={isSavingInProgress}
              className={`flex items-center justify-center gap-2 h-10 px-4 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 ${isDirty
                ? 'bg-secondary text-on-secondary shadow-secondary/20'
                : 'bg-surface-container text-on-surface-variant border border-outline-variant/20'}`}
              title="Simpan Perubahan"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPending ? 'sync' : 'save'}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wide hidden xs:inline">
                {isPending ? 'Saving...' : 'Simpan'}
              </span>
            </button>

            {/* Expand metadata toggle - Repurposed as "More" menu */}
            <button
              type="button"
              onClick={() => setIsMobileMetaOpen(!isMobileMetaOpen)}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all shrink-0 active:scale-95 ${isMobileMetaOpen
                ? 'bg-primary text-on-primary shadow-lg'
                : 'bg-surface-container border border-outline-variant/20 text-on-surface-variant'
                }`}
              title="Menu Lainnya"
            >
              <span className="material-symbols-outlined text-[22px] transition-transform duration-300" style={{ transform: isMobileMetaOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                {isMobileMetaOpen ? 'close' : 'more_vert'}
              </span>
            </button>
          </div>
        </div>

        {/* Expandable metadata drawer */}
        {isMobileMetaOpen && (
          <div className="bg-surface-container-lowest/98 backdrop-blur-xl border-b border-outline-variant/25 shadow-2xl px-4 py-5 flex flex-col gap-5 animate-in slide-in-from-top duration-300">

            {/* Quick Actions in Drawer */}
            <div className="flex flex-col gap-3">
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-0.5 block">Tindakan</label>
              <div className="grid grid-cols-2 gap-3">
                {initialData?.id ? (
                  <>
                    {/* Status Toggle */}
                    {initialData?.status === 'Published' ? (
                      <button
                        onClick={() => handleSave('Draft')}
                        disabled={isSavingInProgress}
                        className="flex items-center justify-center gap-2 px-4 h-12 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant font-bold text-xs"
                      >
                        <span className="material-symbols-outlined text-[20px]">drafts</span>
                        KE DRAFT
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSave('Published')}
                        disabled={isSavingInProgress}
                        className="flex items-center justify-center gap-2 px-4 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 text-secondary font-bold text-xs"
                      >
                        <span className="material-symbols-outlined text-[20px]">publish</span>
                        TERBITKAN
                      </button>
                    )}
                    {/* Delete button */}
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSavingInProgress}
                      className="flex items-center justify-center gap-2 px-4 h-12 rounded-2xl bg-error/10 border border-error/20 text-error font-bold text-xs"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      HAPUS POS
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleSave('Draft')}
                      disabled={isSavingInProgress}
                      className="flex items-center justify-center gap-2 px-4 h-12 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant font-bold text-xs"
                    >
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      SIMPAN DRAFT
                    </button>
                    <button
                      onClick={() => handleSave('Published')}
                      disabled={isSavingInProgress}
                      className="flex items-center justify-center gap-2 px-4 h-12 rounded-2xl bg-secondary text-on-secondary font-bold text-xs"
                    >
                      <span className="material-symbols-outlined text-[20px]">publish</span>
                      PUBLISH
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="h-px bg-outline-variant/20 w-full" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title input */}
              <div>
                <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Judul Postingan</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Tulis judul…"
                  className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-2xl px-4 py-3 text-primary font-headline font-bold text-sm focus:outline-none focus:border-secondary/50 transition-all placeholder:text-on-surface-variant/30"
                />
              </div>
              {/* Category */}
              <div>
                <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Kategori</label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-2xl px-4 py-3 text-primary text-sm font-medium focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-[18px]">expand_more</span>
                </div>
              </div>
            </div>

            {/* Thumbnail compact */}
            <div>
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Thumbnail</label>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-all ${previews.thumbnail || thumbnail ? 'border-secondary/30 scale-105' : 'border-outline-variant/20 bg-surface-container/50'
                  }`}>
                  {previews.thumbnail || thumbnail
                    ? <img src={previews.thumbnail || thumbnail} alt="Preview" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-secondary/30 text-2xl">add_photo_alternate</span>
                  }
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleThumbnailClick}
                      disabled={saveStatus !== 'Idle'}
                      className="flex-1 h-11 px-4 rounded-xl bg-secondary text-on-secondary text-[10px] font-extrabold transition-all hover:bg-primary shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {saveStatus === 'Uploading' ? 'sync' : 'add_a_photo'}
                      </span>
                      {saveStatus === 'Uploading' ? 'LOADING' : (previews.thumbnail || thumbnail ? 'GANTI' : 'UNGGAH')}
                    </button>
                    {(previews.thumbnail || thumbnail) && saveStatus === 'Idle' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Hapus thumbnail?')) {
                            if (stagedFiles.thumbnail) {
                              const newStaged = { ...stagedFiles };
                              delete newStaged.thumbnail;
                              setStagedFiles(newStaged);
                            }
                            if (previews.thumbnail) {
                              URL.revokeObjectURL(previews.thumbnail);
                              const newPreviews = { ...previews };
                              delete newPreviews.thumbnail;
                              setPreviews(newPreviews);
                            }
                            setThumbnail('');
                          }
                        }}
                        className="w-11 h-11 rounded-xl bg-error/10 hover:bg-error/20 text-error transition-all flex items-center justify-center active:scale-95 border border-error/20"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[8px] font-medium text-on-surface-variant/50 leading-tight uppercase tracking-wider">Rasio 1:1 disarankan untuk tampilan optimal.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Main editor area (right padding to avoid sidebar overlap on lg+) ── */}
      <main className="min-h-screen sm:px-8 xl:px-14 pb-32 lg:pr-80 xl:pr-88
        pt-[80px] lg:pt-6">

        {/* ── Blocks ── */}
        <div className="space-y-6">
          {blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest/40">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 shadow-inner">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">
                  article
                </span>
              </div>
              <p className="font-headline font-bold text-primary/60 mb-1">Belum ada konten</p>
              <p className="text-xs text-on-surface-variant/50">
                Tambahkan balok melalui toolbar di bawah
              </p>
            </div>
          )}

          {blocks.map((block, i) => (
            <div
              key={block.id}
              className="group relative bg-surface-container-lowest/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-outline-variant/15 hover:border-outline-variant/30 hover:shadow-md transition-all"
            >
              {/* Block control row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">
                    {block.type === 'text' && 'notes'}
                    {block.type === 'image' && 'image'}
                    {block.type === 'video' && 'smart_display'}
                    {block.type === 'pdf' && 'picture_as_pdf'}
                    {block.type === 'link' && 'link'}
                  </span>
                  Balok {block.type === 'link' ? 'Tautan / Sumber' : block.type}
                </span>

                {/* Action pills */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-container-lowest border border-outline-variant/20 shadow-sm rounded-full px-1 py-1 z-10 pointer-events-auto">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveBlock(i, 'up'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors"
                    title="Naik"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveBlock(i, 'down'); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors"
                    title="Turun"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
                  </button>
                  <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />

                  {blockToDelete === block.id ? (
                    <div className="flex items-center gap-1.5 px-1 animate-in slide-in-from-right-2 duration-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBlocks(prev => prev.filter(b => b.id !== block.id));
                          setBlockToDelete(null);
                        }}
                        className="h-7 px-3 rounded-full bg-error text-on-error text-[9px] font-black uppercase tracking-wider hover:bg-error-container hover:text-on-error-container transition-colors shadow-sm"
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBlockToDelete(null); }}
                        className="h-7 px-3 rounded-full bg-surface-container-high text-on-surface-variant text-[9px] font-black uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors"
                      title="Hapus"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Text block */}
              {block.type === 'text' && (
                <TiptapEditor
                  content={block.content}
                  onChange={(html) => {
                    setBlocks((prev) =>
                      prev.map((b, index) =>
                        index === i ? { ...b, content: html } : b
                      )
                    );
                  }}
                />
              )}

              {/* Image / PDF block */}
              {(block.type === 'image' || block.type === 'pdf') && (
                <div className="space-y-4">
                  <input
                    placeholder="Judul Konten (Opsional)..."
                    value={block.title || ''}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, index) =>
                          index === i ? { ...b, title: e.target.value } : b
                        )
                      );
                    }}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
                  />

                  {block.url || previews[block.id] ? (
                    <div className="relative group/media rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-low">
                      {block.type === 'image' ? (
                        <div className="relative aspect-video flex items-center justify-center bg-surface-container-low/50">
                          <img src={previews[block.id] || block.url} alt={block.title || 'Upload'} className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                          </div>
                          <p className="text-sm font-bold text-primary truncate max-w-[250px] px-4">
                            {stagedFiles[block.id] ? stagedFiles[block.id].name : (block.url ? 'PDF Terlampir' : 'PDF Terpilih')}
                          </p>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-black/80 to-transparent flex items-center justify-between translate-y-2 opacity-0 group-hover/media:translate-y-0 group-hover/media:opacity-100 transition-all">
                        <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          {stagedFiles[block.id] ? 'Staged' : 'Ready'}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onBlockFileSelect(block.id)}
                            className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold transition-colors"
                          >
                            Ganti File
                          </button>tombol search berfungsi dengan baik di pdf view
                          sepertinya pdf view ini sangat berat, apalah ada cara untuk membuatnya lebih ringan untuk di muat, gunakan hacks atau trik kalau bisa
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-outline-variant/40 bg-primary-container/10 hover:bg-primary-container/20 transition-colors rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 bg-surface-container-lowest shadow-sm rounded-full flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-3xl text-secondary">
                          {block.type === 'pdf' ? 'description' : 'add_photo_alternate'}
                        </span>
                      </div>
                      <p className="text-primary font-headline font-bold mb-1">
                        Unggah {block.type === 'image' ? 'Gambar' : 'Dokumen PDF'}
                      </p>
                      <p className="text-on-surface-variant text-xs mb-4">Maks: {block.type === 'image' ? '4MB' : '16MB'}</p>
                      <button
                        onClick={() => onBlockFileSelect(block.id)}
                        className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-headline font-bold text-xs hover:scale-105 transition-transform shadow-md"
                      >
                        Pilih File
                      </button>
                    </div>
                  )}

                  <textarea
                    placeholder="Keterangan atau Sumber (Opsional)..."
                    value={block.caption || ''}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, index) =>
                          index === i ? { ...b, caption: e.target.value } : b
                        )
                      );
                    }}
                    rows={2}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  />
                </div>
              )}

              {/* Video block */}
              {block.type === 'video' && (
                <div className="space-y-4">
                  <input
                    placeholder="Judul Video (Opsional)..."
                    value={block.title || ''}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, index) =>
                          index === i ? { ...b, title: e.target.value } : b
                        )
                      );
                    }}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
                  />
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">link</span>
                    <input
                      placeholder="Masukkan URL YouTube..."
                      value={block.url || ''}
                      onChange={(e) => {
                        setBlocks((prev) =>
                          prev.map((b, index) =>
                            index === i ? { ...b, url: e.target.value } : b
                          )
                        );
                      }}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/50 rounded-xl py-3.5 pl-12 pr-4 text-primary focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <textarea
                    placeholder="Keterangan Video (Opsional)..."
                    value={block.caption || ''}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, index) =>
                          index === i ? { ...b, caption: e.target.value } : b
                        )
                      );
                    }}
                    rows={2}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  />
                </div>
              )}

              {/* Link block */}
              {block.type === 'link' && (
                <div className="space-y-4">
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">title</span>
                    <input
                      placeholder="Judul Tautan / Sumber (misal: Dokumentasi Resmi)..."
                      value={block.title || ''}
                      onChange={(e) => {
                        setBlocks((prev) =>
                          prev.map((b, index) =>
                            index === i ? { ...b, title: e.target.value } : b
                          )
                        );
                      }}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">link</span>
                    <input
                      placeholder="https://example.com/sumber-data"
                      value={block.url || ''}
                      onChange={(e) => {
                        setBlocks((prev) =>
                          prev.map((b, index) =>
                            index === i ? { ...b, url: e.target.value } : b
                          )
                        );
                      }}
                      className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary focus:outline-none focus:border-secondary transition-colors"
                    />
                  </div>
                  <textarea
                    placeholder="Keterangan singkat tentang sumber ini (Opsional)..."
                    value={block.caption || ''}
                    onChange={(e) => {
                      setBlocks((prev) =>
                        prev.map((b, index) =>
                          index === i ? { ...b, caption: e.target.value } : b
                        )
                      );
                    }}
                    rows={2}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* ── Add-block toolbar — fixed at bottom center (desktop) ── */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/20 shadow-2xl rounded-full px-5 py-3">
        <span className="text-[10px] font-label font-bold text-on-surface-variant/60 uppercase tracking-widest mr-2">
          + Tambah
        </span>
        {[
          { type: 'text' as const, icon: 'notes', label: 'Teks' },
          { type: 'image' as const, icon: 'image', label: 'Gambar' },
          { type: 'video' as const, icon: 'smart_display', label: 'Video' },
          { type: 'pdf' as const, icon: 'picture_as_pdf', label: 'PDF' },
          { type: 'link' as const, icon: 'link', label: 'Link' },
        ].map((item, idx, arr) => (
          <div key={item.type} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addBlock(item.type)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary px-3 py-1.5 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              {item.label}
            </button>
            {idx < arr.length - 1 && <div className="w-px h-5 bg-outline-variant/40" />}
          </div>
        ))}
      </div>

      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-8 right-6 z-30 flex flex-col items-end gap-3">
        {isAddMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={() => setIsAddMenuOpen(false)} />
            <div className="absolute bottom-20 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-3xl p-3 flex flex-col gap-1 min-w-[200px]">
              {[
                { type: 'text' as const, icon: 'notes', label: 'Teks Baru' },
                { type: 'image' as const, icon: 'image', label: 'Gambar' },
                { type: 'video' as const, icon: 'smart_display', label: 'Video YouTube' },
                { type: 'pdf' as const, icon: 'picture_as_pdf', label: 'Dokumen PDF' },
                { type: 'link' as const, icon: 'link', label: 'Tautan Sumber' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => { addBlock(item.type); setIsAddMenuOpen(false); }}
                  className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl hover:bg-secondary/10 text-primary hover:text-secondary transition-all group"
                >
                  <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  </div>
                  <span className="font-headline font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button
          type="button"
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className={`z-50 w-14 h-14 rounded-full backdrop-blur-xl border-2 shadow-2xl flex items-center justify-center transition-all duration-300 ${isAddMenuOpen
            ? 'rotate-45 bg-error/10 border-error/40 text-error'
            : 'bg-secondary/10 border-secondary/40 text-secondary'
            }`}
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      {/* ════════════════════════════════════════
          Floating Island Sidebar — fixed, follows scroll
          ════════════════════════════════════════ */}
      <div className="hidden lg:block fixed top-[88px] right-4 xl:right-6 z-20 w-72 xl:w-80">
        <div className="bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/15 shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-5 flex flex-col gap-4">

            {/* Header: back button + title */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container border border-outline-variant/20 text-secondary hover:bg-surface-container-high transition-colors shrink-0"
                title="Kembali ke Dashboard"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div className="min-w-0">
                <p className="font-label text-[9px] font-bold tracking-[0.2em] text-secondary uppercase">
                  {initialData?.id ? 'Edit Postingan' : 'Postingan Baru'}
                </p>
                <h2 className="text-sm font-headline font-bold text-primary truncate">
                  {title || 'Tanpa Judul'}
                </h2>
              </div>
            </div>

            <div className="border-t border-outline-variant/15" />

            {/* Title */}
            <div>
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-1.5 block">
                Judul
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tulis judul…"
                className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-xl px-3.5 py-2.5 text-primary font-headline font-bold text-sm focus:outline-none focus:border-secondary/50 transition-all placeholder:text-on-surface-variant/30"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-1.5 block">
                Kategori
              </label>
              <div className="relative">
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-xl px-3.5 py-2.5 text-primary text-sm font-medium focus:outline-none focus:border-secondary/50 transition-all appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-[18px]">
                  expand_more
                </span>
              </div>
            </div>

            {/* Thumbnail */}
            <div>
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">
                Thumbnail
              </label>
              <div className="flex gap-3 items-start">
                <div
                  className={`shrink-0 w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${previews.thumbnail || thumbnail
                    ? 'border-secondary/30 bg-surface-container-low'
                    : 'border-outline-variant/20 bg-surface-container/50'
                    }`}
                >
                  {previews.thumbnail || thumbnail ? (
                    <img src={previews.thumbnail || thumbnail} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-secondary/30 text-xl">add_photo_alternate</span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2.5 pl-2 pr-8">
                  <button
                    type="button"
                    onClick={handleThumbnailClick}
                    disabled={saveStatus !== 'Idle'}
                    className="w-fit min-w-[180px] h-12 px-8 rounded-2xl bg-secondary text-on-secondary text-[10px] font-extrabold transition-all hover:bg-primary shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {saveStatus === 'Uploading' ? 'sync' : 'add_a_photo'}
                    </span>
                    {saveStatus === 'Uploading' ? 'UPLOADING...' : (previews.thumbnail || thumbnail ? 'GANTI GAMBAR' : 'PILIH GAMBAR')}
                  </button>
                  {(previews.thumbnail || thumbnail) && saveStatus === 'Idle' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Hapus thumbnail?')) {
                          if (stagedFiles.thumbnail) {
                            const newStaged = { ...stagedFiles };
                            delete newStaged.thumbnail;
                            setStagedFiles(newStaged);
                          }
                          if (previews.thumbnail) {
                            URL.revokeObjectURL(previews.thumbnail);
                            const newPreviews = { ...previews };
                            delete newPreviews.thumbnail;
                            setPreviews(newPreviews);
                          }
                          setThumbnail('');
                        }
                      }}
                      className="w-fit min-w-[180px] h-11 px-8 rounded-2xl bg-error/10 hover:bg-error/20 text-error text-[10px] font-extrabold transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      HAPUS
                    </button>
                  )}
                  <p className="text-[9px] text-on-surface-variant/40 leading-tight pt-1">Rasio 1:1 disarankan.</p>
                </div>
              </div>
            </div>

            {/* Stats + status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-secondary/60">layers</span>
                <span className="text-[11px] font-bold text-primary/70">{blocks.length} Balok</span>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${initialData?.status === 'Published'
                ? 'bg-secondary/5 border-secondary/20 text-secondary'
                : 'bg-on-surface-variant/5 border-outline-variant/20 text-on-surface-variant/60'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${initialData?.status === 'Published' ? 'bg-secondary' : 'bg-on-surface-variant/40'}`} />
                {initialData?.status || 'Draft'}
              </div>
            </div>

            <div className="border-t border-outline-variant/15" />

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5">
              {initialData?.id ? (
                // EDIT MODE
                <>
                  <button
                    onClick={() => handleSave(initialData?.status || 'Published')}
                    disabled={isPending}
                    className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-secondary text-on-secondary hover:bg-primary transition-all shadow-md disabled:opacity-50 cursor-pointer ${isDirty ? 'pulse-green' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    <span className="text-[11px] font-bold uppercase tracking-widest">
                      {isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isPending}
                      className="flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-error/5 hover:bg-error/10 text-error transition-all border border-error/10 disabled:opacity-50 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider">Hapus</span>
                    </button>

                    {initialData?.status === 'Published' ? (
                      <button
                        onClick={() => handleSave('Draft')}
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/15 disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">drafts</span>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider text-center">Jadikan Draft</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSave('Published')}
                        disabled={isSavingInProgress}
                        className="flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/15 disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">publish</span>
                        <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Terbitkan</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                // CREATE MODE (Draft / Publish)
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleSave('Draft')}
                    disabled={isSavingInProgress}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/20 disabled:opacity-50 cursor-pointer ${isDirty ? 'pulse-green' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[22px] text-on-surface-variant">save</span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {isSavingInProgress ? '…' : 'Draft'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleSave('Published')}
                    disabled={isSavingInProgress}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl bg-secondary text-on-secondary hover:bg-primary transition-all shadow-md disabled:opacity-50 cursor-pointer ${isDirty ? 'pulse-green' : ''}`}
                  >
                    <span className="material-symbols-outlined text-[22px]">publish</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isSavingInProgress ? '…' : 'Publish'}
                    </span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isSavingInProgress && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 p-6 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-error/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">delete_forever</span>
              </div>
              <h3 className="text-lg font-headline font-bold text-primary mb-2">Hapus Postingan?</h3>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-6">
                Tindakan ini tidak dapat dibatalkan. Semua data postingan dan file terkait akan dihapus secara permanen.
              </p>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="w-full h-12 rounded-2xl bg-error text-white font-bold text-sm shadow-lg hover:bg-error/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      HAPUS SEKARANG
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending}
                  className="w-full h-11 rounded-2xl bg-surface-container text-primary font-bold text-[13px] hover:bg-surface-container-high transition-all"
                >
                  BATALKAN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {showUnsavedConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isPending && setShowUnsavedConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 p-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              <h3 className="text-lg font-headline font-bold text-primary mb-2">Simpan Perubahan?</h3>
              <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-6">
                Ada perubahan yang belum tersimpan. Apakah Anda ingin menyimpannya sekarang?
              </p>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => handleSave(initialData?.id ? (initialData.status || 'Published') : 'Draft')}
                  disabled={isPending}
                  className="w-full h-12 rounded-2xl bg-secondary text-white font-bold text-sm shadow-lg hover:bg-primary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">save</span>
                      {initialData?.id ? 'SIMPAN PERUBAHAN' : 'SIMPAN SEBAGAI DRAFT'}
                    </>
                  )}
                </button>
                <div className="grid grid-cols-2 gap-2 w-full mt-1">
                  <button
                    onClick={() => {
                      setShowUnsavedConfirm(false);
                      router.push(pendingPath || '/admin');
                    }}
                    disabled={isPending}
                    className="h-11 rounded-2xl bg-surface-container-low text-on-surface-variant font-bold text-[11px] hover:bg-surface-container transition-all"
                  >
                    KELUAR SAJA
                  </button>
                  <button
                    onClick={() => setShowUnsavedConfirm(false)}
                    disabled={isPending}
                    className="h-11 rounded-2xl bg-surface-container text-primary font-bold text-[11px] hover:bg-surface-container-high transition-all"
                  >
                    LANJUT EDIT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Loading Overlay */}
      <AnimatePresence>
        {saveStatus !== 'Idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md"
          >
            <div className="bg-surface-container-lowest border border-outline-variant/20 shadow-2xl rounded-3xl p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
                {saveStatus === 'Success' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest rounded-full"
                  >
                    <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
                  </motion.div>
                )}
                {saveStatus === 'Error' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest rounded-full"
                  >
                    <span className="material-symbols-outlined text-4xl text-error">error</span>
                  </motion.div>
                )}
              </div>

              <h3 className="text-xl font-headline font-bold text-primary mb-2">
                {saveStatus === 'Uploading' && 'Mengunggah File...'}
                {saveStatus === 'Saving' && 'Menyimpan Postingan...'}
                {saveStatus === 'Success' && 'Berhasil Disimpan!'}
                {saveStatus === 'Error' && 'Gagal Menyimpan'}
              </h3>

              <p className="text-sm text-on-surface-variant/70 leading-relaxed">
                {saveStatus === 'Uploading' && 'Mohon tunggu sebentar, file sedang diunggah ke storage.'}
                {saveStatus === 'Saving' && 'Sedang mendaftarkan postingan Anda ke database.'}
                {saveStatus === 'Success' && 'Halaman akan segera dialihkan ke Dashboard.'}
                {saveStatus === 'Error' && 'Terjadi kesalahan saat proses penyimpanan. Silakan coba lagi.'}
              </p>

              {saveStatus === 'Error' && (
                <button
                  onClick={() => setSaveStatus('Idle')}
                  className="mt-6 px-6 py-2 rounded-full bg-surface-container text-primary font-bold text-sm hover:bg-surface-container-high transition-all"
                >
                  TUTUP
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
