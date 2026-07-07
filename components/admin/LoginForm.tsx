"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {state?.error && (
          <motion.div
            key={state.error}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              x: [0, -10, 10, -10, 10, 0],
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              x: { duration: 0.4, ease: "easeInOut" } // Use ease instead of spring for multi-keyframe x
            }}
            className="bg-error/10 text-error p-4 rounded-2xl text-sm font-medium text-center border border-error/20 backdrop-blur-sm shadow-sm"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xl">error</span>
              {state.error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form action={action} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2 group">
            <label 
              htmlFor="identifier" 
              className="block text-xs font-label font-bold tracking-widest uppercase text-secondary/70 group-focus-within:text-secondary transition-colors"
            >
              Email atau Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40 group-focus-within:text-secondary transition-colors">
                person
              </span>
              <input 
                type="text" 
                name="identifier" 
                id="identifier" 
                required 
                placeholder="admin / admin@brh.co.id" 
                className="h-14 font-body bg-surface-container-lowest border border-outline-variant/30 outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary rounded-2xl pl-12 pr-5 w-full text-on-surface placeholder:text-on-surface-variant/30 shadow-sm transition-all" 
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <label 
              htmlFor="password" 
              className="block text-xs font-label font-bold tracking-widest uppercase text-secondary/70 group-focus-within:text-secondary transition-colors"
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant/40 group-focus-within:text-secondary transition-colors">
                lock
              </span>
              <input 
                type="password" 
                name="password" 
                id="password" 
                required 
                placeholder="••••••••" 
                className="h-14 font-body bg-surface-container-lowest border border-outline-variant/30 outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary rounded-2xl pl-12 pr-5 w-full text-on-surface placeholder:text-on-surface-variant/30 shadow-sm transition-all" 
              />
            </div>
          </div>
        </div>

        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isPending}
          type="submit" 
          className={`
            w-full h-14 rounded-2xl font-headline font-bold text-base uppercase tracking-wider
            transition-all duration-300 relative overflow-hidden
            ${isPending 
              ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed" 
              : "bg-secondary text-on-secondary shadow-lg shadow-secondary/20 hover:shadow-xl hover:shadow-secondary/30 cursor-pointer"
            }
          `}
        >
          <AnimatePresence mode="wait">
            {isPending ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="w-5 h-5 border-2 border-on-surface-variant/30 border-t-on-surface-variant animate-spin rounded-full" />
                <span>Memproses...</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-center gap-2"
              >
                <span>Masuk</span>
                <span className="material-symbols-outlined text-xl">login</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </form>
    </div>
  );
}
