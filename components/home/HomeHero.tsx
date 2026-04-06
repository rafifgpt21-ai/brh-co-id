'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import HeroSearch from '@/components/HeroSearch';
import { ReactNode } from 'react';

export default function HomeHero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as any
      }
    },
  };

  return (
    <motion.section 
      variants={container}
      initial="hidden"
      animate="show"
      className="relative min-h-[85vh] flex flex-col items-center justify-center px-8 text-center overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10 opacity-40 pointer-events-none">
        <motion.div 
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-secondary-fixed/20 blur-[130px] rounded-full"
        ></motion.div>
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-primary-fixed/20 blur-[130px] rounded-full"
        ></motion.div>
      </div>


      {/* Main Typography */}
      <motion.h1 
        variants={item}
        className="font-headline font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter text-primary leading-[1.05] mb-8 max-w-6xl"
      >
        Menyemai Pemikiran,<br />
        <span className="text-secondary italic">Menggerakkan</span> Perubahan
      </motion.h1>

      {/* Search Bar Area */}
      <motion.div variants={item} className="w-full max-w-2xl px-4">
        <HeroSearch />
      </motion.div>

      {/* Primary CTA */}
      <motion.div variants={item} className="mt-16">
        <Link href="#arsip" className="group flex flex-col items-center gap-4 font-headline font-bold text-lg tracking-tight text-primary hover:text-secondary transition-all duration-500">
          <span className="opacity-60 text-sm tracking-[0.3em] font-label mb-2 group-hover:opacity-100 transition-opacity">EKSPRESI INTELEKTUAL</span>
          <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:border-secondary transition-colors group-hover:bg-secondary/5">
             <span className="material-symbols-outlined group-hover:translate-y-1 transition-transform animate-bounce">south</span>
          </div>
        </Link>
      </motion.div>
    </motion.section>
  );
}
