import Link from "next/link";
import React from "react";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-[60vh] text-center px-6">
      <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-4xl text-primary">
          travel_explore
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-foreground mb-4" style={{ fontFamily: "var(--font-serif)" }}>
        The world is waiting.
      </h1>

      <p className="text-sm tracking-[0.1em] text-neutral-500 uppercase font-medium max-w-sm mb-10">
        Be the first to share a hidden gem and kickstart the discovery engine.
      </p>

      <Link
        href="/post"
        className="bg-primary text-primary-foreground rounded-full py-4 px-8 font-bold text-xs uppercase tracking-widest hover:bg-primary-hover active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">add_location</span>
        Share Your First Gem
      </Link>
    </div>
  );
}
