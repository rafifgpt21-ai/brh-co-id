'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { TiptapEditor } from './TiptapEditor';

type Block = { id: string; type: 'text' | 'image' | 'video' | 'pdf'; content: string; url?: string };

export const PostEditor = ({ initialData }: { initialData?: any }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState(initialData?.category || 'Buku');
  const [blocks, setBlocks] = useState<Block[]>(initialData?.blocks || []);

  const addBlock = (type: Block['type']) => {
    setBlocks([...blocks, { id: Date.now().toString(), type, content: '' }]);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === blocks.length - 1) return;
    
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    if(confirm('Hapus balok ini?')) {
      const newBlocks = [...blocks];
      newBlocks.splice(index, 1);
      setBlocks(newBlocks);
    }
  };

  const handleSave = async (status: 'publish' | 'draft' = 'publish') => {
    // API call simulation
    alert(`Disimpan sebagai ${status === 'publish' ? 'Publikasi' : 'Draft'} (Simulasi)!`);
  };

  return (
    <div className="relative min-h-screen pb-40 px-4 md:px-8 pt-6">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 opacity-30 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary-fixed blur-[120px] rounded-full"></div>
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/admin" className="group flex items-center justify-center w-12 h-12 rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/15 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-secondary group-hover:-translate-x-1 transition-transform">arrow_back</span>
          </Link>
          <div className="flex flex-col">
             <span className="font-label text-xs font-bold tracking-widest text-secondary uppercase mb-1">Editor Baru</span>
             <h1 className="text-4xl font-headline font-bold text-primary leading-tight">Postingan</h1>
          </div>
        </div>
        
        {/* Informasi Utama Pane */}
        <div className="bg-surface-container-lowest/80 glass-effect p-8 rounded-3xl shadow-sm border border-outline-variant/15 mb-10">
          <h2 className="text-lg font-headline font-bold mb-8 text-primary flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">feed</span>
            Informasi Utama
          </h2>
          <div className="space-y-8">
            <div className="relative mt-2">
              <input 
                id="title"
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder=" "
                className="peer w-full bg-transparent border-b-2 border-outline-variant/30 py-2 text-2xl font-headline text-primary focus:outline-none focus:border-secondary transition-colors" 
              />
              <label 
                htmlFor="title"
                className="absolute left-0 top-2 text-on-surface-variant text-xl transition-all duration-300 transform -translate-y-8 scale-75 origin-left peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-8 peer-focus:text-secondary cursor-text pointer-events-none"
              >
                Judul Postingan
              </label>
            </div>
            
            <div className="relative pt-4">
              <select 
                id="category"
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full bg-transparent border-b-2 border-outline-variant/30 py-2 text-lg font-body text-primary focus:outline-none focus:border-secondary transition-colors appearance-none cursor-pointer"
              >
                <option value="Buku">Buku</option>
                <option value="Jurnal">Jurnal</option>
                <option value="Artikel">Artikel</option>
                <option value="Opini">Opini</option>
              </select>
              <label 
                htmlFor="category"
                className="absolute left-0 -top-2 text-secondary text-xs uppercase font-label tracking-widest font-bold transition-all pointer-events-none"
              >
                Kategori
              </label>
              <span className="material-symbols-outlined absolute right-2 top-3 pointer-events-none text-on-surface-variant">expand_more</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-outline-variant/20">
              <button 
                onClick={() => handleSave('draft')}
                className="w-full sm:w-auto bg-surface-container text-on-surface hover:bg-surface-container-high px-8 py-3.5 rounded-full font-headline font-bold transition-all shadow-sm flex items-center justify-center gap-2 border border-outline-variant/30"
              >
                <span className="material-symbols-outlined text-[20px]">save</span>
                Simpan Draft
              </button>
              <button 
                onClick={() => handleSave('publish')}
                className="w-full sm:w-auto bg-secondary text-on-secondary px-8 py-3.5 rounded-full font-headline font-bold hover:bg-primary transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">publish</span>
                Publikasikan Postingan
              </button>
            </div>
          </div>
        </div>

        {/* Blocks Render */}
        <div className="space-y-8">
          {blocks.map((block, i) => (
            <div key={block.id} className="group relative bg-surface-container-lowest/90 glass-effect rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant/15 transition-all hover:shadow-md">
              {/* Floating Action Menu */}
              <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-surface-container-lowest shadow-md rounded-full border border-outline-variant/30 p-1 z-10 transition-all duration-300">
                <button onClick={() => moveBlock(i, 'up')} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors" title="Naik">
                  <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
                </button>
                <button onClick={() => moveBlock(i, 'down')} className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:text-secondary hover:bg-surface-container-low transition-colors" title="Turun">
                  <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
                </button>
                <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                <button onClick={() => removeBlock(i)} className="w-8 h-8 flex items-center justify-center rounded-full text-error hover:bg-error/10 hover:text-error transition-colors" title="Hapus">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>

              <div className="mb-4 text-xs font-bold text-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">
                  {block.type === 'text' && 'notes'}
                  {block.type === 'image' && 'image'}
                  {block.type === 'video' && 'smart_display'}
                  {block.type === 'pdf' && 'picture_as_pdf'}
                </span>
                Balok {block.type}
              </div>
              
              {block.type === 'text' && (
                <div className="mt-2">
                  <TiptapEditor 
                    content={block.content} 
                    onChange={(html) => {
                      const newBlocks = [...blocks];
                      newBlocks[i].content = html;
                      setBlocks(newBlocks);
                    }} 
                  />
                </div>
              )}
              
              {(block.type === 'image' || block.type === 'pdf') && (
                <div className="border-2 border-dashed border-outline-variant/40 bg-primary-container/20 hover:bg-primary-container/40 transition-colors cursor-pointer rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-surface-container-lowest shadow-sm rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-secondary">
                        {block.type === 'pdf' ? 'description' : 'add_photo_alternate'}
                    </span>
                  </div>
                  <p className="text-primary font-headline font-bold text-xl mb-2">
                    Unggah {block.type === 'image' ? 'Gambar' : 'Dokumen PDF'}
                  </p>
                  <p className="text-on-surface-variant text-sm mb-6 max-w-sm">
                    Jelajahi file atau seret ke area ini untuk mengunggah otomatis ke cloud.
                  </p>
                  <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-headline font-semibold text-sm hover:scale-105 transition-transform shadow-sm">
                    Pilih File
                  </button>
                </div>
              )}
              
              {block.type === 'video' && (
                <div className="relative mt-2">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">link</span>
                  <input 
                    placeholder="Masukkan URL YouTube..." 
                    value={block.url || ''}
                    onChange={(e) => {
                      const newBlocks = [...blocks];
                      newBlocks[i].url = e.target.value;
                      setBlocks(newBlocks);
                    }}
                    className="w-full bg-surface-container-lowest/50 border border-outline-variant/50 rounded-xl py-4 pl-12 pr-4 text-primary focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Floating Add Toolbar */}
        <div className="mt-12 flex justify-center sticky bottom-[120px] md:bottom-[100px] z-40">
          <div className="bg-surface-container-lowest/95 glass-effect border border-outline-variant/30 shadow-lg shadow-primary-container/20 rounded-full px-6 py-4 flex items-center gap-3 hover:shadow-xl transition-shadow w-max">
            <span className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest mr-3 hidden md:block">Tertambat:</span>
            <button onClick={() => addBlock('text')} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary px-3 py-2 rounded-full hover:bg-surface-container-low transition-colors text-nowrap">
              <span className="material-symbols-outlined text-[18px]">notes</span> Teks
            </button>
            <div className="w-px h-6 bg-outline-variant/40"></div>
            <button onClick={() => addBlock('image')} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary px-3 py-2 rounded-full hover:bg-surface-container-low transition-colors text-nowrap">
              <span className="material-symbols-outlined text-[18px]">image</span> Gambar
            </button>
            <div className="w-px h-6 bg-outline-variant/40"></div>
            <button onClick={() => addBlock('video')} className="flex items-center gap-2 text-sm font-bold text-primary hover:text-secondary px-3 py-2 rounded-full hover:bg-surface-container-low transition-colors text-nowrap">
              <span className="material-symbols-outlined text-[18px]">smart_display</span> Video
            </button>
            <div className="w-px h-6 bg-outline-variant/40 hidden md:block"></div>
            <button onClick={() => addBlock('pdf')} className="items-center gap-2 text-sm font-bold text-primary hover:text-secondary px-3 py-2 rounded-full hover:bg-surface-container-low transition-colors hidden md:flex text-nowrap">
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

