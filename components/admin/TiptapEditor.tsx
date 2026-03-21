'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';

export const TiptapEditor = ({ 
  content, 
  onChange 
}: { 
  content: string; 
  onChange: (html: string) => void;
}) => {
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
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-slate prose-p:text-primary prose-headings:text-primary prose-strong:text-primary prose-blockquote:text-on-surface-variant max-w-none min-h-[150px] focus:outline-none p-4 font-body text-xl leading-relaxed text-primary',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-outline-variant/30 rounded-xl bg-surface-container-lowest/50 overflow-hidden flex flex-col mt-2">
      {/* Menu Bar */}
      <div className="bg-surface-container-lowest border-b border-outline-variant/30 p-2 flex gap-1 flex-wrap items-center">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('bold') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Bold"
        >
          B
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold italic transition-colors ${editor.isActive('italic') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Italic"
        >
          I
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold line-through transition-colors ${editor.isActive('strike') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Strike"
        >
          S
        </button>
        
        <div className="w-px h-5 bg-outline-variant/40 mx-2"></div>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'left' }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Align Left"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_left</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'center' }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Align Center"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_center</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'right' }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Align Right"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_right</span>
        </button>
        <button
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center ${editor.isActive({ textAlign: 'justify' }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Justify"
        >
          <span className="material-symbols-outlined text-[18px]">format_align_justify</span>
        </button>

        <div className="w-px h-5 bg-outline-variant/40 mx-2"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Heading 3"
        >
          H3
        </button>
        
        <div className="w-px h-5 bg-outline-variant/40 mx-2"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('bulletList') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('orderedList') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Ordered List"
        >
          1. List
        </button>
        
        <div className="w-px h-5 bg-outline-variant/40 mx-2"></div>
        
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${editor.isActive('blockquote') ? 'bg-secondary text-on-secondary' : 'hover:bg-surface-container-low text-on-surface-variant'}`}
          title="Blockquote"
        >
          " Quote
        </button>
      </div>
      
      {/* Editor Content Area */}
      <div className="bg-transparent flex-1 cursor-text" onClick={() => editor.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
