"use client";

import Footer from "./Footer";

export default function SidebarRight() {
  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 gap-6">
      {/* Placeholder - community widget */}
      <div className="p-5 md:p-6 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center opacity-50">
        <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">workspaces</span>
        <h3 className="text-sm font-bold mb-1">Your Space</h3>
        <p className="text-xs text-slate-400">Invite friends or wait for the community to grow.</p>
      </div>

      <Footer />
    </aside>
  );
}
