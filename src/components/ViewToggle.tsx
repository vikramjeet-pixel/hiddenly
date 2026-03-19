import React from "react";

interface ViewToggleProps {
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
}

export default function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white/60 dark:bg-black/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-200/50 dark:border-white/10 p-1.5 rounded-full backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95">
      <button
        onClick={() => setViewMode("grid")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-xs font-bold uppercase tracking-[0.2em] relative overflow-hidden ${
          viewMode === "grid"
            ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
            : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">view_agenda</span>
        Feed
      </button>

      <button
        onClick={() => setViewMode("map")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-xs font-bold uppercase tracking-[0.2em] relative overflow-hidden ${
          viewMode === "map"
            ? "bg-black text-white dark:bg-white dark:text-black shadow-md"
            : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">map</span>
        Map
      </button>
    </div>
  );
}
