import React from "react";

interface ViewToggleProps {
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
}

export default function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 flex items-center bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-neutral-200 p-1.5 rounded-full backdrop-blur-xl transition-all duration-300 transform hover:scale-105 active:scale-95">
      <button
        onClick={() => setViewMode("grid")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-xs font-bold uppercase tracking-[0.2em] relative overflow-hidden ${
          viewMode === "grid"
            ? "bg-zinc-900 text-white shadow-md"
            : "text-neutral-500 hover:text-black"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">view_agenda</span>
        Feed
      </button>

      <button
        onClick={() => setViewMode("map")}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-xs font-bold uppercase tracking-[0.2em] relative overflow-hidden ${
          viewMode === "map"
            ? "bg-zinc-900 text-white shadow-md"
            : "text-neutral-500 hover:text-black"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">map</span>
        Map
      </button>
    </div>
  );
}
