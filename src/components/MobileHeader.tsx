"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useSearch } from "@/context/SearchContext";

export default function MobileHeader() {
  const { user } = useAuth();
  const { unreadCount } = useInAppNotifications();
  const { openOverlay } = useSearch();

  return (
    <header className="sticky top-0 z-50 bg-white backdrop-blur-md border-b border-slate-200 shadow-sm md:hidden">
      <div className="px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary !text-[26px]">database</span>
          <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
            Hiddenly
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search — opens overlay */}
          <button
            onClick={openOverlay}
            id="mobile-search-btn"
            className="text-slate-600 active:scale-90 transition-transform"
            aria-label="Open search"
          >
            <span className="material-symbols-outlined">search</span>
          </button>

          {/* Notification bell */}
          {user && (
            <Link
              href="/notifications"
              id="mobile-notif-btn"
              className="relative text-slate-600 active:scale-90 transition-transform"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none border-2 border-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Profile */}
          <Link
            href="/profile"
            className="size-8 rounded-full bg-primary/10 border border-slate-200 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-primary !text-lg">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
