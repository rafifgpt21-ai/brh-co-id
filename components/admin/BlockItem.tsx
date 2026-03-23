'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('./TiptapEditor').then(mod => mod.TiptapEditor), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full animate-pulse bg-surface-container-low rounded-xl border border-outline-variant/20 mt-2" />
});

type Block = {
  id: string;
  type: 'text' | 'image' | 'video' | 'pdf' | 'link';
  content: string;
  url?: string;
  title?: string;
  caption?: string;
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
  onUpdate: (id: string, data: Partial<Block>) => void;
  onRemove: (id: string) => void;
  onCancelDelete: () => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onFileSelect: (id: string) => void;
  saveStatus: string;
}

export const BlockItem = memo(({
  block,
  index,
  isFirst,
  isLast,
  isDeleting,
  preview,
  stagedFile,
  onUpdate,
  onRemove,
  onCancelDelete,
  onMove,
  onFileSelect,
  saveStatus
}: BlockItemProps) => {
  return (
    <div className="group relative bg-surface-container-lowest/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-outline-variant/15 hover:border-outline-variant/30 hover:shadow-md transition-all">
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
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30"
            title="Naik"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors disabled:opacity-30"
            title="Turun"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
          <div className="w-px h-4 bg-outline-variant/30 mx-0.5" />

          {isDeleting ? (
            <div className="flex items-center gap-1.5 px-1 animate-in slide-in-from-right-2 duration-200">
              <button
                type="button"
                onClick={() => onRemove(block.id)}
                className="h-7 px-3 rounded-full bg-error text-on-error text-[9px] font-black uppercase tracking-wider hover:bg-error-container hover:text-on-error-container transition-colors shadow-sm"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="h-7 px-3 rounded-full bg-surface-container-high text-on-surface-variant text-[9px] font-black uppercase tracking-wider hover:bg-surface-container-highest transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onRemove(block.id)}
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
          onChange={(html) => onUpdate(block.id, { content: html })}
        />
      )}

      {/* Image / PDF block */}
      {(block.type === 'image' || block.type === 'pdf') && (
        <div className="space-y-4">
          <input
            placeholder="Judul Konten (Opsional)..."
            value={block.title || ''}
            onChange={(e) => onUpdate(block.id, { title: e.target.value })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
          />

          {block.url || preview ? (
            <div className="relative group/media rounded-2xl overflow-hidden border border-outline-variant/20 shadow-sm bg-surface-container-low">
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

              <div className="absolute inset-x-0 bottom-0 p-4 bg-linear-to-t from-black/80 to-transparent flex items-center justify-between translate-y-2 opacity-0 group-hover/media:translate-y-0 group-hover/media:opacity-100 transition-all">
                <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  {stagedFile ? 'Staged' : 'Ready'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onFileSelect(block.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold transition-colors"
                  >
                    Ganti File
                  </button>
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
                onClick={() => onFileSelect(block.id)}
                className="px-6 py-2.5 rounded-full bg-secondary text-on-secondary font-headline font-bold text-xs hover:scale-105 transition-transform shadow-md"
              >
                Pilih File
              </button>
            </div>
          )}

          <textarea
            placeholder="Keterangan atau Sumber (Opsional)..."
            value={block.caption || ''}
            onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
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
            onChange={(e) => onUpdate(block.id, { title: e.target.value })}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
          />
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">link</span>
            <input
              placeholder="Masukkan URL YouTube..."
              value={block.url || ''}
              onChange={(e) => onUpdate(block.id, { url: e.target.value })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/50 rounded-xl py-3.5 pl-12 pr-4 text-primary focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <textarea
            placeholder="Keterangan Video (Opsional)..."
            value={block.caption || ''}
            onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
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
              onChange={(e) => onUpdate(block.id, { title: e.target.value })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary font-headline font-bold focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[20px]">link</span>
            <input
              placeholder="https://example.com/sumber-data"
              value={block.url || ''}
              onChange={(e) => onUpdate(block.id, { url: e.target.value })}
              className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-3 pl-12 pr-4 text-primary focus:outline-none focus:border-secondary transition-colors"
            />
          </div>
          <textarea
            placeholder="Keterangan singkat tentang sumber ini (Opsional)..."
            value={block.caption || ''}
            onChange={(e) => onUpdate(block.id, { caption: e.target.value })}
            rows={2}
            className="w-full bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl py-2 px-4 text-on-surface-variant text-sm focus:outline-none focus:border-secondary transition-colors resize-none"
          />
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Memoization comparison
  return (
    prev.block.id === next.block.id &&
    prev.block.content === next.block.content &&
    prev.block.url === next.block.url &&
    prev.block.title === next.block.title &&
    prev.block.caption === next.block.caption &&
    prev.isDeleting === next.isDeleting &&
    prev.preview === next.preview &&
    prev.stagedFile === next.stagedFile &&
    prev.isFirst === next.isFirst &&
    prev.isLast === next.isLast &&
    prev.saveStatus === next.saveStatus
  );
});
