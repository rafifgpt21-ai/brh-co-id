"use client";

import Image from 'next/image';
import type { Post } from "@prisma/client";
import type { Locale } from '@/lib/i18n/config';
import { formatLocalizedDate } from '@/lib/i18n/config';
import { getCategoryLabel } from '@/lib/i18n/posts';
import { OptimisticLink } from '@/components/navigation/NavigationFeedback';

type ArchiveBlock = {
  type?: string;
  content?: string | null;
  url?: string | null;
};

interface ArchiveCardProps {
  post: Post;
  lang: Locale;
  labels: {
    categories: Record<string, string>;
    read: string;
  };
}

export default function ArchiveCard({ post, lang, labels }: ArchiveCardProps) {
  // Extract snippet from first text block (strip HTML)
  const firstTextBlock = Array.isArray(post.blocks)
    ? (post.blocks as ArchiveBlock[]).find((block) => block.type === 'text')
    : undefined;
  const firstImageBlock = Array.isArray(post.blocks)
    ? (post.blocks as ArchiveBlock[]).find((block) => block.type === 'image')
    : undefined;
  const thumbnailSrc = post.thumbnail || firstImageBlock?.url || firstImageBlock?.content || "";
  const isLocalBookCover =
    thumbnailSrc.startsWith("/book-cover/") || thumbnailSrc.startsWith("/api/book-cover/");
  const plainContent = firstTextBlock?.content ? firstTextBlock.content.replace(/<[^>]*>?/gm, '') : '';
  const snippet = plainContent 
    ? plainContent.substring(0, 100) + (plainContent.length > 100 ? '...' : '')
    : '';

  return (
    <OptimisticLink
      href={`/${lang}/post/${post.slug}`}
      className="surface-lift-hover group flex h-full min-h-[120px] flex-row overflow-hidden rounded-lg border border-outline-variant/25 bg-surface-container-lowest md:min-h-0"
    >
      {/* Thumbnail (Left) */}
      <div className="relative order-1 aspect-square w-28 shrink-0 self-start overflow-hidden bg-surface-container xs:w-36 md:w-40 lg:w-48 xl:w-52">
        {thumbnailSrc ? (
          <>
            <Image
              className="h-full w-full object-contain p-2.5 transition-transform duration-700 ease-out md:p-3"
              alt={post.title}
              src={thumbnailSrc}
              fill
              sizes="(max-width: 768px) 36vw, (max-width: 1024px) 160px, 208px"
              unoptimized={isLocalBookCover}
            />
            <div className="absolute inset-0 bg-black/5 transition-colors duration-300 group-hover:bg-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full bg-linear-to-br from-secondary/5 to-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary/20 text-3xl md:text-4xl">book</span>
          </div>
        )}
      </div>

      {/* Info Area (Right) */}
      <div className="flex-1 p-3.5 md:p-6 flex flex-col justify-between order-2 min-w-0">
        <div>
          <span className="text-secondary font-label text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase mb-1 md:mb-3 block">
            {getCategoryLabel(post.category, labels.categories)}
          </span>
          <h3 className="mb-1 line-clamp-3 font-headline text-[13px] font-black leading-snug text-primary transition-colors duration-200 group-hover:text-tertiary xs:text-sm md:mb-3 md:line-clamp-2 md:text-lg lg:text-xl">
            {post.title}
          </h3>
          {snippet && (
            <p className="text-on-surface-variant text-[10px] md:text-sm line-clamp-2 mb-2 md:mb-4 opacity-70 font-body block">
              {snippet}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2 md:pt-4 border-t border-outline-variant/10">
          <p className="text-on-surface-variant/60 text-[9px] md:text-xs font-semibold tracking-tighter">
            {formatLocalizedDate(post.createdAt, lang, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <div className="inline-flex items-center text-secondary font-bold text-[10px] md:text-xs gap-1.5 md:gap-2 group-hover:gap-3 transition-all duration-300">
            <span className="hidden sm:inline">{labels.read}</span>
            <span className="material-symbols-outlined text-[15px] md:text-[18px]">east</span>
          </div>
        </div>
      </div>
    </OptimisticLink>
  );
}
