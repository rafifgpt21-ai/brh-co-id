"use client";

import { motion, useScroll, useSpring } from "framer-motion";
import Image from "next/image";
import React from "react";
import type { Locale } from "@/lib/i18n/config";
import { formatLocalizedDate } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getCategoryLabel } from "@/lib/i18n/posts";
import { OptimisticLink } from "@/components/navigation/NavigationFeedback";
import { ShareActions } from "@/components/common/ShareActions";
import { buildAbsoluteUrl } from "@/lib/share-url";

type PostBlock = {
  id: string;
  type: "text" | "image" | "video" | "pdf" | "link" | "contact" | string;
  content?: string | null;
  url?: string | null;
  title?: string | null;
  caption?: string | null;
};

type PublicPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  thumbnail?: string | null;
  createdAt: Date | string;
  blocks: PostBlock[];
};

interface PostClientProps {
  post: PublicPost;
  relatedPosts: PublicPost[];
  lang: Locale;
  dict: Dictionary;
}

function isLocalBookCover(src?: string | null) {
  return Boolean(src?.startsWith("/book-cover/") || src?.startsWith("/api/book-cover/"));
}

export default function PostClient({ post, relatedPosts, lang, dict }: PostClientProps) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const formatDate = (date: Date | string) => {
    return formatLocalizedDate(date, lang);
  };

  const getReadingTime = (blocks: PostBlock[]) => {
    const text = blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join(' ');
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 225));
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const shareUrl = buildAbsoluteUrl(`/${lang}/post/${post.slug}`);
  const shareLabels = {
    share: dict.post.share,
    shareToFacebook: dict.post.shareToFacebook,
    shareToWhatsapp: dict.post.shareToWhatsapp,
    copyLink: dict.post.copyLink,
    linkCopied: dict.post.linkCopied,
  };

  return (
    <article className="min-h-screen bg-background pb-20">
      {/* Reading Progress Bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed left-0 right-0 top-0 z-50 h-1 bg-secondary origin-left"
      />

      <header className="relative flex min-h-[54vh] w-full flex-col items-center justify-center overflow-hidden border-b border-outline-variant/20 md:min-h-[62vh]">
        <div className="absolute inset-0 z-0">
          {post.thumbnail ? (
            <div className="relative h-full w-full overflow-hidden">
              <Image
                src={post.thumbnail}
                alt={post.title}
                fill
                priority
                unoptimized={isLocalBookCover(post.thumbnail)}
                className="h-full w-full scale-110 object-cover opacity-80 blur-md"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-b from-background/10 to-transparent" />
            </div>
          ) : (
            <div className="h-full bg-background" />
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-16 text-center md:py-20">
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <OptimisticLink
              href={`/${lang}/explore`}
              className="group mb-8 inline-flex items-center gap-2 rounded-full border border-outline-variant/25 bg-surface-container-lowest/85 px-5 py-2.5 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant backdrop-blur-md transition hover:border-secondary/35 hover:text-secondary"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              {dict.post.catalog}
            </OptimisticLink>

            <motion.div
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.35 }}
              className="mb-7 flex flex-wrap justify-center gap-3"
            >
              <span className="inline-block rounded-full bg-secondary text-on-secondary px-5 py-2 font-label text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm shadow-secondary/15">
                {getCategoryLabel(post.category, dict.explore.categories)}
              </span>
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mb-8 max-w-3xl text-pretty font-headline text-4xl font-black leading-[1.08] tracking-tight text-primary md:text-6xl"
            >
              {post.title}
            </motion.h1>

            <motion.div
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.45 }}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] opacity-70">calendar_today</span>
                {formatDate(post.createdAt)}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/30" />
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] opacity-70">schedule</span>
                {getReadingTime(post.blocks)} {dict.post.minutesRead}
              </div>
            </motion.div>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.45 }}
              className="mt-8"
            >
              <ShareActions url={shareUrl} title={post.title} labels={shareLabels} />
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative mx-auto max-w-4xl px-0 py-4 md:px-6 md:py-10">
        <div className="mb-20 rounded-none px-4 py-8 shadow-none md:px-0 md:py-12">
          <div className="space-y-14 md:space-y-16">
            {post.blocks.map((block) => {
              if (block.type === "text") {
                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    className="prose prose-base md:prose-lg max-w-none text-on-surface leading-[1.68] md:leading-[1.78] font-body tracking-normal
                      prose-headings:font-headline prose-headings:text-primary prose-headings:tracking-tight
                      prose-h2:text-xl md:text-2xl prose-h2:mt-12 prose-h2:mb-6
                      prose-p:mb-6 prose-p:text-on-surface/90
                      prose-a:text-secondary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-primary prose-strong:font-bold
                      prose-blockquote:border-l-4 prose-blockquote:border-secondary/30 prose-blockquote:bg-surface-container-low/30 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                      prose-img:rounded-3xl shadow-none"
                    dangerouslySetInnerHTML={{ __html: block.content || "" }}
                  />
                );
              }
              if (block.type === "image") {
                const imageSrc = block.url || block.content;
                if (!imageSrc) return null;

                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative group overflow-hidden"
                  >
                    <div className="flex flex-col gap-6">
                      {block.title && (
                        <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight text-center">{block.title}</h3>
                      )}
                      <div className="rounded-4xl overflow-hidden border border-outline-variant/10 bg-surface-container-low transform transition-transform duration-700">
                        <Image
                          src={imageSrc}
                          alt={block.title || "Image content"}
                          width={1600}
                          height={900}
                          unoptimized={isLocalBookCover(imageSrc)}
                          className="w-full h-auto block"
                          sizes="(max-width: 768px) 100vw, 1200px"
                        />
                      </div>
                      {block.caption && (
                        <p className="text-sm text-on-surface-variant font-medium text-center italic mt-2 opacity-80">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              }
              if (block.type === "pdf") {
                const documentSrc = block.url || block.content;
                if (!documentSrc) return null;

                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="my-12"
                  >
                    <OptimisticLink
                      href={`/${lang}/pdf-viewer?url=${encodeURIComponent(documentSrc)}&title=${encodeURIComponent(block.title || "Dokumen")}`}
                      className="flex items-center gap-6 p-8 rounded-4xl bg-surface-container-high border border-outline-variant/15 hover:bg-surface-container-highest transition-all duration-500 group active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-500">
                        <span className="material-symbols-outlined text-[32px]">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline font-bold text-xl text-primary truncate group-hover:text-secondary transition-colors">
                          {block.title || dict.post.viewPdf}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">verified_user</span>
                          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">{dict.post.protectedDocument}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <span className="material-symbols-outlined text-secondary">east</span>
                      </div>
                    </OptimisticLink>
                    {block.caption && (
                      <p className="text-sm text-on-surface-variant font-medium italic mt-6 border-l-2 border-secondary/20 pl-4">
                        {block.caption}
                      </p>
                    )}
                  </motion.div>
                );
              }
              if (block.type === "video") {
                const videoSrc = block.url || block.content;
                if (!videoSrc) return null;

                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="my-16"
                  >
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-red-600 text-[32px]">play_circle</span>
                        <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                          {block.title || dict.post.relatedVideo}
                        </h3>
                      </div>
                      <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-outline-variant/15 bg-black ring-1 ring-white/5">
                        <iframe
                          src={getEmbedUrl(videoSrc)}
                          className="w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        />
                      </div>
                      {block.caption && (
                        <p className="text-sm text-on-surface-variant font-medium italic text-center">
                          {block.caption}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              }
              if (block.type === "link") {
                if (!block.url) return null;

                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="my-12"
                  >
                    <a
                      href={block.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-6 p-8 rounded-4xl bg-surface-container-low border border-outline-variant/15 hover:bg-surface-container-high transition-all duration-500 group active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-on-primary transition-all duration-500">
                        <span className="material-symbols-outlined text-[32px]">link</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline font-bold text-xl text-primary truncate group-hover:text-secondary transition-colors">
                          {block.title || dict.post.relatedLink}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">language</span>
                          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest truncate">{block.url}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <span className="material-symbols-outlined text-secondary">east</span>
                      </div>
                    </a>
                    {block.caption && (
                      <p className="text-sm text-on-surface-variant font-medium italic mt-6 border-l-2 border-primary/20 pl-4">
                        {block.caption}
                      </p>
                    )}
                  </motion.div>
                );
              }
              if (block.type === "contact") {
                let cleanPhone = (block.content || "").replace(/\D/g, "");
                if (cleanPhone.startsWith("0")) {
                  cleanPhone = "62" + cleanPhone.slice(1);
                }
                const presetText = block.caption ? `?text=${encodeURIComponent(block.caption)}` : "";
                const waUrl = `https://wa.me/${cleanPhone}${presetText}`;

                return (
                  <motion.div
                    key={block.id}
                    initial={false}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="my-10 flex justify-center"
                  >
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      id={`contact-wa-${block.id}`}
                      className="group flex items-center gap-4 px-8 py-4 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20ba5a] hover:to-[#0f7569] text-white font-headline font-bold text-base md:text-lg shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/35 active:scale-95 transition-all duration-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        className="bi bi-whatsapp w-6 h-6 group-hover:rotate-12 transition-transform duration-300"
                        viewBox="0 0 16 16"
                      >
                        <path d="M13.601 2.326A7.85 7.85 0 0 0 8 0a7.86 7.86 0 0 0-6.68 11.753l-.525 1.917a.4.4 0 0 0 .51.51l1.916-.525A7.86 7.86 0 0 0 16 8a7.86 7.86 0 0 0-2.399-5.674zM10.56 10.695c-.138.38-.722.744-1.077.827-.3.069-.692.13-1.098-.1-.365-.206-.74-.413-1.129-.756-.995-.877-1.63-1.879-1.859-2.222c-.228-.343-.451-.798-.451-1.29 0-.491.258-.731.35-.83.093-.1.207-.15.31-.15.1.004.2.004.288.008.09.003.208-.035.327.245.122.287.418 1.018.455 1.09.036.073.06.158.01.258-.05.1-.077.164-.155.25-.077.09-.162.2-.23.275-.077.075-.158.158-.068.312.09.15.398.654.85 1.054.582.516 1.07.677 1.222.753.15.075.24.064.33-.034.09-.1.38-.443.483-.595.103-.15.207-.126.347-.075.14.05.888.419 1.04.495.152.075.253.11.291.176.038.065.038.379-.1.76z" />
                      </svg>
                      <span>{block.title || dict.post.whatsapp}</span>
                    </a>
                  </motion.div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center pt-12 border-t border-outline-variant/10"
        >
          <p className="font-label text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-6">{dict.post.articleEnd}</p>
          <ShareActions url={shareUrl} title={post.title} labels={shareLabels} className="mb-6" />
          <div className="flex flex-wrap justify-center gap-4">
            <OptimisticLink
              href={`/${lang}`}
              className="px-8 py-3 rounded-full bg-primary text-on-primary font-headline font-bold text-sm hover:translate-y-[-2px] hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {dict.post.home}
            </OptimisticLink>
            <OptimisticLink
              href={`/${lang}/explore`}
              className="px-8 py-3 rounded-full bg-surface-container-high text-primary font-headline font-bold text-sm hover:translate-y-[-2px] transition-all border border-outline-variant/20 active:scale-[0.98]"
            >
              {dict.post.catalog}
            </OptimisticLink>
          </div>
        </motion.div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-surface-container-low/30 py-24 border-t border-outline-variant/10 mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 text-center">
              <span className="font-label text-xs font-bold tracking-[0.2em] text-secondary uppercase">{dict.post.readAlso}</span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl mt-4 text-primary">{dict.post.relatedArchives}</h2>
            </div>

            <motion.div
              initial={false}
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {relatedPosts.map((rPost) => (
                <motion.div
                  key={rPost.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <OptimisticLink
                    href={`/${lang}/post/${rPost.slug}`}
                    className="group flex flex-col h-full bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10 hover:border-secondary/30 transition-all duration-500 hover:shadow-xl hover:shadow-secondary/5"
                  >
                    {rPost.thumbnail ? (
                      <div className="aspect-16/10 overflow-hidden relative">
                        <Image
                          fill
                          className="w-full h-full object-cover transition-transform duration-700"
                          alt={rPost.title}
                          src={rPost.thumbnail}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          unoptimized={isLocalBookCover(rPost.thumbnail)}
                        />
                      </div>
                    ) : (
                      <div className="h-1 bg-linear-to-r from-secondary to-primary mx-6 mt-6 rounded-full" />
                    )}
                    <div className="p-8 flex-1 flex flex-col">
                      <span className="text-secondary font-label text-[10px] font-bold tracking-widest uppercase mb-3 block opacity-80">
                        {getCategoryLabel(rPost.category, dict.explore.categories)}
                      </span>
                      <h3 className="font-headline font-bold text-lg text-primary mb-4 leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                        {rPost.title}
                      </h3>
                      <div className="mt-auto flex items-center text-secondary font-bold text-xs gap-2 group-hover:gap-3 transition-all pt-2 border-t border-outline-variant/10">
                        {dict.post.more}
                        <span className="material-symbols-outlined text-[16px]">east</span>
                      </div>
                    </div>
                  </OptimisticLink>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}
    </article>
  );
}
