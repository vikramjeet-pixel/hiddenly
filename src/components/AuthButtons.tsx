import Link from "next/link";
import React from "react";

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3 animate-in fade-in duration-300">
      <Link
        href="/login"
        className="text-xs font-bold uppercase tracking-widest text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 px-4 py-2 rounded-full transition-all"
      >
        Log In
      </Link>
      <Link
        href="/signup"
        className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-primary-hover active:scale-95 shadow-md shadow-primary/20 transition-all"
      >
        Sign Up
      </Link>
    </div>
  );
}
