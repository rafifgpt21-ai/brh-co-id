'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type PublishStage = 'uploading' | 'saving';

export type PublishedPostSummary = {
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

type PublishResult = {
  success: boolean;
  error?: string;
  post?: PublishedPostSummary;
};

type PublishTask = (setStage: (stage: PublishStage) => void) => Promise<PublishResult>;

type PublishJob = {
  title: string;
  kind: 'create' | 'update';
  status: PublishStage | 'success' | 'error';
  progress: number;
  error?: string;
};

type PublishProgressContextValue = {
  isPublishing: boolean;
  latestPublishedPost: PublishedPostSummary | null;
  startPublish: (options: {
    title: string;
    kind: 'create' | 'update';
    task: PublishTask;
  }) => boolean;
};

const PublishProgressContext = createContext<PublishProgressContextValue | null>(null);

export function usePublishProgress() {
  const context = useContext(PublishProgressContext);
  if (!context) {
    throw new Error('usePublishProgress harus digunakan di dalam PublishProgressProvider');
  }
  return context;
}

export function PublishProgressProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const activeJobRef = useRef(false);
  const dismissTimerRef = useRef<number | null>(null);
  const [job, setJob] = useState<PublishJob | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [latestPublishedPost, setLatestPublishedPost] = useState<PublishedPostSummary | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current !== null) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const jobStatus = job?.status;

  useEffect(() => {
    if (!jobStatus || jobStatus === 'success' || jobStatus === 'error') return;

    const interval = window.setInterval(() => {
      setJob((current) => {
        if (!current || current.status === 'success' || current.status === 'error') return current;
        const ceiling = current.status === 'uploading' ? 68 : 92;
        if (current.progress >= ceiling) return current;
        const remaining = ceiling - current.progress;
        return {
          ...current,
          progress: Math.min(ceiling, current.progress + Math.max(0.6, remaining * 0.08)),
        };
      });
    }, 450);

    return () => window.clearInterval(interval);
  }, [jobStatus]);

  useEffect(() => () => clearDismissTimer(), [clearDismissTimer]);

  const startPublish = useCallback<PublishProgressContextValue['startPublish']>(({ title, kind, task }) => {
    if (activeJobRef.current) return false;

    activeJobRef.current = true;
    setIsPublishing(true);
    setLatestPublishedPost(null);
    clearDismissTimer();
    setJob({ title, kind, status: 'uploading', progress: 8 });

    const setStage = (stage: PublishStage) => {
      setJob((current) => current ? {
        ...current,
        status: stage,
        progress: stage === 'saving' ? Math.max(current.progress, 72) : current.progress,
      } : current);
    };

    void task(setStage)
      .then((result) => {
        activeJobRef.current = false;
        setIsPublishing(false);
        if (!result.success) {
          setJob((current) => current ? {
            ...current,
            status: 'error',
            error: result.error || 'Publikasi gagal. Silakan coba lagi.',
          } : current);
          return;
        }

        setJob((current) => current ? { ...current, status: 'success', progress: 100 } : current);
        setLatestPublishedPost(result.post || null);
        router.refresh();
        dismissTimerRef.current = window.setTimeout(() => {
          setJob(null);
          setLatestPublishedPost(null);
        }, 6000);
      })
      .catch((error: unknown) => {
        activeJobRef.current = false;
        setIsPublishing(false);
        setJob((current) => current ? {
          ...current,
          status: 'error',
          error: error instanceof Error ? error.message : 'Publikasi gagal. Silakan coba lagi.',
        } : current);
      });

    return true;
  }, [clearDismissTimer, router]);

  const isSettled = job?.status === 'success' || job?.status === 'error';
  const isSuccess = job?.status === 'success';
  const isError = job?.status === 'error';

  return (
    <PublishProgressContext.Provider value={{ isPublishing, latestPublishedPost, startPublish }}>
      {children}

      {job && (
        <aside
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[120] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-3xl border border-outline-variant/25 bg-surface-container-lowest/95 shadow-2xl shadow-primary/15 backdrop-blur-xl sm:right-6"
          role="status"
          aria-live="polite"
          aria-label="Status publikasi"
        >
          <div className="flex items-start gap-3 p-4 sm:p-5">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isSuccess ? 'bg-secondary text-on-secondary' : isError ? 'bg-error/10 text-error' : 'bg-primary text-on-primary'}`}>
              <span className={`material-symbols-outlined text-[23px] ${!isSettled ? 'animate-spin' : ''}`}>
                {isSuccess ? 'check_circle' : isError ? 'error' : 'progress_activity'}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">
                    {isSuccess ? 'Publikasi selesai' : isError ? 'Publikasi gagal' : job.status === 'uploading' ? 'Mengunggah aset' : 'Menerbitkan post'}
                  </p>
                  <p className="mt-1 truncate text-sm font-black text-on-surface" title={job.title}>
                    {job.title}
                  </p>
                </div>

                {isSettled && (
                  <button
                    type="button"
                    onClick={() => {
                      clearDismissTimer();
                      setJob(null);
                      setLatestPublishedPost(null);
                    }}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
                    aria-label="Tutup status publikasi"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>

              <p className={`mt-2 text-xs font-medium leading-relaxed ${isError ? 'text-error' : 'text-on-surface-variant/75'}`}>
                {isSuccess
                  ? `${job.kind === 'create' ? 'Post baru' : 'Perubahan post'} sudah tampil di laman kelola.`
                  : isError
                    ? job.error
                    : 'Anda dapat melanjutkan pekerjaan lain. Proses ini tetap berjalan di latar belakang.'}
              </p>
            </div>
          </div>

          <div className="h-1.5 bg-surface-container-high" aria-hidden="true">
            <div
              className={`h-full transition-[width,background-color] duration-500 ease-out ${isError ? 'bg-error' : 'bg-secondary'}`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </aside>
      )}
    </PublishProgressContext.Provider>
  );
}
