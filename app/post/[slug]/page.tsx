import { getPostBySlug, getPosts } from "@/lib/actions/post";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { SecurePDFViewer } from "@/components/SecurePDFViewer";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!post || (post.status !== "Published" && !isAdmin)) {
    return { title: "Post Not Found" };
  }

  return {
    title: `${post.title} | BRH Intellectual Platform`,
    description: post.blocks.find(b => b.type === 'text')?.content?.replace(/<[^>]*>/g, '').slice(0, 160) || `Baca selengkapnya tentang ${post.title}`,
    openGraph: {
      title: post.title,
      description: `Penelitian dan Artikel: ${post.title}`,
      images: post.thumbnail ? [post.thumbnail] : [],
    },
  };
}

export default async function SinglePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!post) {
    notFound();
  }

  // Fetch related posts (same category)
  const allPosts = await getPosts({ status: 'Published', category: post.category });
  const relatedPosts = (allPosts as any[]).filter((p: any) => p.id !== post.id).slice(0, 3);

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getReadingTime = (blocks: any[]) => {
    const text = blocks
      .filter(b => b.type === 'text')
      .map(b => b.content)
      .join(' ');
    const words = text.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 225)); // 225 wpm average
  };

  return (
    <article className="min-h-screen bg-surface-container-lowest">
      {/* Hero Section */}
      <header className="relative w-full overflow-hidden flex flex-col items-center justify-center min-h-[60vh] md:min-h-[75vh]">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          {post.thumbnail ? (
            <div className="relative h-full w-full overflow-hidden">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover blur-3xl scale-110"
              />
              <div className="absolute inset-0 bg-linear-to-t from-surface-container-lowest via-surface-container-lowest/20 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-b from-surface-container-lowest/10 to-transparent" />
            </div>
          ) : (
            <div className="h-full bg-surface-container-low flex flex-col items-center justify-center p-8 border-b border-outline-variant/10">
               <div className="absolute inset-0 -z-10 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-secondary-fixed blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-fixed blur-[120px] rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Content Header */}
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center py-20">
          <div className="flex flex-col items-center">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs font-bold font-label tracking-widest uppercase text-on-surface-variant hover:text-secondary transition-all mb-10 bg-surface-container-lowest/80 backdrop-blur-md px-5 py-2.5 rounded-full border border-outline-variant/10"
            >
              <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Kembali Ke Beranda
            </Link>
            
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="inline-block rounded-full bg-secondary text-on-secondary px-6 py-2 text-[10px] font-label font-bold tracking-[0.2em] uppercase">
                {post.category}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-headline font-extrabold text-primary leading-[1.1] mb-10 tracking-tight max-w-3xl mx-auto">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-6 text-on-surface-variant font-label text-[11px] uppercase tracking-[0.2em] font-bold">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] opacity-70">calendar_today</span>
                {formatDate(post.createdAt)}
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-outline-variant/30" />
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] opacity-70">schedule</span>
                {getReadingTime(post.blocks)} Menit Baca
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="bg-surface-container-lowest/50 backdrop-blur-3xl rounded-[2.5rem] p-4 md:p-6 mb-20">
          <div className="space-y-16">
            {post.blocks.map((block: any) => {
              if (block.type === "text") {
                return (
                  <div
                    key={block.id}
                    className="prose prose-lg md:prose-xl max-w-none text-on-surface leading-[1.8] font-serif
                      prose-headings:font-headline prose-headings:text-primary prose-headings:tracking-tight
                      prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8
                      prose-p:mb-8 prose-p:text-on-surface/90
                      prose-a:text-secondary prose-a:font-bold prose-a:no-underline hover:prose-a:underline
                      prose-strong:text-primary prose-strong:font-bold
                      prose-blockquote:border-l-4 prose-blockquote:border-secondary/30 prose-blockquote:bg-surface-container-low/30 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-blockquote:italic
                      prose-img:rounded-3xl"
                    dangerouslySetInnerHTML={{ __html: block.content || "" }}
                  />
                );
              }
              if (block.type === "image") {
                return (
                  <div key={block.id} className="relative group overflow-hidden">
                    <div className="flex flex-col gap-6">
                      {block.title && (
                        <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight text-center">{block.title}</h3>
                      )}
                      <div className="rounded-4xl overflow-hidden border border-outline-variant/10 bg-surface-container-low transform transition-transform duration-700 group-hover:scale-[1.01]">
                        <img
                          src={block.url || block.content}
                          alt={block.title || "Image content"}
                          className="w-full h-auto object-contain max-h-[800px]"
                        />
                      </div>
                      {block.caption && (
                        <p className="text-sm text-on-surface-variant font-medium text-center italic mt-2 opacity-80">
                           {block.caption}
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              if (block.type === "pdf") {
                return (
                  <div key={block.id} className="my-12">
                    <Link 
                      href={`/pdf-viewer?url=${encodeURIComponent(block.url || block.content)}&title=${encodeURIComponent(block.title || "Dokumen")}`}
                      className="flex items-center gap-6 p-8 rounded-4xl bg-surface-container-high border border-outline-variant/15 hover:bg-surface-container-highest transition-all duration-500 group active:scale-[0.98]"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-500">
                        <span className="material-symbols-outlined text-[32px]">description</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-headline font-bold text-xl text-primary truncate group-hover:text-secondary transition-colors">
                          {block.title || "Lihat Dokumen PDF"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">verified_user</span>
                          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Dokumen Terproteksi • Klik untuk Membaca</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <span className="material-symbols-outlined text-secondary">east</span>
                      </div>
                    </Link>
                    {block.caption && (
                      <p className="text-sm text-on-surface-variant font-medium italic mt-6 border-l-2 border-secondary/20 pl-4">
                         {block.caption}
                      </p>
                    )}
                  </div>
                );
              }
              if (block.type === "video") {
                return (
                  <div key={block.id} className="my-16">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-center gap-3">
                        <span className="material-symbols-outlined text-red-600 text-[32px]">play_circle</span>
                        <h3 className="text-2xl font-headline font-extrabold text-primary tracking-tight">
                          {block.title || "Video Terkait"}
                        </h3>
                      </div>
                      <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-outline-variant/15 bg-black ring-1 ring-white/5">
                        <iframe
                          src={getEmbedUrl(block.url || block.content)}
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
                  </div>
                );
              }
              if (block.type === "link") {
                return (
                  <div key={block.id} className="my-12">
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
                          {block.title || "Tautan Terkait"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">language</span>
                          <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest truncate">{block.url}</p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                        <span className="material-symbols-outlined text-secondary">open_in_new</span>
                      </div>
                    </a>
                    {block.caption && (
                      <p className="text-sm text-on-surface-variant font-medium italic mt-6 border-l-2 border-primary/20 pl-4">
                         {block.caption}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col items-center pt-12 border-t border-outline-variant/10">
          <p className="font-label text-xs font-bold tracking-[0.2em] uppercase text-on-surface-variant mb-6">Penutup Artikel</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/"
              className="px-8 py-3 rounded-full bg-primary text-on-primary font-headline font-bold text-sm hover:translate-y-[-2px] transition-all active:scale-[0.98]"
            >
              Beranda
            </Link>
            <Link 
              href="/katalog"
              className="px-8 py-3 rounded-full bg-surface-container-high text-primary font-headline font-bold text-sm hover:translate-y-[-2px] transition-all border border-outline-variant/20 active:scale-[0.98]"
            >
              Katalog Karya
            </Link>
          </div>
        </div>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-surface-container-low/30 py-24 border-t border-outline-variant/10 mt-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 text-center">
              <span className="font-label text-xs font-bold tracking-[0.2em] text-secondary uppercase">Baca Juga</span>
              <h2 className="font-headline font-bold text-3xl md:text-4xl mt-4 text-primary">Arsip Terkait Lainnya</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(relatedPosts as any[]).map((rPost: any) => (
                <Link
                  key={rPost.id}
                  href={`/post/${rPost.slug}`}
                  className="group bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/10 transition-all duration-500"
                >
                  {rPost.thumbnail ? (
                    <div className="aspect-16/10 overflow-hidden">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={rPost.title}
                        src={rPost.thumbnail}
                      />
                    </div>
                  ) : (
                    <div className="h-1 bg-linear-to-r from-secondary to-primary mx-6 mt-6 rounded-full" />
                  )}
                  <div className="p-8">
                    <span className="text-secondary font-label text-[10px] font-bold tracking-widest uppercase mb-3 block opacity-80">
                      {rPost.category}
                    </span>
                    <h3 className="font-headline font-bold text-lg text-primary mb-4 leading-snug group-hover:text-secondary transition-colors line-clamp-2">
                      {rPost.title}
                    </h3>
                    <div className="flex items-center text-secondary font-bold text-xs gap-2 group-hover:gap-3 transition-all pt-2 border-t border-outline-variant/10">
                      Selengkapnya
                      <span className="material-symbols-outlined text-[16px]">east</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
