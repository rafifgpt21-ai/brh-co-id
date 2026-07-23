'use client';

import { useState, useTransition, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BlockItem } from './BlockItem';
import { savePost } from '@/lib/actions/post';
import { uploadFiles } from '@/lib/uploadthing';
import { deletePost } from '@/lib/actions/post';
import { getContactsForDropdown } from '@/lib/actions/user-actions';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage, formatFileSize, type ImageCompressionResult } from '@/lib/image-compression';
import { createUploadReceipt, type UploadReceipt } from '@/lib/uploadthing-types';
import { rollbackUploadedFiles } from '@/lib/actions/uploadthing';
import { usePublishProgress, type PublishedPostSummary } from './PublishProgressProvider';

export type EditorBlock = {
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

type PostEditorInitialData = {
  id?: string;
  title?: string;
  titleEn?: string | null;
  category?: string;
  status?: "Published" | "Draft";
  thumbnail?: string | null;
  blocks?: EditorBlock[];
  timestamp?: number;
  publishedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type UploadEndpoint = "imageUploader" | "pdfUploader";

const CATEGORIES = ['Buku', 'Jurnal', 'Artikel', 'Opini'];

function toDateInputValue(value?: Date | string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

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
      className={`${className} overflow-hidden resize-none min-h-[44px]`}
      rows={rows}
    />
  );
};

export const PostEditor = ({ initialData }: { initialData?: PostEditorInitialData }) => {
  const router = useRouter();
  const { isPublishing, startPublish } = usePublishProgress();
  const [isPending, startTransition] = useTransition();
  
  // Base states
  const [title, setTitle] = useState(initialData?.title || '');
  const [titleEn, setTitleEn] = useState(initialData?.titleEn || '');
  const [category, setCategory] = useState(initialData?.category || 'Buku');
  const [publishedAt, setPublishedAt] = useState(() =>
    toDateInputValue(initialData?.publishedAt || initialData?.createdAt)
  );
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || '');
  const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
    initialData?.blocks ? JSON.parse(JSON.stringify(initialData.blocks)) : []
  );

  // Layout states
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [inspectorTab, setInspectorTab] = useState<'meta' | 'seo'>('meta');
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isMobileMetaOpen, setIsMobileMetaOpen] = useState(false);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blockFileInputRef = useRef<HTMLInputElement>(null);
  const [activeBlockTarget, setActiveBlockTarget] = useState<string | null>(null);

  // Staged Upload States
  const [stagedFiles, setStagedFiles] = useState<Record<string, File>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [compressionInfo, setCompressionInfo] = useState<Record<string, ImageCompressionResult>>({});
  const [compressingIds, setCompressingIds] = useState<Set<string>>(new Set());
  const compressionTokensRef = useRef<Record<string, symbol>>({});
  const [saveStatus, setSaveStatus] = useState<'Idle' | 'Uploading' | 'Saving' | 'Success' | 'Error'>('Idle');
  const [isLocalSaveInProgress, setIsSavingInProgress] = useState(false);
  const isSavingInProgress = isLocalSaveInProgress || isPublishing;

  const firstImageBlock = blocks.find((block) =>
    block.type === 'image' && Boolean(previews[block.id] || block.url)
  );
  const automaticThumbnail = firstImageBlock
    ? previews[firstImageBlock.id] || firstImageBlock.url || ''
    : '';
  const selectedThumbnail = previews.thumbnail || thumbnail;
  const thumbnailPreview = selectedThumbnail || automaticThumbnail;

  // Autosave & Recovery States
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [autosavedData, setAutosavedData] = useState<Partial<PostEditorInitialData> | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [contacts, setContacts] = useState<{ id: string, name: string | null, phone: string | null }[]>([]);
  const getCurrentSaveStatus = useCallback((): "Published" | "Draft" => {
    if (!initialData?.id) return "Draft";
    return initialData.status === "Draft" ? "Draft" : "Published";
  }, [initialData?.id, initialData?.status]);

  useEffect(() => {
    async function loadContacts() {
      try {
        const list = await getContactsForDropdown();
        setContacts(list);
      } catch (err) {
        console.error("Failed to load contacts for dropdown:", err);
      }
    }
    loadContacts();
  }, []);

  const isDirty =
    title !== (initialData?.title || '') ||
    titleEn !== (initialData?.titleEn || '') ||
    category !== (initialData?.category || 'Buku') ||
    publishedAt !== toDateInputValue(initialData?.publishedAt || initialData?.createdAt) ||
    thumbnail !== (initialData?.thumbnail || '') ||
    Object.keys(stagedFiles).length > 0 ||
    JSON.stringify(blocks.map(b => ({ ...b, id: b.id }))) !== JSON.stringify((initialData?.blocks || []).map((b) => ({ ...b, id: b.id })));

  // 1. Unsaved changes warning
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

  // 2. Intercept internal anchor clicks
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor instanceof HTMLAnchorElement) {
        const href = anchor.getAttribute('href');
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

  // 3. Local Storage Autosave Engine
  useEffect(() => {
    const key = `brh_autosave_post_${initialData?.id || 'new'}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hasEdits = parsed.title !== (initialData?.title || '') ||
                        parsed.category !== (initialData?.category || 'Buku') ||
                        parsed.publishedAt !== toDateInputValue(initialData?.publishedAt || initialData?.createdAt) ||
                        JSON.stringify(parsed.blocks) !== JSON.stringify(initialData?.blocks || []);
        if (hasEdits) {
          setAutosavedData(parsed);
          setShowRecoveryBanner(true);
        }
      } catch (e) {
        console.error("Autosave load error:", e);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (!isDirty) {
      setAutosaveStatus('idle');
      return;
    }

    setAutosaveStatus('saving');
    const timer = setTimeout(() => {
      const key = `brh_autosave_post_${initialData?.id || 'new'}`;
      const dataToSave = {
        title,
        titleEn,
        category,
        publishedAt,
        blocks: blocks.map(b => ({
          id: b.id,
          type: b.type,
          content: b.content,
          contentEn: b.contentEn,
          url: b.url,
          title: b.title,
          titleEn: b.titleEn,
          caption: b.caption,
          captionEn: b.captionEn
        })),
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      setAutosaveStatus('saved');
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, titleEn, category, publishedAt, blocks, isDirty, initialData?.id]);

  // 4. Keyboard Shortcuts handler (Ctrl+S for save, Ctrl+P for preview toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(getCurrentSaveStatus());
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setActiveTab(prev => prev === 'edit' ? 'preview' : 'edit');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, titleEn, category, publishedAt, blocks, initialData]);

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

  const stageCompressedImage = useCallback(async (
    key: string,
    file: File,
    profile: 'thumbnail' | 'content',
  ) => {
    const token = Symbol(key);
    compressionTokensRef.current[key] = token;
    setCompressingIds((current) => new Set(current).add(key));
    try {
      const result = await compressImage(file, profile);
      if (compressionTokensRef.current[key] !== token) return;

      setPreviews((current) => {
        if (current[key]) URL.revokeObjectURL(current[key]);
        return { ...current, [key]: URL.createObjectURL(result.file) };
      });
      setStagedFiles((current) => ({ ...current, [key]: result.file }));
      setCompressionInfo((current) => ({ ...current, [key]: result }));
    } catch (error) {
      if (compressionTokensRef.current[key] === token) {
        alert(error instanceof Error ? error.message : 'Gagal mengompresi gambar');
      }
    } finally {
      if (compressionTokensRef.current[key] === token) {
        delete compressionTokensRef.current[key];
        setCompressingIds((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    }
  }, []);

  const cancelCompression = useCallback((key: string) => {
    compressionTokensRef.current[key] = Symbol(`cancelled-${key}`);
    setCompressingIds((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
    setCompressionInfo((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const onThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void stageCompressedImage('thumbnail', file, 'thumbnail');
    }
    e.target.value = '';
  };

  const onBlockFileChange = useCallback((blockId: string, file: File) => {
    const block = blocks.find((item) => item.id === blockId);
    if (block?.type === 'image') {
      void stageCompressedImage(blockId, file, 'content');
      return;
    }
    setPreviews(prev => {
      if (prev[blockId]) URL.revokeObjectURL(prev[blockId]);
      const objectUrl = URL.createObjectURL(file);
      return { ...prev, [blockId]: objectUrl };
    });
    setStagedFiles(prev => ({ ...prev, [blockId]: file }));
    setCompressionInfo((current) => {
      const next = { ...current };
      delete next[blockId];
      return next;
    });
  }, [blocks, stageCompressedImage]);

  const onBlockFileSelect = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (blockFileInputRef.current) {
      blockFileInputRef.current.accept = block?.type === 'image'
        ? 'image/jpeg,image/png,image/webp,image/avif'
        : 'application/pdf';
    }
    setActiveBlockTarget(blockId);
    blockFileInputRef.current?.click();
  }, [blocks]);

  const handleBlockFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeBlockTarget) {
      onBlockFileChange(activeBlockTarget, file);
      e.target.value = '';
    }
  }, [activeBlockTarget, onBlockFileChange]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const addBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: '',
      url: '',
      isLocked: false,
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    setBlocks((prev) => {
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;
      const newBlocks = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
      return newBlocks;
    });
  }, []);

  const updateBlock = useCallback((id: string, data: Partial<EditorBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data } : b))
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const block = prev.find((b) => b.id === id);
      if (!block) return prev;
      
      const isEmpty = block.type === 'text'
        ? (!block.content || block.content.replace(/<[^>]*>/g, '').trim() === '')
        : (!block.url && !block.title && !block.caption && !stagedFiles[id]);

      if (isEmpty) {
        cancelCompression(id);
        if (stagedFiles[id]) {
          setStagedFiles(s => {
            const next = { ...s };
            delete next[id];
            return next;
          });
        }
        if (previews[id]) {
          URL.revokeObjectURL(previews[id]);
          setPreviews(p => {
            const next = { ...p };
            delete next[id];
            return next;
          });
        }
        return prev.filter((b) => b.id !== id);
      }
      
      setBlockToDelete(id);
      return prev;
    });
  }, [cancelCompression, stagedFiles, previews]);

  const confirmRemoveBlock = useCallback((id: string) => {
    cancelCompression(id);
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setBlockToDelete(null);
    
    if (stagedFiles[id]) {
      setStagedFiles(s => {
        const next = { ...s };
        delete next[id];
        return next;
      });
    }
    setCompressionInfo((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    if (previews[id]) {
      URL.revokeObjectURL(previews[id]);
      setPreviews(p => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }, [cancelCompression, stagedFiles, previews]);

  const persistPost = async (
    status: 'Published' | 'Draft',
    onStage: (stage: 'Uploading' | 'Saving') => void,
  ): Promise<{ success: boolean; error?: string; post?: PublishedPostSummary }> => {
    const uploadedReceipts: UploadReceipt[] = [];

    try {
      onStage('Uploading');
      let finalThumbnail = thumbnail;
      let finalBlocks = [...blocks];

      const filesToUpload = Object.entries(stagedFiles);
      if (filesToUpload.length > 0) {
        const endpointsMapping = filesToUpload.map(([key]) => {
          if (key === 'thumbnail') return 'imageUploader';
          const block = blocks.find(b => b.id === key);
          return block?.type === 'pdf' ? 'pdfUploader' : 'imageUploader' as const;
        });

        const byEndpoint: Record<UploadEndpoint, { keys: string[], files: File[] }> = {
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
            const res = await uploadFiles(endpoint as UploadEndpoint, {
              files: data.files,
            });

            res.forEach((uploadedFile, i) => {
              const key = data.keys[i];
              const newUrl = uploadedFile.ufsUrl || uploadedFile.url;
              uploadedReceipts.push(createUploadReceipt(
                uploadedFile,
                endpoint === 'pdfUploader' ? 'pdf' : 'image',
              ));
              if (key === 'thumbnail') {
                finalThumbnail = newUrl;
              } else {
                finalBlocks = finalBlocks.map(b => b.id === key ? { ...b, url: newUrl } : b);
              }
            });
          }
        }
      }

      if (!finalThumbnail.trim()) {
        finalThumbnail = finalBlocks.find((block) =>
          block.type === 'image' && Boolean(block.url?.trim())
        )?.url?.trim() || '';
      }

      onStage('Saving');

      const result = await savePost({
        id: initialData?.id,
        title,
        titleEn,
        category,
        publishedAt,
        thumbnail: finalThumbnail,
        status,
        blocks: finalBlocks.map((b) => ({
          id: b.id,
          type: b.type,
          content: b.content,
          contentEn: b.contentEn || '',
          url: b.url,
          title: b.title || '',
          titleEn: b.titleEn || '',
          caption: b.caption || '',
          captionEn: b.captionEn || '',
          isLocked: b.isLocked ?? false,
        })),
        newUploads: uploadedReceipts,
      });

      if (result.success) {
        if (!result.post) return { success: true };
        const savedPost = result.post;
        const excerpt = finalBlocks
          .find((block) => block.type === 'text')
          ?.content.replace(/<[^>]*>/g, ' ')
          .replace(/&nbsp;|&#160;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/&quot;/gi, '"')
          .replace(/&#39;|&apos;/gi, "'")
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 520) || '';

        return {
          success: true,
          post: {
            id: savedPost.id,
            title: savedPost.title,
            slug: savedPost.slug,
            category: savedPost.category,
            status: savedPost.status,
            thumbnail: savedPost.thumbnail,
            excerpt,
            publishedAt: savedPost.publishedAt,
            createdAt: savedPost.createdAt,
            updatedAt: savedPost.updatedAt,
          },
        };
      }

      if (uploadedReceipts.length > 0) await rollbackUploadedFiles(uploadedReceipts);
      return { success: false, error: result.error || 'Gagal menyimpan' };
    } catch (error) {
      console.error("Upload/Save error:", error);
      if (uploadedReceipts.length > 0) {
        try {
          await rollbackUploadedFiles(uploadedReceipts);
        } catch (cleanupError) {
          console.error('Upload rollback failed:', cleanupError);
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan postingan.',
      };
    }
  };

  const handleSave = async (status: 'Published' | 'Draft') => {
    if (!title.trim()) {
      alert('Judul tidak boleh kosong!');
      return;
    }
    if (compressingIds.size > 0) {
      alert('Tunggu sampai proses kompresi gambar selesai.');
      return;
    }
    if (isPublishing) {
      alert('Publikasi lain masih berjalan. Tunggu hingga proses tersebut selesai.');
      return;
    }

    if (status === 'Published') {
      setIsSavingInProgress(true);
      const started = startPublish({
        title: title.trim(),
        kind: initialData?.id ? 'update' : 'create',
        task: async (setStage) => {
          const result = await persistPost('Published', (stage) => {
            setStage(stage === 'Uploading' ? 'uploading' : 'saving');
          });

          if (result.success) {
            localStorage.removeItem(`brh_autosave_post_${initialData?.id || 'new'}`);
          }
          return result;
        },
      });

      if (started) {
        router.push('/admin');
      } else {
        setIsSavingInProgress(false);
      }
      return;
    }

    setIsSavingInProgress(true);
    setSaveStatus('Uploading');
    try {
      const result = await persistPost('Draft', setSaveStatus);
      if (result.success) {
        setSaveStatus('Success');
        localStorage.removeItem(`brh_autosave_post_${initialData?.id || 'new'}`);
        window.setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setSaveStatus('Error');
        alert(result.error || 'Gagal menyimpan');
      }
    } finally {
      setIsSavingInProgress(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    const postId = initialData.id;

    startTransition(async () => {
      const result = await deletePost(postId);
      if (result.success) {
        localStorage.removeItem(`brh_autosave_post_${postId}`);
        router.push('/admin');
        router.refresh();
      } else {
        alert(result.error || 'Gagal menghapus');
        setShowDeleteConfirm(false);
      }
    });
  };

  const handleRestoreDraft = () => {
    if (autosavedData) {
      setTitle(autosavedData.title || '');
      setTitleEn(autosavedData.titleEn || '');
      setCategory(autosavedData.category || 'Buku');
      setPublishedAt(autosavedData.publishedAt
        ? toDateInputValue(autosavedData.publishedAt)
        : toDateInputValue(initialData?.publishedAt || initialData?.createdAt));
      setBlocks(autosavedData.blocks || []);
    }
    setShowRecoveryBanner(false);
  };

  // Helper Stats generator
  const getStats = () => {
    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join(' ')
      .replace(/<[^>]*>/g, '');
    
    const words = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
    const chars = textContent.length;
    const readTime = Math.max(1, Math.ceil(words / 225));
    return { words, chars, readTime };
  };

  const { words, chars, readTime } = getStats();

  const getSEODescription = () => {
    const firstTextBlock = blocks.find(b => b.type === 'text');
    if (!firstTextBlock?.content) return "Tulis tulisan menarik Anda untuk dibagikan ke publik...";
    const rawText = firstTextBlock.content.replace(/<[^>]*>/g, '').trim();
    return rawText.slice(0, 155) + (rawText.length > 155 ? '...' : '');
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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

  // Notion-style inline block inserter component
  const InlineInserter = ({ atIndex }: { atIndex: number }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
      }
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isOpen]);

    const handleInsert = (type: EditorBlock['type']) => {
      const newBlock: EditorBlock = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        content: '',
        url: '',
        isLocked: false,
      };
      setBlocks(prev => {
        const next = [...prev];
        next.splice(atIndex, 0, newBlock);
        return next;
      });
      setIsOpen(false);
    };

    return (
      <div className="relative group/inserter py-3 flex items-center justify-center my-[-16px] z-20">
        <div className="absolute inset-x-0 h-px bg-linear-to-r from-transparent via-outline-variant/35 to-transparent opacity-0 group-hover/inserter:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative z-10 w-7 h-7 rounded-full bg-surface-container border border-outline-variant/30 flex items-center justify-center shadow-xs text-secondary hover:bg-secondary hover:text-on-secondary hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/inserter:opacity-100 ${isOpen ? 'opacity-100 bg-secondary text-on-secondary scale-110 rotate-45' : ''}`}
          title="Sisipkan Balok di Sini"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-9 z-50 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/30 shadow-xl rounded-2xl p-2.5 flex items-center gap-1.5 min-w-[280px]"
            >
              {[
                { type: 'text' as const, icon: 'notes', label: 'Teks' },
                { type: 'image' as const, icon: 'image', label: 'Gambar' },
                { type: 'video' as const, icon: 'smart_display', label: 'Video' },
                { type: 'pdf' as const, icon: 'picture_as_pdf', label: 'PDF' },
                { type: 'link' as const, icon: 'link', label: 'Link' },
                { type: 'contact' as const, icon: 'chat', label: 'Kontak' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleInsert(item.type)}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-xl text-primary hover:bg-secondary/15 hover:text-secondary transition-all active:scale-90"
                  title={`Sisipkan Balok ${item.label}`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span className="text-[8px] font-bold mt-1 uppercase">{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onThumbnailChange}
        accept="image/jpeg,image/png,image/webp,image/avif"
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
          Mobile / Intermediate — Fixed top bar
          ════════════════════════════════════════ */}
      <div className="lg:hidden fixed top-14 inset-x-0 z-30">
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
            <div className="flex items-center gap-1.5">
              <p className="text-[8px] font-label font-bold tracking-[0.2em] text-secondary uppercase leading-none opacity-70">
                {initialData?.id ? 'Edit Mode' : 'Draft Mode'}
              </p>
              {autosaveStatus === 'saving' && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Menyimpan..." />
              )}
              {autosaveStatus === 'saved' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" title="Tersimpan secara lokal" />
              )}
            </div>
            <p className="text-sm font-headline font-bold text-primary truncate leading-tight mt-0.5">
              {title || 'Postingan Baru'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Split Screen Mode toggle for Mobile */}
            <button
              type="button"
              onClick={() => setActiveTab(prev => prev === 'edit' ? 'preview' : 'edit')}
              className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all shrink-0 active:scale-95 border ${activeTab === 'preview' ? 'bg-secondary text-on-secondary shadow-xs border-secondary' : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'}`}
              title={activeTab === 'preview' ? 'Kembali Edit' : 'Pratinjau'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {activeTab === 'preview' ? 'edit' : 'visibility'}
              </span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => {
                setIsSaveMenuOpen(true);
                setIsMobileMetaOpen(false);
              }}
              disabled={isPending || isSavingInProgress}
              className={`flex items-center justify-center gap-2 h-10 px-4 rounded-2xl transition-all shadow-sm active:scale-95 disabled:opacity-50 ${isSaveMenuOpen
                ? 'bg-secondary text-on-secondary shadow-secondary/20 scale-95'
                : (isDirty || isSavingInProgress) ? 'bg-secondary text-on-secondary shadow-secondary/20' : 'bg-surface-container text-on-surface-variant border border-outline-variant/20'}`}
              title="Pilihan Simpan"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              <span className="text-[11px] font-bold uppercase tracking-wide hidden xs:inline">Simpan</span>
            </button>

            {/* Edit metadata toggle */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMetaOpen(true);
                setIsSaveMenuOpen(false);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant transition-all shrink-0 active:scale-95"
              title="Edit Metadata"
            >
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {(isSaveMenuOpen || isMobileMetaOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsSaveMenuOpen(false); setIsMobileMetaOpen(false); }}
            className="lg:hidden fixed inset-0 bg-black z-40 backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* Save Options Bottom Sheet Drawer (Mobile) */}
      <AnimatePresence>
        {isSaveMenuOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest border-t border-outline-variant/25 shadow-2xl px-6 py-6 pb-12 rounded-t-[2.5rem] flex flex-col gap-4"
          >
            <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-2 cursor-pointer" onClick={() => setIsSaveMenuOpen(false)} />
            <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-1 block text-center">Simpan Postingan</label>
            <div className="grid grid-cols-2 gap-3">
              {initialData?.id ? (
                <>
                  <button
                    onClick={() => { handleSave(getCurrentSaveStatus()); setIsSaveMenuOpen(false); }}
                    disabled={isSavingInProgress}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-secondary text-on-secondary shadow-lg active:scale-95 transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[22px]">save</span>
                    <span className="text-[10px] font-black uppercase mt-1">Update Post</span>
                    <span className="text-[8px] opacity-70">Simpan perubahan aktif</span>
                  </button>
                  {initialData?.status === 'Published' ? (
                    <button
                      onClick={() => { handleSave('Draft'); setIsSaveMenuOpen(false); }}
                      disabled={isSavingInProgress}
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant active:scale-95 transition-all text-center"
                    >
                      <span className="material-symbols-outlined text-[22px]">drafts</span>
                      <span className="text-[10px] font-black uppercase mt-1">Ke Draft</span>
                      <span className="text-[8px] opacity-70">Sembunyikan dari publik</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => { handleSave('Published'); setIsSaveMenuOpen(false); }}
                      disabled={isSavingInProgress}
                      className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-primary text-on-primary shadow-lg active:scale-95 transition-all text-center"
                    >
                      <span className="material-symbols-outlined text-[22px]">publish</span>
                      <span className="text-[10px] font-black uppercase mt-1">Terbitkan</span>
                      <span className="text-[8px] opacity-70">Tampilkan di blog</span>
                    </button>
                  )}
                  <button
                    onClick={() => { setShowDeleteConfirm(true); setIsSaveMenuOpen(false); }}
                    disabled={isSavingInProgress}
                    className="col-span-2 flex items-center justify-center gap-2 h-12 rounded-2xl bg-error/10 border border-error/20 text-error active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="text-[10px] font-black uppercase">Hapus Postingan Permanen</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { handleSave('Draft'); setIsSaveMenuOpen(false); }}
                    disabled={isSavingInProgress}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-surface-container border border-outline-variant/20 text-on-surface-variant active:scale-95 transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[22px]">save</span>
                    <span className="text-[10px] font-black uppercase mt-1">Simpan Draft</span>
                    <span className="text-[8px] opacity-70">Belum dipublikasikan</span>
                  </button>
                  <button
                    onClick={() => { handleSave('Published'); setIsSaveMenuOpen(false); }}
                    disabled={isSavingInProgress}
                    className="flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-2xl bg-secondary text-on-secondary shadow-lg active:scale-95 transition-all text-center"
                  >
                    <span className="material-symbols-outlined text-[22px]">publish</span>
                    <span className="text-[10px] font-black uppercase mt-1">Publish Sekarang</span>
                    <span className="text-[8px] opacity-70">Terbitkan ke publik</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expandable metadata drawer (Mobile Bottom Sheet) */}
      <AnimatePresence>
        {isMobileMetaOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-container-lowest border-t border-outline-variant/25 shadow-2xl px-6 py-6 pb-12 rounded-t-[2.5rem] flex flex-col gap-4 overflow-y-auto max-h-[85vh]"
          >
            <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full mx-auto mb-2 cursor-pointer" onClick={() => setIsMobileMetaOpen(false)} />
            <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-1 block text-center">Metadata Postingan</label>
            
            <div className="flex flex-col gap-4">
              {/* Title input */}
              <div>
                <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Judul Postingan</label>
                <AutoResizingTextarea
                  value={title}
                  onChange={setTitle}
                  placeholder="Tulis judul…"
                  className="w-full bg-surface-container/60 border border-outline-variant/20 rounded-2xl px-4 py-3 text-primary font-headline font-bold text-sm focus:outline-none focus:border-secondary/50 transition-all placeholder:text-on-surface-variant/30"
                />
              </div>
              <div>
                <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Judul English</label>
                <AutoResizingTextarea
                  value={titleEn}
                  onChange={setTitleEn}
                  placeholder="Write the English title..."
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

              {/* Thumbnail */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="mobile-published-at" className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase">
                    Tanggal Terbit
                  </label>
                  <button
                    type="button"
                    onClick={() => setPublishedAt(toDateInputValue())}
                    className="text-[9px] font-black uppercase tracking-wider text-secondary hover:text-primary"
                  >
                    Hari ini
                  </button>
                </div>
                <input
                  id="mobile-published-at"
                  type="date"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  required
                  className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container/60 px-4 py-3 text-sm font-bold text-primary outline-none transition focus:border-secondary/50"
                />
                <p className="mt-1.5 text-[9px] leading-relaxed text-on-surface-variant/55">Tanggal ini tampil ke publik dan menentukan urutan post terbaru.</p>
              </div>

              {/* Thumbnail */}
              <div>
                <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Thumbnail</label>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-all ${thumbnailPreview ? 'border-secondary/30 scale-105' : 'border-outline-variant/20 bg-surface-container/50'}`}>
                    {thumbnailPreview
                      ? <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                      : <span className="material-symbols-outlined text-secondary/30 text-2xl">add_photo_alternate</span>
                    }
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleThumbnailClick}
                        disabled={saveStatus !== 'Idle' || compressingIds.has('thumbnail')}
                        className="flex-1 h-11 px-4 rounded-xl bg-secondary text-on-secondary text-[10px] font-extrabold transition-all hover:bg-primary shadow-xs flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                        {selectedThumbnail ? 'GANTI' : 'UNGGAH'}
                      </button>
                      {selectedThumbnail && saveStatus === 'Idle' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus thumbnail?')) {
                              cancelCompression('thumbnail');
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
                    <p className="text-[8px] font-medium text-on-surface-variant/50 leading-tight uppercase tracking-wider">
                      {selectedThumbnail
                        ? 'Rasio 1:1 disarankan.'
                        : automaticThumbnail
                          ? 'Otomatis memakai gambar block pertama.'
                          : 'Jika kosong, gambar block pertama akan dipakai.'}
                    </p>
                    {compressingIds.has('thumbnail') && <p className="text-[9px] font-bold text-secondary">Mengompresi gambar...</p>}
                    {compressionInfo.thumbnail && (
                      <p className="text-[9px] font-bold text-on-surface-variant/70">
                        {formatFileSize(compressionInfo.thumbnail.originalBytes)} → {formatFileSize(compressionInfo.thumbnail.finalBytes)}
                        {compressionInfo.thumbnail.savedPercent > 0 ? ` (hemat ${compressionInfo.thumbnail.savedPercent}%)` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main editor workspace ── */}
      <main className="min-h-screen px-4 sm:px-8 xl:px-14 pb-32 lg:pr-80 xl:pr-88 pt-9 lg:pt-8">
        
        {/* Local Storage Recovery Notification Banner */}
        <AnimatePresence>
          {showRecoveryBanner && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-secondary/10 border border-secondary/20 rounded-3xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <span className="material-symbols-outlined text-secondary text-2xl shrink-0 mt-0.5">restore</span>
                <div>
                  <h4 className="font-headline font-bold text-primary text-sm">Draf Cadangan Ditemukan!</h4>
                  <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
                    Kami mendeteksi perubahan lokal yang belum tersimpan dari sesi sebelumnya ({new Date(autosavedData?.timestamp || Date.now()).toLocaleTimeString('id-ID')}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-primary transition-all active:scale-95"
                >
                  Pulihkan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(`brh_autosave_post_${initialData?.id || 'new'}`);
                    setShowRecoveryBanner(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant text-xs font-bold transition-all active:scale-95"
                >
                  Abaikan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Navigation (Desktop Tab Bar) */}
        <div className="hidden lg:flex items-center gap-1 bg-surface-container-low/80 border border-outline-variant/20 rounded-2xl p-1 w-fit mb-8 select-none">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${activeTab === 'edit' ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Tulis Konten (Edit)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${activeTab === 'preview' ? 'bg-secondary text-on-secondary shadow-xs' : 'hover:bg-surface-container-high text-on-surface-variant'}`}
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Pratinjau Live (Preview)
          </button>
        </div>

        {/* ── Content View Selector ── */}
        {activeTab === 'preview' ? (
          /* LIVE PREVIEW VIEW */
          <div className="max-w-3xl mx-auto bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl border border-outline-variant/15 p-6 md:p-12 shadow-xs my-4 prose prose-slate">
            <div className="text-center mb-10 pb-8 border-b border-outline-variant/15 select-none">
              <span className="inline-block rounded-full bg-secondary text-on-secondary px-5 py-1.5 text-[9px] font-label font-bold tracking-[0.2em] uppercase mb-4">
                {category}
              </span>
              <h1 className="text-3xl md:text-5xl font-headline font-extrabold text-primary leading-tight mb-4 tracking-tight">
                {title || 'Judul Postingan Baru'}
              </h1>
              <div className="flex justify-center items-center gap-4 text-on-surface-variant/70 text-xs font-bold uppercase tracking-wider">
                <span>{formatDate(`${publishedAt}T12:00:00.000Z`)}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/40" />
                <span>{readTime} Menit Baca</span>
              </div>
            </div>

            {thumbnailPreview && (
              <div className="rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-low mb-12 shadow-xs select-none">
                <div className="relative mx-auto aspect-square w-full max-w-[400px] bg-surface-container">
                  <img src={thumbnailPreview} alt={title} className="h-full w-full object-contain p-2" />
                </div>
              </div>
            )}

            <div className="space-y-12">
              {blocks.length === 0 ? (
                <p className="text-center text-on-surface-variant/40 italic py-12 text-sm select-none">Belum ada konten untuk dipratinjau.</p>
              ) : (
                blocks.map((block) => {
                  if (block.type === 'text') {
                    return (
                      <div
                        key={block.id}
                        className="prose max-w-none text-on-surface leading-[1.6] md:leading-[1.7] font-body
                          prose-headings:font-headline prose-headings:text-primary
                          prose-h2:text-xl md:text-2xl prose-h2:mt-8 prose-h2:mb-4
                          prose-p:mb-4 prose-p:text-on-surface/90
                          prose-a:text-secondary prose-a:font-bold
                          prose-strong:text-primary prose-strong:font-bold
                          prose-blockquote:border-l-4 prose-blockquote:border-secondary/35 prose-blockquote:bg-surface-container-low/20 prose-blockquote:py-3 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:italic"
                        dangerouslySetInnerHTML={{ __html: block.content || "" }}
                      />
                    );
                  }
                  if (block.type === 'image') {
                    return (
                      <div key={block.id} className="flex flex-col gap-3">
                        {block.title && <h3 className="text-xl font-headline font-bold text-primary tracking-tight text-center">{block.title}</h3>}
                        <div className="rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-low">
                          <img src={previews[block.id] || block.url} alt={block.title} className="w-full h-auto max-h-[450px] object-contain mx-auto" />
                        </div>
                        {block.caption && <p className="text-xs text-on-surface-variant font-medium text-center italic mt-1">{block.caption}</p>}
                      </div>
                    );
                  }
                  if (block.type === 'pdf') {
                    return (
                      <div key={block.id} className="my-8">
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface-container-high border border-outline-variant/15 select-none">
                          <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined text-2xl">description</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-headline font-bold text-base text-primary truncate">
                              {block.title || "Lihat Dokumen PDF"}
                            </h4>
                            <p className="text-[10px] text-on-surface-variant font-semibold uppercase tracking-wider">Dokumen Terproteksi • Klik untuk Membaca</p>
                          </div>
                        </div>
                        {block.caption && <p className="text-xs text-on-surface-variant italic mt-3 pl-3 border-l-2 border-secondary/25">{block.caption}</p>}
                      </div>
                    );
                  }
                  if (block.type === 'video') {
                    const embed = getEmbedUrl(block.url);
                    return (
                      <div key={block.id} className="my-10">
                        <div className="flex flex-col gap-4">
                          {block.title && <h3 className="text-lg font-headline font-bold text-primary text-center">{block.title}</h3>}
                          {embed ? (
                            <div className="aspect-video rounded-2xl overflow-hidden border border-outline-variant/15 bg-black">
                              <iframe src={embed} className="w-full h-full" allowFullScreen />
                            </div>
                          ) : (
                            <div className="bg-surface-container-low border border-outline-variant/20 p-8 rounded-2xl text-center text-on-surface-variant text-xs select-none">URL Video tidak valid</div>
                          )}
                          {block.caption && <p className="text-xs text-on-surface-variant italic text-center">{block.caption}</p>}
                        </div>
                      </div>
                    );
                  }
                  if (block.type === 'link') {
                    return (
                      <div key={block.id} className="my-8">
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">link</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-headline font-bold text-base text-primary truncate">{block.title || "Tautan Terkait"}</h4>
                            <p className="text-[10px] text-on-surface-variant truncate">{block.url}</p>
                          </div>
                        </div>
                        {block.caption && <p className="text-xs text-on-surface-variant italic mt-3 pl-3 border-l-2 border-primary/20">{block.caption}</p>}
                      </div>
                    );
                  }
                  if (block.type === 'contact') {
                    return (
                      <div key={block.id} className="my-8 flex justify-center">
                        <div className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] font-headline font-bold text-sm select-none shadow-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-whatsapp" viewBox="0 0 16 16">
                            <path d="M13.601 2.326A7.85 7.85 0 0 0 8 0a7.86 7.86 0 0 0-6.68 11.753l-.525 1.917a.4.4 0 0 0 .51.51l1.916-.525A7.86 7.86 0 0 0 16 8a7.86 7.86 0 0 0-2.399-5.674zM10.56 10.695c-.138.38-.722.744-1.077.827-.3.069-.692.13-1.098-.1-.365-.206-.74-.413-1.129-.756-.995-.877-1.63-1.879-1.859-2.222c-.228-.343-.451-.798-.451-1.29 0-.491.258-.731.35-.83.093-.1.207-.15.31-.15.1.004.2.004.288.008.09.003.208-.035.327.245.122.287.418 1.018.455 1.09.036.073.06.158.01.258-.05.1-.077.164-.155.25-.077.09-.162.2-.23.275-.077.075-.158.158-.068.312.09.15.398.654.85 1.054.582.516 1.07.677 1.222.753.15.075.24.064.33-.034.09-.1.38-.443.483-.595.103-.15.207-.126.347-.075.14.05.888.419 1.04.495.152.075.253.11.291.176.038.065.038.379-.1.76z"/>
                          </svg>
                          <span>{block.title || "Hubungi via WhatsApp"} ({block.content || "Belum diatur"})</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        ) : (
          /* WRITE / EDIT VIEW */
          <div className="space-y-6">
            {/* Title editing rail inline for fast entry */}
            <div className="bg-surface-container-lowest/60 border border-outline-variant/10 rounded-3xl p-5 sm:p-6 mb-3 select-none">
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">Judul Postingan Utama</label>
              <AutoResizingTextarea
                value={title}
                onChange={setTitle}
                placeholder="Tulis judul yang menarik..."
                className="w-full bg-transparent border-0 rounded-none px-0 py-1 text-primary font-headline font-extrabold text-2xl sm:text-3xl focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/25 resize-none"
              />
              <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mt-5 mb-2 block">Judul English</label>
              <AutoResizingTextarea
                value={titleEn}
                onChange={setTitleEn}
                placeholder="Write the English title..."
                className="w-full bg-transparent border-0 rounded-none px-0 py-1 text-primary/80 font-headline font-bold text-xl sm:text-2xl focus:outline-none focus:ring-0 placeholder:text-on-surface-variant/25 resize-none"
              />
            </div>

            {blocks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-outline-variant/30 bg-surface-container-lowest/40">
                <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 shadow-xs">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">article</span>
                </div>
                <p className="font-headline font-bold text-primary/60 mb-1">Belum ada konten</p>
                <p className="text-xs text-on-surface-variant/50 mb-4">Tambahkan balok di bawah untuk memulai menulis.</p>
                <button
                  type="button"
                  onClick={() => addBlock('text')}
                  className="px-6 py-2 rounded-full bg-secondary text-on-secondary text-xs font-bold active:scale-95 transition-all shadow-xs"
                >
                  Mulai Balok Teks
                </button>
              </div>
            )}

            {/* Inserter at index 0 */}
            {blocks.length > 0 && <InlineInserter atIndex={0} />}

            {blocks.map((block, i) => (
              <div key={block.id}>
                <BlockItem
                  block={block}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === blocks.length - 1}
                  isDeleting={blockToDelete === block.id}
                  preview={previews[block.id]}
                  stagedFile={stagedFiles[block.id]}
                  compressionInfo={compressionInfo[block.id]}
                  isCompressing={compressingIds.has(block.id)}
                  onUpdate={updateBlock}
                  onRemove={removeBlock}
                  onConfirmRemove={confirmRemoveBlock}
                  onCancelDelete={() => setBlockToDelete(null)}
                  onMove={moveBlock}
                  onFileSelect={onBlockFileSelect}
                  onFileDrop={onBlockFileChange}
                  saveStatus={saveStatus}
                  contacts={contacts}
                />
                {/* Inserter after block i */}
                <InlineInserter atIndex={i + 1} />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Add-block toolbar — fixed at bottom center (desktop) ── */}
      <div className="hidden md:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 items-center gap-2 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/20 shadow-2xl rounded-full px-5 py-3 select-none">
        <span className="text-[10px] font-label font-bold text-on-surface-variant/60 uppercase tracking-widest mr-2">
          + Tambah
        </span>
        {[
          { type: 'text' as const, icon: 'notes', label: 'Teks' },
          { type: 'image' as const, icon: 'image', label: 'Gambar' },
          { type: 'video' as const, icon: 'smart_display', label: 'Video' },
          { type: 'pdf' as const, icon: 'picture_as_pdf', label: 'PDF' },
          { type: 'link' as const, icon: 'link', label: 'Link' },
          { type: 'contact' as const, icon: 'chat', label: 'Kontak' },
        ].map((item, idx, arr) => (
          <div key={item.type} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addBlock(item.type)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-secondary px-3 py-1.5 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              {item.label}
            </button>
            {idx < arr.length - 1 && <div className="w-px h-5 bg-outline-variant/40" />}
          </div>
        ))}
      </div>

      {/* ── Mobile FAB ── */}
      <div className="md:hidden fixed bottom-8 right-6 z-30 flex flex-col items-end gap-3 select-none">
        {isAddMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]" onClick={() => setIsAddMenuOpen(false)} />
            <div className="absolute bottom-20 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 shadow-2xl rounded-3xl p-3 flex flex-col gap-1 min-w-[200px] animate-in fade-in slide-in-from-bottom duration-200">
              {[
                { type: 'text' as const, icon: 'notes', label: 'Teks Baru' },
                { type: 'image' as const, icon: 'image', label: 'Gambar' },
                { type: 'video' as const, icon: 'smart_display', label: 'Video YouTube' },
                { type: 'pdf' as const, icon: 'picture_as_pdf', label: 'Dokumen PDF' },
                { type: 'link' as const, icon: 'link', label: 'Tautan Sumber' },
                { type: 'contact' as const, icon: 'chat', label: 'Kontak WhatsApp' },
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
          Inspector Side Panel (Desktop Sidebar)
          ════════════════════════════════════════ */}
      <div className="hidden lg:block fixed top-[88px] right-4 xl:right-6 z-20 w-72 xl:w-80 select-none">
        <div className="bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/15 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
          
          {/* Header */}
          <div className="p-5 flex items-center gap-3 border-b border-outline-variant/15">
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
              <h2 className="text-sm font-headline font-bold text-primary truncate mt-0.5">
                {title || 'Tanpa Judul'}
              </h2>
            </div>
          </div>

          {/* Inspector Tab Selector */}
          <div className="grid grid-cols-2 border-b border-outline-variant/10 text-center text-xs font-bold bg-surface-container-low/30">
            <button
              type="button"
              onClick={() => setInspectorTab('meta')}
              className={`py-3.5 transition-colors cursor-pointer border-b-2 ${inspectorTab === 'meta' ? 'border-secondary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-primary'}`}
            >
              Status & Meta
            </button>
            <button
              type="button"
              onClick={() => setInspectorTab('seo')}
              className={`py-3.5 transition-colors cursor-pointer border-b-2 ${inspectorTab === 'seo' ? 'border-secondary text-primary' : 'border-transparent text-on-surface-variant/50 hover:text-primary'}`}
            >
              SEO & Analitik
            </button>
          </div>

          {/* Tab contents */}
          <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
            {inspectorTab === 'meta' ? (
              /* META & STATUS TAB */
              <>
                {/* Autosave Status Indicator */}
                {autosaveStatus !== 'idle' && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/5 border border-secondary/15">
                    <span className="material-symbols-outlined text-secondary text-[16px] animate-pulse">cloud_upload</span>
                    <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {autosaveStatus === 'saving' ? 'Auto-saving...' : 'Draft disimpan lokal'}
                    </span>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label htmlFor="category" className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-1.5 block">
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

                {/* Publication Date */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="published-at" className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase">
                      Tanggal Terbit
                    </label>
                    <button
                      type="button"
                      onClick={() => setPublishedAt(toDateInputValue())}
                      className="text-[8px] font-black uppercase tracking-wider text-secondary transition hover:text-primary"
                    >
                      Hari ini
                    </button>
                  </div>
                  <input
                    id="published-at"
                    type="date"
                    value={publishedAt}
                    onChange={(event) => setPublishedAt(event.target.value)}
                    required
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container/60 px-3.5 py-2.5 text-sm font-bold text-primary outline-none transition focus:border-secondary/50"
                  />
                  <p className="mt-1.5 text-[9px] leading-relaxed text-on-surface-variant/55">Dipakai sebagai tanggal publik dan urutan post terbaru.</p>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="text-[9px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase mb-2 block">
                    Cover Image
                  </label>
                  <div className="flex gap-3 items-start">
                    <div className={`shrink-0 w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${thumbnailPreview ? 'border-secondary/30 bg-surface-container-low' : 'border-outline-variant/20 bg-surface-container/50'}`}>
                      {thumbnailPreview ? (
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="material-symbols-outlined text-secondary/30 text-xl">add_photo_alternate</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2 pl-2">
                      <button
                        type="button"
                        onClick={handleThumbnailClick}
                        disabled={saveStatus !== 'Idle' || compressingIds.has('thumbnail')}
                        className="w-full h-9 px-3 rounded-xl bg-secondary text-on-secondary text-[9px] font-black uppercase tracking-wider transition-all hover:bg-primary flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-70 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                        UNGGAH
                      </button>
                      {selectedThumbnail && saveStatus === 'Idle' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Hapus thumbnail?')) {
                              cancelCompression('thumbnail');
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
                          className="w-full h-9 px-3 rounded-xl bg-error/10 hover:bg-error/20 text-error text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer border border-error/15"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                          HAPUS
                        </button>
                      )}
                      <p className="text-[8px] font-medium leading-tight text-on-surface-variant/50">
                        {selectedThumbnail
                          ? 'Rasio 1:1 disarankan.'
                          : automaticThumbnail
                            ? 'Otomatis memakai gambar block pertama.'
                            : 'Jika kosong, gambar block pertama akan dipakai.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="border-t border-outline-variant/15 pt-4 flex flex-col gap-2 bg-surface-container-low/20 p-4 rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase">Informasi Dokumen</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-primary/80">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">layers</span>
                      {blocks.length} Balok
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">analytics</span>
                      {words} Kata
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">schedule</span>
                      {readTime} Min Baca
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">text_fields</span>
                      {chars} Huruf
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* SEO & ANALYTICS TAB */
              <div className="flex flex-col gap-4">
                {/* Mock Search Result Card */}
                <div className="bg-white p-4 rounded-2xl border border-outline-variant/15 shadow-xs">
                  <span className="text-[8px] font-label font-bold tracking-[0.2em] text-secondary/60 uppercase block mb-3">Google SEO Preview</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-normal truncate">
                    <span>https://brh.co.id</span>
                    <span className="text-[8px]">&gt;</span>
                    <span>post</span>
                    <span className="text-[8px]">&gt;</span>
                    <span className="truncate">{title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}</span>
                  </div>
                  <h3 className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer leading-tight mt-1 truncate">
                    {title || 'Judul Postingan Baru'} | BRH Insight
                  </h3>
                  <p className="text-[10px] text-slate-600 leading-normal mt-1 text-wrap line-clamp-3">
                    {getSEODescription()}
                  </p>
                </div>

                {/* Content Quality Checklist */}
                <div className="flex flex-col gap-2 bg-surface-container-low/20 p-4 rounded-2xl border border-outline-variant/10">
                  <span className="text-[8px] font-label font-bold tracking-[0.2em] text-secondary/70 uppercase">Analisis Konten</span>
                  <div className="flex flex-col gap-2.5 mt-1 text-[11px] font-bold">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${title.length >= 10 ? 'text-green-500' : 'text-on-surface-variant/40'}`}>
                        {title.length >= 10 ? 'check_circle' : 'circle'}
                      </span>
                      <span className="text-primary/70">Judul ideal (&gt;10 huruf)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${thumbnailPreview ? 'text-green-500' : 'text-on-surface-variant/40'}`}>
                        {thumbnailPreview ? 'check_circle' : 'circle'}
                      </span>
                      <span className="text-primary/70">Thumbnail terunggah</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${blocks.some(b => b.type === 'text') ? 'text-green-500' : 'text-on-surface-variant/40'}`}>
                        {blocks.some(b => b.type === 'text') ? 'check_circle' : 'circle'}
                      </span>
                      <span className="text-primary/70">Terdapat konten teks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${blocks.some(b => b.type === 'pdf' || b.type === 'link') ? 'text-green-500' : 'text-on-surface-variant/40'}`}>
                        {blocks.some(b => b.type === 'pdf' || b.type === 'link') ? 'check_circle' : 'circle'}
                      </span>
                      <span className="text-primary/70">Berkas/Sumber terlampir</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar Sticky Action Footer */}
            <div className="border-t border-outline-variant/15 pt-4 mt-auto">
              <div className="flex flex-col gap-2.5">
                {initialData?.id ? (
                  <>
                    <button
                      onClick={() => handleSave(initialData?.status || 'Published')}
                      disabled={isPending || isSavingInProgress}
                      className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-2xl bg-secondary text-on-secondary hover:bg-primary transition-all shadow-xs disabled:opacity-50 cursor-pointer ${(isDirty || isSavingInProgress) ? 'pulse-green' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{(isPending || isSavingInProgress) ? 'sync' : 'save'}</span>
                      <span className="text-[11px] font-bold uppercase tracking-widest">
                        {(isPending || isSavingInProgress) ? 'Menyimpan…' : 'Simpan Perubahan'}
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
                          disabled={isPending || isSavingInProgress}
                          className="flex items-center justify-center gap-2 py-3 px-2 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/15 disabled:opacity-50 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{(isPending || isSavingInProgress) ? 'sync' : 'drafts'}</span>
                          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider text-center">Draft</span>
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
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleSave('Draft')}
                      disabled={isSavingInProgress}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all border border-outline-variant/20 disabled:opacity-50 cursor-pointer ${isDirty ? 'pulse-green' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[22px] text-on-surface-variant">save</span>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Draft</span>
                    </button>
                    <button
                      onClick={() => handleSave('Published')}
                      disabled={isSavingInProgress}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-2xl bg-secondary text-on-secondary hover:bg-primary transition-all shadow-xs disabled:opacity-50 cursor-pointer ${isDirty ? 'pulse-green' : ''}`}
                    >
                      <span className="material-symbols-outlined text-[22px]">publish</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Publish</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !isSavingInProgress && setShowDeleteConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 p-6 overflow-hidden z-10">
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
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => !isPending && setShowUnsavedConfirm(false)}
          />
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/20 p-6 overflow-hidden z-10">
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
                  onClick={() => handleSave(getCurrentSaveStatus())}
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
            className="fixed inset-0 z-[110] flex items-center justify-center bg-surface-container-lowest/80 backdrop-blur-md"
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
