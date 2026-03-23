'use client';

import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface CounterProps {
  value: number;
  direction?: 'up' | 'down';
}

function Counter({ value, direction = 'up' }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === 'down' ? value : 0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
  });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  useEffect(() => {
    springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Intl.NumberFormat("id-ID").format(
          Number(latest.toFixed(0))
        );
      }
    });
  }, [springValue]);

  return <span ref={ref} />;
}

export default function ImpactMetrics() {
  const metrics = [
    {
      label: 'Buku Diterbitkan',
      value: 12,
      suffix: '+',
      icon: 'menu_book',
    },
    {
      label: 'Jurnal Ilmiah',
      value: 58,
      suffix: '+',
      icon: 'description',
    },
    {
      label: 'Diskusi Publik',
      value: 120,
      suffix: '+',
      icon: 'forum',
    },
    {
      label: 'Tahun Kontribusi',
      value: 15,
      suffix: '+',
      icon: 'history_edu',
    },
  ];

  return (
    <section className="w-full py-24 bg-surface-container-lowest border-y border-outline-variant/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {metric.icon}
                </span>
              </div>
              <div className="font-headline font-black text-4xl md:text-5xl text-primary mb-2 tracking-tight flex items-center justify-center">
                <Counter value={metric.value} />
                <span className="text-secondary ml-1">{metric.suffix}</span>
              </div>
              <p className="font-label text-sm font-bold tracking-widest uppercase text-on-surface-variant/70">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
