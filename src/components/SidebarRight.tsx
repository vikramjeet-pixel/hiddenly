import Image from "next/image";
import GemCard from "./GemCard";
import Footer from "./Footer";
import { suggestedTravelers, trendingDestinations } from "@/data/mockData";

export default function SidebarRight() {
  return (
    <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 gap-8">
      {/* Suggested Travelers */}
      <div
        id="suggested-travelers"
        className="p-5 md:p-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800"
      >
        <h3 className="text-sm font-bold mb-5 md:mb-6">Suggested Travelers</h3>
        <div className="flex flex-col gap-4 md:gap-5">
          {suggestedTravelers.map((traveler) => (
            <div
              key={traveler.id}
              id={`suggested-${traveler.id}`}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
                  <Image
                    src={traveler.avatarUrl}
                    alt={traveler.avatarAlt}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold">{traveler.name}</p>
                  <p className="text-xs text-slate-400">{traveler.subtitle}</p>
                </div>
              </div>
              <button className="text-xs font-bold text-primary hover:underline active:scale-95 transition-transform">
                Follow
              </button>
            </div>
          ))}
        </div>
        <button className="w-full mt-5 md:mt-6 text-xs text-slate-400 font-medium hover:text-slate-600 transition-colors">
          See more suggestions
        </button>
      </div>

      {/* Trending Destinations (GemCard Grid) */}
      <div id="trending-destinations" className="p-5 md:p-6">
        <h3 className="text-sm font-bold mb-5 md:mb-6">
          Trending Destinations
        </h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {trendingDestinations.map((gem) => (
            <GemCard key={gem.id} gem={gem} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </aside>
  );
}
