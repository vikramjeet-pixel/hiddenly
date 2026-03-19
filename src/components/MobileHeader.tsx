"use client";

import { useState } from "react";
import Image from "next/image";

export default function MobileHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 md:hidden">
      <div className="px-4 h-14 flex items-center justify-between">
        {searchOpen ? (
          /* Search Mode */
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="shrink-0 text-slate-500 active:scale-90 transition-transform"
              aria-label="Close search"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 !text-[18px]">
                search
              </span>
              <input
                id="mobile-search-input"
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-9 pr-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none"
                placeholder="Search destinations..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        ) : (
          /* Default Mode */
          <>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary !text-[26px]">
                database
              </span>
              <h1
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                NomadSecret
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="text-slate-600 dark:text-slate-400 active:scale-90 transition-transform"
                aria-label="Open search"
              >
                <span className="material-symbols-outlined">search</span>
              </button>
              <button
                className="text-slate-600 dark:text-slate-400 active:scale-90 transition-transform relative"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-0 right-0 size-2 bg-primary rounded-full border-2 border-white dark:border-[#221610]" />
              </button>
              <div className="size-8 rounded-full bg-primary/10 overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaHYzbUtBCwUtW-fZ0YMPTz2sjfcUOo42f1IKR9jX6bX7UltHRtA1gzRb_oUkFuBgMWLWiLd3VESG3MePx1a010SwJP_NvPC3T6R1f_9w4-2gMJD0qCCR_mm__-W_5OuPRQreVeXy3eJvjT38ABEj5nPbGVZj3-4hBPzExEiQ0jBXpoUaBTON_ZQQajXMgMZOTKvQfK3ocGRwfTc1CkbXanxph_yFfCTBWA7VD0NLpKGj4tEhojjC54H8X5jGG4J8jfHicCVJNg_U"
                  alt="Profile"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
