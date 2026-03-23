"use client";

import { motion } from "framer-motion";

export default function KatalogSkeleton() {
  return (
    <div className="w-full">
      <section className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 mb-32">
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex animate-pulse" />
            <div className="h-4 w-32 bg-surface-container rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {[1, 2, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/15 h-[200px] animate-pulse"
            >
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between order-2 sm:order-1">
                <div>
                  <div className="h-3 w-16 bg-surface-container rounded mb-3" />
                  <div className="h-5 w-full bg-surface-container rounded mb-2" />
                  <div className="h-5 w-2/3 bg-surface-container rounded" />
                </div>
                <div className="h-4 w-24 bg-surface-container rounded mt-auto" />
              </div>
              <div className="w-full sm:w-40 md:w-56 lg:w-48 aspect-square bg-surface-container order-1 sm:order-2" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
