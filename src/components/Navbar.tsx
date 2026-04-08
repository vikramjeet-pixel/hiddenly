"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { navLinks } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import AuthButtons from "./AuthButtons";
import ProfileButton from "./ProfileButton";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useSearch } from "@/context/SearchContext";

export default function Navbar() {
  const { user, loading } = useAuth();
  const { unreadCount } = useInAppNotifications();
  const { openOverlay, query } = useSearch();

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-md border-b border-slate-200 shadow-sm hidden md:block">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined text-primary text-3xl">database</span>
          <h1 className="text-xl md:text-2xl tracking-tight font-bold" style={{ fontFamily: "var(--font-serif)" }}>
            Hiddenly
          </h1>
        </div>

        {/* Search trigger — opens overlay */}
        <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
          <button
            onClick={openOverlay}
            id="desktop-search-btn"
            className="w-full flex items-center gap-2 bg-slate-100 rounded-full py-2 pl-4 pr-4 text-sm text-neutral-400 hover:bg-slate-200 transition-colors text-left"
          >
            <Search className="size-4 shrink-0" />
            <span className="flex-1 truncate">{query || "Search destinations…"}</span>
          </button>
        </div>

        {/* Nav Links + Auth */}
        <div className="flex items-center gap-4 lg:gap-6">
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

          {/* Notification bell */}
          {user && (
            <Link
              href="/notifications"
              id="desktop-notif-btn"
              className="relative text-slate-500 hover:text-primary transition-colors"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth */}
          <div className="shrink-0 flex items-center justify-center min-w-[80px]">
            {loading ? (
              <span className="text-sm text-neutral-500">Loading…</span>
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
