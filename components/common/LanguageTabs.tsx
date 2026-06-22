"use client";

import { useState } from "react";
import type React from "react";
import type { LanguageCode } from "@/lib/brh-content";

interface LanguageTabsProps {
  languages: { code: LanguageCode; label: string }[];
  defaultLanguage?: LanguageCode;
  children: (language: LanguageCode) => React.ReactNode;
}

export default function LanguageTabs({
  languages,
  defaultLanguage = "id",
  children,
}: LanguageTabsProps) {
  const [activeLanguage, setActiveLanguage] = useState<LanguageCode>(defaultLanguage);

  return (
    <div className="space-y-8">
      <div className="inline-flex max-w-full overflow-x-auto rounded-full border border-outline-variant/70 bg-white/60 p-1 shadow-sm scrollbar-hide">
        {languages.map((language) => {
          const isActive = activeLanguage === language.code;

          return (
            <button
              key={language.code}
              type="button"
              onClick={() => setActiveLanguage(language.code)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-label font-bold transition-all ${
                isActive
                  ? "bg-primary text-on-primary shadow-md"
                  : "text-on-surface/60 hover:bg-secondary/10 hover:text-primary"
              }`}
              aria-pressed={isActive}
              dir={language.code === "ar" ? "rtl" : "ltr"}
            >
              {language.label}
            </button>
          );
        })}
      </div>

      {children(activeLanguage)}
    </div>
  );
}
