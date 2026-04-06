import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { getPosts } from '@/lib/actions/post';
import HomeHero from '@/components/home/HomeHero';

// Dynamically import components that are below the fold

const ScrollReveal = dynamic(() => import('@/components/home/ScrollReveal'), {
  ssr: true,
});

export default async function Home() {
  const allPosts = await getPosts({ status: 'Published' });
  const latestPosts = allPosts.slice(0, 4);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <HomeHero />


      {/* Content Section */}
      <section id="arsip" className="w-full px-6 md:px-12 lg:px-24 mx-auto py-32 bg-surface">
        <ScrollReveal className="mb-20">
          <span className="font-label text-xs font-bold tracking-[0.3em] text-secondary uppercase block mb-4">ARSIP INTELEKTUAL</span>
          <h2 className="font-headline font-black text-4xl md:text-5xl lg:text-6xl text-primary leading-tight tracking-tighter">
            Karya & <span className="text-secondary italic">Diskusi</span> Terbaru
          </h2>
          <div className="w-20 h-1.5 bg-secondary mt-8 rounded-full"></div>
        </ScrollReveal>

        {latestPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {latestPosts.map((post: any, index: number) => {
              // Extract snippet from first text block
              const firstTextBlock = post.blocks?.find((b: any) => b.type === 'text');
              const plainContent = firstTextBlock?.content ? firstTextBlock.content.replace(/<[^>]*>?/gm, '') : '';
              const snippet = plainContent
                ? plainContent.substring(0, 160) + (plainContent.length > 160 ? '...' : '')
                : '';

              return (
                <ScrollReveal key={post.id} delay={index * 0.1}>
                  <Link
                    href={`/post/${post.slug}`}
                    className="group relative flex flex-col sm:flex-row bg-surface-container-lowest rounded-[32px] overflow-hidden border border-outline-variant/15 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-700 hover:-translate-y-2 h-full"
                  >
                    {/* Info Area (Left) */}
                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-between order-2 sm:order-1 relative z-10">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <span className="w-2 h-2 rounded-full bg-secondary"></span>
                          <span className="text-on-surface-variant font-label text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="font-headline font-black text-2xl md:text-3xl text-primary mb-5 leading-[1.2] tracking-tight group-hover:text-secondary transition-colors duration-500">
                          {post.title}
                        </h3>
                        {snippet && (
                          <p className="text-on-surface-variant/70 text-base line-clamp-3 mb-8 font-body leading-relaxed group-hover:text-on-surface transition-colors duration-500">
                            {snippet}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-outline-variant/10">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/40">calendar_today</span>
                          <p className="text-on-surface-variant/60 text-xs font-bold tracking-tight">
                            {new Date(post.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="inline-flex items-center text-secondary font-black text-xs gap-2 group-hover:gap-4 transition-all duration-500 uppercase tracking-widest">
                          BACA SELENGKAPNYA
                          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">east</span>
                        </div>
                      </div>
                    </div>

                    {/* Thumbnail (Right) */}
                    <div className="w-full sm:w-48 md:w-64 lg:w-56 xl:w-72 aspect-square sm:aspect-auto shrink-0 relative overflow-hidden order-1 sm:order-2 text-primary font-black text-lg">
                      {post.thumbnail ? (
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out grayscale-20 group-hover:grayscale-0"
                          priority={index < 2} // Prioritize first two images for LCP
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-secondary/10 to-primary/15 flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary/30 text-6xl">menu_book</span>
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent group-hover:opacity-0 transition-opacity duration-500"></div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <ScrollReveal>
            <div className="text-center py-32 bg-surface-container-low rounded-[40px] border border-dashed border-outline-variant/30">
              <div className="inline-flex w-24 h-24 items-center justify-center rounded-full bg-surface-container-highest mb-8 text-on-surface-variant/20">
                <span className="material-symbols-outlined text-5xl">inventory_2</span>
              </div>
              <h3 className="text-2xl font-black text-primary mb-2 tracking-tight">Belum Ada Karya</h3>
              <p className="text-on-surface-variant/60 max-w-sm mx-auto">Kami sedang mempersiapkan konten intelektual terbaik untuk Anda.</p>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal delay={0.4} className="mt-20 text-center">
          <Link
            href="/explore"
            className="inline-flex items-center gap-4 px-10 py-5 bg-primary text-on-primary rounded-full font-headline font-bold text-lg hover:bg-secondary transition-all duration-500 hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-1"
          >
            Lihat Semua Karya
            <span className="material-symbols-outlined">grid_view</span>
          </Link>
        </ScrollReveal>
      </section>

      {/* Featured Quote / Philosophic Section */}
      <section className="w-full py-32 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        </div>
        <div className="max-w-5xl mx-auto px-8 text-center relative z-10">
          <ScrollReveal>
            <span className="material-symbols-outlined text-secondary text-7xl mb-12 opacity-50 italic">format_quote</span>
            <h2 className="font-headline font-black text-xl md:text-2xl lg:text-3xl text-on-primary leading-relaxed tracking-tight mb-12 italic">
              &quot;Penghancur kehidupanmu itu (seringkali) bukan orang lain tapi dirimu sendiri, karena pikiranmu sendiri. Jangan biarkan pikiranmu menjadi monster penghancur dengan kebiasaan berpikir negatif. Sebaliknya, jadikan ia superhero dengan kebiasaan berpikir positif dalam melihat & menyikapi keadaan bahkan yang terlihat dan terasa negatif sekalipun. Pikiran baik itu energi penarik kenyataan baik, sebaliknya, pikiran buruk merupakan energi penarik kenyataan buruk di kehidupanmu.&quot;
            </h2>
            <div className="flex flex-col items-center">
              <div className="h-1 w-20 bg-secondary mb-6"></div>
              <p className="font-label text-on-primary/60 tracking-[0.4em] uppercase font-bold text-sm">-BRH-</p>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
