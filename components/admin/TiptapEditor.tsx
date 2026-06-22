'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useState } from 'react';

export const TiptapEditor = ({ 
  content, 
  onChange 
}: { 
  content: string; 
  onChange: (html: string) => void;
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      // Small timeout to allow button clicks in toolbar before losing focus styles
      setTimeout(() => setIsFocused(false), 200);
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-slate prose-p:text-primary prose-headings:text-primary prose-strong:text-primary prose-blockquote:text-on-surface-variant max-w-none min-h-[180px] focus:outline-none p-5 font-body text-base leading-relaxed text-primary',
      },
    },
  });

  if (!editor) {
    return null;
  }

  // Sticky class logic for mobile when focused
  const stickyToolbarClass = isFocused
    ? 'fixed md:relative bottom-0 md:bottom-auto left-0 right-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-t md:border-t-0 md:border-b border-outline-variant/35 shadow-lg md:shadow-none animate-in slide-in-from-bottom duration-200 p-2 md:p-2 flex gap-1 flex-wrap items-center justify-center md:justify-start'
    : 'relative bg-surface-container-lowest border-b border-outline-variant/20 p-2 flex gap-1 flex-wrap items-center';

  return (
    <div className="border border-outline-variant/30 rounded-xl bg-surface-container-lowest/30 overflow-hidden flex flex-col mt-2 hover:border-outline-variant/50 focus-within:border-secondary/40 focus-within:ring-1 focus-within:ring-secondary/15 transition-all">
      {/* Menu Bar */}
      <div className={stickyToolbarClass}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Tebal (Bold)"
        >
          <span className="material-symbols-outlined text-[18px]">format_bold</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Miring (Italic)"
        >
          <span className="material-symbols-outlined text-[18px]">format_italic</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('strike') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Coret (Strikethrough)"
        >
          <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
        </button>
        
        <div className="w-px h-5 bg-outline-variant/30 mx-1 hidden sm:block"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Rata Kiri"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_left</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Rata Tengah"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_center</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Rata Kanan"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_right</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive({ textAlign: 'justify' }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Rata Kiri Kanan"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_justify</span>
        </button>

        <div className="w-px h-5 bg-outline-variant/30 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors relative ${editor.isActive('heading', { level: 2 }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Judul 2"
        >
          <span className="material-symbols-outlined text-[18px]">title</span>
          <span className="text-[8px] absolute bottom-1 right-1 font-extrabold leading-none">2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors relative ${editor.isActive('heading', { level: 3 }) ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Judul 3"
        >
          <span className="material-symbols-outlined text-[18px]">title</span>
          <span className="text-[8px] absolute bottom-1 right-1 font-extrabold leading-none">3</span>
        </button>
        
        <div className="w-px h-5 bg-outline-variant/30 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Daftar Simbol (Bullet List)"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Daftar Angka (Ordered List)"
        >
          <span className="material-symbols-outlined text-[18px]">format_list_numbered</span>
        </button>
        
        <div className="w-px h-5 bg-outline-variant/30 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Kutipan (Blockquote)"
        >
          <span className="material-symbols-outlined text-[18px]">format_quote</span>
        </button>
      </div>
      
      {/* Editor Content Area */}
      <div className="bg-transparent flex-1 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

