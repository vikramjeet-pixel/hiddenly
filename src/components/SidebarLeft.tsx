import Image from "next/image";
import { feedLinks, pinnedTrips } from "@/data/mockData";

export default function SidebarLeft() {
  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 gap-8">
      {/* Your Feed */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Your Feed
        </h3>
        <div className="flex flex-col gap-1">
          {feedLinks.map((link) => (
            <a
              key={link.label}
              id={`sidebar-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all ${
                link.isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span className="material-symbols-outlined">{link.icon}</span>
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Pinned Trips */}
      <div className="flex flex-col gap-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Pinned Trips
        </h3>
        <div className="flex flex-col gap-3">
          {pinnedTrips.map((trip) => (
            <div
              key={trip.id}
              id={`pinned-trip-${trip.id}`}
              className="flex items-center gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-1 -m-1 transition-colors"
            >
              <div className="size-10 rounded-lg bg-slate-200 dark:bg-slate-800 overflow-hidden relative shrink-0">
                <Image
                  src={trip.imageUrl}
                  alt={trip.imageAlt}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold">{trip.title}</p>
                <p className="text-xs text-slate-400">{trip.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
