"use client";

import Image from "next/image";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import React from "react";
import { useParams } from "next/navigation";
import LanguageTabs from "@/components/common/LanguageTabs";
import {
  about,
  languages,
  type LanguageCode,
} from "@/lib/brh-content";

const expertise = [
  "Spiritualitas & Tasawuf",
  "Kesejahteraan & Pembangunan Sosial",
  "Komunikasi & Penulisan",
  "Kajian Peradaban",
  "Pendidikan Karakter",
];

const EducationItem = ({
  degree,
  institution,
  location,
  scholarship,
}: {
  degree: string;
  institution: string;
  location?: string;
  scholarship?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="relative border-l border-gray-200 pb-8 pl-8 last:border-0 last:pb-0"
  >
    <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary" />
    <h3 className="font-headline text-lg font-bold text-primary">{degree}</h3>
    <p className="mt-1 font-body text-on-surface/80">{institution}</p>
    {location && <p className="font-body text-xs text-on-surface/60">{location}</p>}
    {scholarship && (
      <p className="mt-2 font-label text-[10px] font-bold uppercase tracking-wider text-secondary">
        {scholarship}
      </p>
    )}
  </motion.div>
);

const RoleItem = ({
  role,
  organization,
  years,
}: {
  role: string;
  organization: string;
  years?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="group flex flex-col gap-1 md:flex-row md:items-baseline md:gap-4"
  >
    <span className="min-w-[120px] shrink-0 font-label text-xs uppercase tracking-widest text-on-surface/40">
      {years || "Sekarang"}
    </span>
    <div className="flex-1">
      <h3 className="font-headline font-bold text-primary transition-colors group-hover:text-secondary">
        {role}
      </h3>
      <p className="font-body text-sm text-on-surface/70">{organization}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ num, title }: { num: string; title: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    className="mb-8 flex items-baseline gap-4"
  >
    <span className="font-label text-4xl font-black text-secondary/20">{num}</span>
    <h2 className="font-headline text-4xl font-black tracking-tight text-primary">{title}</h2>
  </motion.div>
);

const ProfileCopy = ({ language }: { language: LanguageCode }) => {
  const isArabic = language === "ar";

  return (
    <motion.div
      key={language}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`prose prose-lg max-w-none font-body leading-relaxed text-on-surface/80 ${
        isArabic ? "text-right prose-p:leading-loose" : ""
      }`}
      dir={isArabic ? "rtl" : "ltr"}
    >
      {about[language].map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </motion.div>
  );
};

export default function BiografiPage() {
  const params = useParams<{ lang?: string }>();
  const defaultLanguage: LanguageCode = params.lang === "en" ? "en" : "id";
  const [isMobile, setIsMobile] = React.useState(false);
  const { scrollY } = useScroll();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const scrollSpring = useSpring(scrollY, {
    stiffness: 50,
    damping: 20,
  });

  const inertiaY = useTransform(scrollSpring, (spring) => (spring - scrollY.get()) * 0.15);
  const driftY = useTransform(scrollY, [0, 5000], [0, 100]);
  const combinedY = useTransform(
    [inertiaY, driftY],
    ([inertia, drift]) => (inertia as number) + (drift as number),
  );
  const finalY = useTransform(combinedY, (v) => (isMobile ? 0 : v));

  return (
    <div className="min-h-screen bg-background pb-24">
      <section className="relative overflow-hidden px-6 pb-24 pt-12 md:px-12 lg:px-24">
        <div className="relative z-10 flex flex-col items-center gap-12 md:flex-row lg:gap-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="group relative"
          >
            <div className="absolute -inset-4 rounded-full bg-secondary/10 blur-2xl transition-all duration-700 group-hover:bg-secondary/20" />
            <div className="relative h-64 w-64 overflow-hidden rounded-full border-8 border-white shadow-2xl md:h-80 md:w-80">
              <Image
                src="https://m0mix0w8bt.ufs.sh/f/4o6HWCjH0s2p2jj5eDVxAgZRPYzqB35sNO14E8GcidS0MeDF"
                alt="Budi Rahman Hakim"
                fill
                priority
                sizes="(max-width: 768px) 256px, 320px"
                className="scale-105 object-cover grayscale transition-all duration-700 group-hover:scale-100 group-hover:grayscale-0"
              />
            </div>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-6 font-headline text-5xl font-black leading-none tracking-tighter text-primary md:text-7xl"
            >
              Budi Rahman <span className="text-secondary">Hakim</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mx-auto max-w-2xl font-body text-xl font-light italic leading-relaxed text-on-surface/70 md:mx-0 md:text-2xl"
            >
              &quot;Merintis jalan tengah antara dzikir dan pikir, antara spiritualitas dan transformasi sosial.&quot;
            </motion.p>
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.6 },
                },
              }}
              className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start"
            >
              {expertise.map((skill) => (
                <motion.span
                  key={skill}
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    show: { opacity: 1, scale: 1 },
                  }}
                  className="rounded-full border border-secondary/10 bg-secondary/5 px-4 py-2 font-label text-[10px] font-bold uppercase tracking-wider text-secondary"
                >
                  {skill}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-16 px-6 md:px-12 lg:grid-cols-12 lg:px-24">
        <aside className="relative h-full lg:col-span-4">
          <motion.div
            style={{ y: finalY }}
            className="z-20 rounded-3xl border border-secondary/20 bg-secondary-container/30 p-8 shadow-2xl shadow-secondary/5 backdrop-blur-xl lg:sticky lg:top-32"
          >
            <h2 className="mb-8 font-headline text-2xl font-black tracking-tight text-primary">
              Kontak & Info
            </h2>
            <div className="space-y-6">
              <a href="mailto:budi.rahman@uinjkt.ac.id" className="group flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary shadow-sm transition-all group-hover:bg-secondary group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">mail</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                    Email
                  </p>
                  <p className="font-body text-sm font-medium">budi.rahman@uinjkt.ac.id</p>
                </div>
              </a>
              <a href="https://www.brh.co.id" className="group flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary shadow-sm transition-all group-hover:bg-secondary group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">language</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                    Situs Web
                  </p>
                  <p className="font-body text-sm font-medium">www.brh.co.id</p>
                </div>
              </a>
              <div className="group flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-secondary shadow-sm transition-all group-hover:bg-secondary group-hover:text-white">
                  <span className="material-symbols-outlined text-lg">location_on</span>
                </div>
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface/40">
                    Lokasi
                  </p>
                  <p className="font-body text-sm font-medium">Tangerang Selatan, Indonesia</p>
                </div>
              </div>
            </div>

            <div className="mt-12 border-t border-secondary/10 pt-8">
              <p className="font-body text-sm leading-relaxed text-on-surface/60">
                Akademisi, penulis, jurnalis senior, dan pembina spiritual yang menjembatani tradisi pesantren, tasawuf, ilmu sosial modern, dan pembangunan peradaban.
              </p>
            </div>
          </motion.div>
        </aside>

        <main className="space-y-24 lg:col-span-8">
          <section>
            <SectionHeader num="01" title="Profil Profesional" />
            <LanguageTabs languages={languages} defaultLanguage={defaultLanguage}>
              {(language) => <ProfileCopy language={language} />}
            </LanguageTabs>
          </section>

          <section>
            <SectionHeader num="02" title="Pendidikan" />
            <div className="mt-8 space-y-0">
              <EducationItem
                degree="Doctor of Philosophy (Ph.D.)"
                institution="Tilburg University School of Humanities and Digital Science, Belanda"
                scholarship="MORA Scholarship"
              />
              <EducationItem
                degree="Master of Social Work (M.S.W.)"
                institution="McGill University School of Social Work, Montreal, Kanada"
                scholarship="CIDA Scholarship"
              />
              <EducationItem
                degree="Bachelor of Social Work (B.S.W.)"
                institution="McGill University School of Social Work, Montreal, Kanada"
                location="Kajian Sosial Tradisional"
                scholarship="CIDA Scholarship"
              />
              <EducationItem
                degree="Sarjana Agama (S.Ag.)"
                institution="UIN Syarif Hidayatullah Jakarta"
                location="Jurusan Komunikasi & Penyiaran Islam"
                scholarship="MORA Scholarship"
              />
            </div>
          </section>

          <section>
            <SectionHeader num="03" title="Kiprah & Pengalaman" />
            <div className="space-y-10">
              <RoleItem role="Dosen Tetap" organization="UIN Syarif Hidayatullah Jakarta" />
              <RoleItem role="Pendiri & Pengasuh" organization="Pesantren Peradaban Dunia JAGAT 'ARSY" />
              <RoleItem role="Penasehat Keruhanian" organization="Keraton Kacirebonan & Sumedang Larang" years="2021-Sekarang" />
              <RoleItem role="Ketua Penasehat" organization="Zawiyah Pusat Roudloh TQN Suryalaya Sirnarasa" years="2019-Sekarang" />
              <RoleItem role="Staf Khusus" organization="Menteri Negara BUMN" years="2010-2014" />
              <RoleItem role="Konsultan Komunikasi Politik" organization="Presiden Republik Indonesia" years="2009" />
              <RoleItem role="Wartawan Senior" organization="Rakyat Merdeka Media Group" />
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}
