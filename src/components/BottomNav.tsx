"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface BottomNavItem {
  label: string;
  icon: string;
  iconFilled: string;
  id: string;
  href: string;
}

const bottomNavItems: BottomNavItem[] = [
  { label: "Discover", icon: "explore", iconFilled: "explore", id: "discover", href: "/" },
  { label: "Search", icon: "search", iconFilled: "search", id: "search", href: "#" },
  { label: "Post", icon: "add_circle", iconFilled: "add_circle", id: "post", href: "/post" },
  {
    label: "Notifications",
    icon: "notifications",
    iconFilled: "notifications",
    id: "notifications",
    href: "#",
  },
  { label: "Profile", icon: "person", iconFilled: "person", id: "profile", href: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#221610]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden bottom-nav-safe pb-4 pt-2 px-2"
      id="bottom-navigation"
    >
      <div className="flex items-center justify-around h-14">
        {bottomNavItems.map((item) => {
          // Identify the current path against internal items
          // Ex: pathname == "/profile" matches item.href
          const isActive = pathname === item.href;
          const isPost = item.id === "post";

          return (
            <Link
              href={item.href}
              key={item.id}
              id={`bottom-nav-${item.id}`}
              className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
                isPost ? "-translate-y-4" : "w-16"
              }`}
            >
              {isPost ? (
                <span className="material-symbols-outlined !text-[32px] text-white bg-primary rounded-full p-2.5 shadow-xl shadow-primary/30 transform hover:scale-105 transition-transform">
                  {item.icon}
                </span>
              ) : (
                <span
                  className={`material-symbols-outlined !text-[24px] transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                  style={
                    isActive
                      ? {
                          fontVariationSettings:
                            "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
                        }
                      : undefined
                  }
                >
                  {isActive ? item.iconFilled : item.icon}
                </span>
              )}
              {!isPost && (
                <span
                  className={`text-[10px] font-bold tracking-wide transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
