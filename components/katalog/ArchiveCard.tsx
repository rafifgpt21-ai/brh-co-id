"use client";

import Image from 'next/image';
import Link from 'next/link';
import { Post } from "@/app/generated/prisma/client";

interface ArchiveCardProps {
  post: Post;
}

export default function ArchiveCard({ post }: ArchiveCardProps) {
  // Extract snippet from first text block (strip HTML)
  const firstTextBlock = (post.blocks as any)?.find((b: any) => b.type === 'text');
  const plainContent = firstTextBlock?.content ? firstTextBlock.content.replace(/<[^>]*>?/gm, '') : '';
  const snippet = plainContent 
    ? plainContent.substring(0, 100) + (plainContent.length > 100 ? '...' : '')
    : '';

  return (
    <Link
      href={`/post/${post.slug}`}
      className="group flex flex-row bg-surface-container-lowest rounded-xl md:rounded-2xl overflow-hidden border border-outline-variant/15 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full min-h-[120px] md:min-h-0"
    >
      {/* Thumbnail (Left) */}
      <div className="w-28 xs:w-36 md:w-40 lg:w-48 xl:w-52 aspect-square md:aspect-auto shrink-0 relative overflow-hidden order-1">
        {post.thumbnail ? (
          <>
            <Image
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
              alt={post.title}
              src={post.thumbnail}
              fill
              sizes="(max-width: 768px) 30vw, (max-width: 1024px) 200px, 250px"
            />
            <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
          </>
        ) : (
          <div className="w-full h-full bg-linear-to-br from-secondary/5 to-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary/20 text-3xl md:text-4xl">book</span>
          </div>
        )}
      </div>

      {/* Info Area (Right) */}
      <div className="flex-1 p-3.5 md:p-6 lg:p-8 flex flex-col justify-between order-2 min-w-0">
        <div>
          <span className="text-secondary font-label text-[9px] md:text-[11px] font-bold tracking-[0.2em] uppercase mb-1 md:mb-3 block">
            {post.category}
          </span>
          <h3 className="font-headline font-bold text-[13px] xs:text-sm md:text-lg lg:text-xl text-primary mb-1 md:mb-3 leading-snug line-clamp-3 md:line-clamp-2 lg:line-clamp-3 group-hover:text-secondary transition-colors duration-300">
            {post.title}
          </h3>
          {snippet && (
            <p className="text-on-surface-variant text-[10px] md:text-sm line-clamp-2 md:line-clamp-3 mb-2 md:mb-4 opacity-70 font-body block">
              {snippet}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-2 md:pt-4 border-t border-outline-variant/10">
          <p className="text-on-surface-variant/60 text-[9px] md:text-xs font-semibold tracking-tighter">
            {new Date(post.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
          <div className="inline-flex items-center text-secondary font-bold text-[10px] md:text-xs gap-1.5 md:gap-2 group-hover:gap-3 transition-all duration-300">
            <span className="hidden sm:inline">BACA</span>
            <span className="material-symbols-outlined text-[15px] md:text-[18px]">east</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
