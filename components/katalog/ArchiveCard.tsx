"use client";

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
      className="group flex flex-col sm:flex-row bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/15 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full"
    >
      {/* Info Area (Left) */}
      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between order-2 sm:order-1">
        <div>
          <span className="text-secondary font-label text-[10px] font-bold tracking-[0.2em] uppercase mb-3 block">
            {post.category}
          </span>
          <h3 className="font-headline font-bold text-lg md:text-xl text-primary mb-3 leading-snug line-clamp-2 group-hover:text-secondary transition-colors duration-300">
            {post.title}
          </h3>
          {snippet && (
            <p className="text-on-surface-variant text-sm line-clamp-2 mb-4 opacity-80 font-body">
              {snippet}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-outline-variant/10">
          <p className="text-on-surface-variant/60 text-xs font-medium">
            {new Date(post.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <div className="inline-flex items-center text-secondary font-bold text-xs gap-2 group-hover:gap-3 transition-all duration-300">
            BACA
            <span className="material-symbols-outlined text-[16px]">east</span>
          </div>
        </div>
      </div>

      {/* Thumbnail (Right) */}
      <div className="w-full sm:w-40 md:w-56 lg:w-48 xl:w-52 aspect-square shrink-0 relative overflow-hidden order-1 sm:order-2">
        {post.thumbnail ? (
          <img
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
            alt={post.title}
            src={post.thumbnail}
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-secondary/5 to-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary/20 text-4xl">book</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-500"></div>
      </div>
    </Link>
  );
}
