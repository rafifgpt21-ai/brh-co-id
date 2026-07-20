'use client';

import { memo, useEffect, useRef, useState, type DragEvent } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { formatFileSize, type ImageCompressionResult } from '@/lib/image-compression';

const TiptapEditor = dynamic(() => import('./TiptapEditor').then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse bg-surface-container-low rounded-xl border border-outline-variant/20 mt-2" />
});

const AutoResizingTextarea = ({ 
  value, 
  onChange, 
  placeholder, 
  className,
  rows = 1 
}: { 
  value: string, 
  onChange: (val: string) => void, 
  placeholder: string, 
  className: string,
  rows?: number
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${className} overflow-hidden resize-none`}
      rows={rows}
    />
  );
};

type Block = {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'link' | 'contact';
  content: string;
  contentEn?: string;
  url?: string;
  title?: string;
  titleEn?: string;
  caption?: string;
  captionEn?: string;
  isLocked?: boolean;
};

interface BlockItemProps {
  block: Block;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isDeleting: boolean;
  preview?: string;
  stagedFile?: File;
  compressionInfo?: ImageCompressionResult;
  isCompressing?: boolean;
  onUpdate: (id: string, data: Partial<Block>) => void;
  onRemove: (id: string) => void;
  onConfirmRemove: (id: string) => void;
  onCancelDelete: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onFileSelect: (id: string) => void;
  onFileDrop: (id: string, file: File) => void;
  saveStatus: string;
  contacts?: { id: string, name: string | null, phone: string | null }[];
}

export const BlockItem = memo(function BlockItem({
  block,
  index,
  isFirst,
  isLast,
  isDeleting,
  preview,
  stagedFile,
  compressionInfo,
  isCompressing = false,
  onUpdate,
  onRemove,
  onConfirmRemove,
  onCancelDelete,
  onMove,
  onFileSelect,
  onFileDrop,
  contacts = []
}: BlockItemProps) {
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepthRef = useRef(0);

  const handleImageDragEnter = (event: DragEvent<HTMLDivElement>) => {
    if (block.type !== 'image' || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFile(true);
  };

  const handleImageDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (block.type !== 'image' || !event.dataTransfer.types.includes('Files')) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleImageDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (block.type !== 'image') return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFile(false);
  };

  const handleImageDrop = (event: DragEvent<HTMLDivElement>) => {
    if (block.type !== 'image') return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingFile(false);

    const file = event.dataTransfer.files[0];
    if (file) onFileDrop(block.id, file);
  };

  const getEmbedUrl = (url?: string | null) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  };

  // Color accents for left border based on block type
  const getBorderAccent = () => {
    switch (block.type) {
      case 'text': return 'border-l-4 border-slate-400 focus-within:border-l-secondary';
      case 'image': return 'border-l-4 border-emerald-500';
      case 'video': return 'border-l-4 border-rose-500';
      case 'pdf': return 'border-l-4 border-primary';
      case 'link': return 'border-l-4 border-amber-500';
      case 'contact': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-outline-variant';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`group relative bg-surface-container-lowest/90 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xs border border-outline-variant/15 hover:border-outline-variant/30 hover:shadow-md transition-all ${getBorderAccent()}`}
    >
      {/* Block control row */}
      <div className="flex items-center justify-between mb-4 select-none">
        <span className="text-xs font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">
            {block.type === 'text' && 'notes'}
            {block.type === 'image' && 'image'}
            {block.type === 'video' && 'smart_display'}
            {block.type === 'pdf' && 'picture_as_pdf'}
            {block.type === 'link' && 'link'}
            {block.type === 'contact' && 'chat'}
          </span>
          Balok {block.type === 'link' ? 'Tautan / Sumber' : block.type === 'contact' ? 'WhatsApp' : block.type}
        </span>

        {/* Action pills (Touch-friendly size) */}
        <div className="flex items-center gap-1.5 bg-surface-container-low/60 border border-outline-variant/20 shadow-xs rounded-full px-1.5 py-1 z-10">
          <button
            type="button"
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30 active:scale-90"
            title="Naik"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30 active:scale-90"
            title="Turun"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
          <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />

          {isDeleting ? (
            <div className="flex items-center gap-1.5 px-1 animate-in slide-in-from-right-2 duration-200">
              <button
                type="button"
                onClick={() => onConfirmRemove(block.id)}
                className="h-8 sm:h-7 px-3 rounded-full bg-error text-on-error text-[9px] font-black uppercase tracking-wider hover:bg-error/95 transition-colors shadow-xs active:scale-95"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="h-8 sm:h-7 px-3 rounded-full bg-surface-container-high text-on-surface-variant text-[9px] font-black uppercase tracking-wider hover:bg-surface-container-highest transition-colors active:scale-95"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(block.id)}
              className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors active:scale-90"
              title="Hapus"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Text block */}
      {block.type === 'text' && (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-secondary/70">
              Konten Indonesia
            </label>
            <TiptapEditor
              content={block.content}
              onChange={(html) => onUpdate(block.id, { content: html })}
            />
          </div>
          <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-widest text-secondary/70">
              English Content
            </label>
            <TiptapEditor
              content={block.contentEn || ''}
              onChange={(html) => onUpdate(block.id, { contentEn: html })}
            />
          </div>
        </div>
      )}

      {/* Image / PDF block */}
      {(block.type === 'image' || block.type === 'pdf') && (
        <div className="space-y-4">
          <AutoResizingTextarea
            placeholder="Judul Konten Indonesia (Opsional)..."
            value={block.title || ''}
            onChange={(val) => onUpdate(block.id, { title: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
          />
          <AutoResizingTextarea
            placeholder="English Content Title (Optional)..."
            value={block.titleEn || ''}
            onChange={(val) => onUpdate(block.id, { titleEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
          />

          <div
            onDragEnter={handleImageDragEnter}
            onDragOver={handleImageDragOver}
            onDragLeave={handleImageDragLeave}
            onDrop={handleImageDrop}
            className={`relative rounded-2xl transition-all ${
              block.type === 'image' && isDraggingFile
                ? 'ring-2 ring-secondary ring-offset-2 ring-offset-surface-container-lowest'
                : ''
            }`}
          >
          {isCompressing ? (
            <div className="rounded-2xl border-2 border-dashed border-secondary/30 bg-secondary/5 p-10 text-center">
              <span className="material-symbols-outlined animate-spin text-3xl text-secondary">progress_activity</span>
              <p className="mt-3 text-xs font-bold text-secondary">Mengompresi gambar...</p>
            </div>
          ) : block.url || preview ? (
            <div className="relative group/media rounded-2xl overflow-hidden border border-outline-variant/20 shadow-xs bg-surface-container-low">
              {block.type === 'image' ? (
                <div className="relative aspect-video flex items-center justify-center bg-surface-container-low/50">
                  <img src={preview || block.url} alt={block.title || 'Upload'} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-4xl">picture_as_pdf</span>
                  </div>
                  <p className="text-sm font-bold text-primary truncate max-w-[250px] px-4">
                    {stagedFile ? stagedFile.name : (block.url ? 'PDF Terlampir' : 'PDF Terpilih')}
                  </p>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 to-transparent flex items-center justify-between opacity-100 sm:opacity-0 sm:translate-y-2 sm:group-hover/media:translate-y-0 sm:group-hover/media:opacity-100 transition-all">
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {stagedFile ? 'Staged' : 'Ready'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onFileSelect(block.id)}
                    className="px-3.5 py-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold transition-colors active:scale-95"
                  >
                    Ganti File
                  </button>
                </div>
              </div>
              {compressionInfo && (
                <p className="px-4 py-2 text-[10px] font-bold text-on-surface-variant/70">
                  {formatFileSize(compressionInfo.originalBytes)} → {formatFileSize(compressionInfo.finalBytes)}
                  {compressionInfo.savedPercent > 0 ? ` · hemat ${compressionInfo.savedPercent}%` : ' · sudah optimal'}
                </p>
              )}
            </div>
          ) : (
            <div className={`border-2 border-dashed bg-primary-container/5 transition-colors rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center ${
              block.type === 'image' && isDraggingFile
                ? 'border-secondary bg-secondary/10'
                : 'border-outline-variant/40 hover:bg-primary-container/10'
            }`}>
              <div className="w-14 h-14 bg-surface-container-lowest shadow-xs rounded-full flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  {block.type === 'pdf' ? 'description' : isDraggingFile ? 'download' : 'add_photo_alternate'}
                </span>
              </div>
              <p className="text-primary font-headline font-bold mb-1">
                {block.type === 'image'
                  ? isDraggingFile ? 'Lepaskan gambar di sini' : 'Tarik & jatuhkan gambar di sini'
                  : 'Unggah Dokumen PDF'}
              </p>
              <p className="text-on-surface-variant/70 text-xs mb-4">
                {block.type === 'image' ? 'atau pilih file · sumber maks. 20MB, hasil 1MB' : 'Maks: 16MB'}
              </p>
              <button
                type="button"
                onClick={() => onFileSelect(block.id)}
                className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-headline font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                Pilih File
              </button>
            </div>
          )}

          {block.type === 'image' && isDraggingFile && (block.url || preview) && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-secondary/90 text-on-secondary backdrop-blur-sm">
              <span className="material-symbols-outlined text-4xl">download</span>
              <p className="mt-2 font-headline text-sm font-bold">Lepaskan untuk mengganti gambar</p>
            </div>
          )}
          </div>

          <AutoResizingTextarea
            placeholder="Keterangan atau Sumber Indonesia (Opsional)..."
            value={block.caption || ''}
            onChange={(val) => onUpdate(block.id, { caption: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
          <AutoResizingTextarea
            placeholder="English Caption or Source (Optional)..."
            value={block.captionEn || ''}
            onChange={(val) => onUpdate(block.id, { captionEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
        </div>
      )}

      {/* Video block */}
      {block.type === 'video' && (
        <div className="space-y-4">
          <AutoResizingTextarea
            placeholder="Judul Video Indonesia (Opsional)..."
            value={block.title || ''}
            onChange={(val) => onUpdate(block.id, { title: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
          />
          <AutoResizingTextarea
            placeholder="English Video Title (Optional)..."
            value={block.titleEn || ''}
            onChange={(val) => onUpdate(block.id, { titleEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
          />
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">link</span>
            <AutoResizingTextarea
              placeholder="Masukkan URL YouTube..."
              value={block.url || ''}
              onChange={(val) => onUpdate(block.id, { url: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/40 rounded-xl py-3.5 pl-12 pr-4 text-primary text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          
          {/* Real-time YouTube Embed Preview */}
          {block.url && getEmbedUrl(block.url) && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-outline-variant/15 bg-black mt-2 shadow-inner">
              <iframe
                src={getEmbedUrl(block.url)}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}
          
          <AutoResizingTextarea
            placeholder="Keterangan Video Indonesia (Opsional)..."
            value={block.caption || ''}
            onChange={(val) => onUpdate(block.id, { caption: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
          <AutoResizingTextarea
            placeholder="English Video Caption (Optional)..."
            value={block.captionEn || ''}
            onChange={(val) => onUpdate(block.id, { captionEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
        </div>
      )}

      {/* Link block */}
      {block.type === 'link' && (
        <div className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">title</span>
            <AutoResizingTextarea
              placeholder="Judul Tautan / Sumber (misal: Dokumentasi Resmi)..."
              value={block.title || ''}
              onChange={(val) => onUpdate(block.id, { title: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">title</span>
            <AutoResizingTextarea
              placeholder="English Link / Source Title..."
              value={block.titleEn || ''}
              onChange={(val) => onUpdate(block.id, { titleEn: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">link</span>
            <AutoResizingTextarea
              placeholder="https://example.com/sumber-data"
              value={block.url || ''}
              onChange={(val) => onUpdate(block.id, { url: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <AutoResizingTextarea
            placeholder="Keterangan singkat tentang sumber ini (Opsional)..."
            value={block.caption || ''}
            onChange={(val) => onUpdate(block.id, { caption: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
          <AutoResizingTextarea
            placeholder="English source note (Optional)..."
            value={block.captionEn || ''}
            onChange={(val) => onUpdate(block.id, { captionEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
        </div>
      )}

      {/* Contact block */}
      {block.type === 'contact' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
              Pilih Kontak WhatsApp
            </label>
            <div className="relative">
              <select
                value={
                  contacts.some(c => c.phone === block.content)
                    ? block.content
                    : block.content === ''
                      ? ''
                      : 'custom'
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    onUpdate(block.id, { content: '' });
                  } else {
                    onUpdate(block.id, { content: val });
                  }
                }}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-primary text-sm focus:outline-none focus:border-secondary transition-colors appearance-none cursor-pointer"
              >
                <option value="">-- Pilih Kontak --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.phone || ''}>
                    {c.name || 'Admin'} ({c.phone})
                  </option>
                ))}
                <option value="custom">Kustom (Masukkan Manual)</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/40 text-[18px]">
                expand_more
              </span>
            </div>
          </div>

          {/* If custom or no contact is selected (or manual is clicked) */}
          {(block.content === '' || !contacts.some(c => c.phone === block.content)) && (
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">phone</span>
              <AutoResizingTextarea
                placeholder="Masukkan nomor HP/WhatsApp manual (misal: 6281234567890)..."
                value={block.content || ''}
                onChange={(val) => onUpdate(block.id, { content: val.replace(/\D/g, '') })}
                className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          )}

          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">title</span>
            <AutoResizingTextarea
              placeholder="Label Tombol (misal: Hubungi via WhatsApp)..."
              value={block.title || ''}
              onChange={(val) => onUpdate(block.id, { title: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">title</span>
            <AutoResizingTextarea
              placeholder="English Button Label (for example: Contact via WhatsApp)..."
              value={block.titleEn || ''}
              onChange={(val) => onUpdate(block.id, { titleEn: val })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold text-sm sm:text-base focus:outline-none focus:border-secondary transition-colors"
            />
          </div>

          <AutoResizingTextarea
            placeholder="Pesan Preset WhatsApp (Opsional, teks ini akan terisi otomatis saat diklik)..."
            value={block.caption || ''}
            onChange={(val) => onUpdate(block.id, { caption: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
          <AutoResizingTextarea
            placeholder="English WhatsApp preset message (Optional)..."
            value={block.captionEn || ''}
            onChange={(val) => onUpdate(block.id, { captionEn: val })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2.5 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
        </div>
      )}
    </motion.div>
  );
}, (prev, next) => {
  // Memoization comparison
  return (
    prev.block.id === next.block.id &&
    prev.block.content === next.block.content &&
    prev.block.contentEn === next.block.contentEn &&
    prev.block.url === next.block.url &&
    prev.block.title === next.block.title &&
    prev.block.titleEn === next.block.titleEn &&
    prev.block.caption === next.block.caption &&
    prev.block.captionEn === next.block.captionEn &&
    prev.isDeleting === next.isDeleting &&
    prev.preview === next.preview &&
    prev.stagedFile === next.stagedFile &&
    prev.compressionInfo === next.compressionInfo &&
    prev.isCompressing === next.isCompressing &&
    prev.isFirst === next.isFirst &&
    prev.isLast === next.isLast &&
    prev.saveStatus === next.saveStatus &&
    JSON.stringify(prev.contacts) === JSON.stringify(next.contacts)
  );
});
