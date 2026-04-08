"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearch } from "@/context/SearchContext";

interface BottomNavItem {
  label: string;
  icon: string;
  id: string;
  href: string;
  isSearch?: boolean;
}

const bottomNavItems: BottomNavItem[] = [
  { label: "Home", icon: "home", id: "home", href: "/" },
  { label: "Search", icon: "search", id: "search", href: "#", isSearch: true },
  { label: "Post", icon: "add_circle", id: "post", href: "/post" },
  { label: "Notifications", icon: "notifications", id: "notifications", href: "/notifications" },
  { label: "Profile", icon: "person", id: "profile", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { openOverlay } = useSearch();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-t border-slate-200 shadow-sm md:hidden bottom-nav-safe pb-4 pt-2 px-2"
      id="bottom-navigation"
    >
      <div className="flex items-center justify-around h-14">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href && !item.isSearch;
          const isPost = item.id === "post";

          const iconEl = isPost ? (
            <span className="material-symbols-outlined !text-[32px] text-white bg-secondary rounded-full p-2.5 shadow-xl shadow-secondary/30 transform hover:scale-105 transition-transform">
              {item.icon}
            </span>
          ) : (
            <span
              className={`material-symbols-outlined !text-[24px] transition-colors ${
                isActive ? "text-primary" : "text-slate-400"
              }`}
              style={isActive ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined}
            >
              {item.icon}
            </span>
          );

          const labelEl = !isPost && (
            <span
              className={`text-[10px] font-bold tracking-wide transition-colors ${
                isActive ? "text-primary" : "text-slate-400"
              }`}
            >
              {item.label}
            </span>
          );

          // Search opens overlay rather than navigating
          if (item.isSearch) {
            return (
              <button
                key={item.id}
                id={`bottom-nav-${item.id}`}
                onClick={openOverlay}
                className="flex flex-col items-center justify-center gap-1 transition-all active:scale-90 w-16"
              >
                {iconEl}
                {labelEl}
              </button>
            );
          }

          return (
            <Link
              href={item.href}
              key={item.id}
              id={`bottom-nav-${item.id}`}
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
                isPost ? "-translate-y-4" : "w-16"
              }`}
            >
              {iconEl}
              {labelEl}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
