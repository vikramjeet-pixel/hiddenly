"use client";

import { useState } from "react";

interface BottomNavItem {
  label: string;
  icon: string;
  iconFilled: string;
  id: string;
}

const bottomNavItems: BottomNavItem[] = [
  { label: "Discover", icon: "explore", iconFilled: "explore", id: "discover" },
  { label: "Search", icon: "search", iconFilled: "search", id: "search" },
  { label: "Post", icon: "add_circle", iconFilled: "add_circle", id: "post" },
  {
    label: "Notifications",
    icon: "notifications",
    iconFilled: "notifications",
    id: "notifications",
  },
  { label: "Profile", icon: "person", iconFilled: "person", id: "profile" },
];

export default function BottomNav() {
  const [activeTab, setActiveTab] = useState("discover");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#221610]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden bottom-nav-safe"
      id="bottom-navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {bottomNavItems.map((item) => {
          const isActive = activeTab === item.id;
          const isPost = item.id === "post";

          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-all active:scale-90 ${
                isPost ? "" : ""
              }`}
            >
              {isPost ? (
                <span className="material-symbols-outlined !text-[28px] text-white bg-primary rounded-full p-1.5 shadow-lg shadow-primary/30">
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
                  className={`text-[10px] font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
