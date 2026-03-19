"use client";

import { useState } from "react";
import { navLinks } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import AuthButtons from "./AuthButtons";
import ProfileButton from "./ProfileButton";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#221610]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-3xl">database</span>
          <h1 className="text-xl md:text-2xl tracking-tight font-bold" style={{ fontFamily: "var(--font-serif)" }}>
            NomadSecret
          </h1>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-primary/20 text-sm outline-none"
              placeholder="Search destinations..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nav Links + Auth Logic */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                className="font-medium text-sm flex items-center gap-1 text-slate-500 hover:text-primary transition-colors"
                href={link.href}
              >
                <span className="material-symbols-outlined">{link.icon}</span>
                {link.label}
              </a>
            ))}
          </div>

          {/* Pure Functional Logic for Auth State */}
          <div className="shrink-0 flex items-center justify-center min-w-[80px]">
            {loading ? (
              <span className="text-sm text-neutral-500">Loading...</span>
            ) : !user ? (
              <AuthButtons />
            ) : (
              <ProfileButton user={user} />
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}
