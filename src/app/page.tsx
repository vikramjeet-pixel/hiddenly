"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

import StoryBar from "@/components/StoryBar";
import FeedPost from "@/components/FeedPost";
import FilterBar from "@/components/FilterBar";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import GemCard from "@/components/GemCard";

import {
  stories,
  trendingDestinations,
  suggestedTravelers,
  type FeedPost as FeedPostType,
} from "@/data/mockData";

export default function Home() {
  const [gems, setGems] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGems = async () => {
      setLoading(true);
      try {
        const gemsRef = collection(db, "gems");
        const q = query(gemsRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const fetchedGems = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as FeedPostType[];
          setGems(fetchedGems);
        } else {
          setGems([]);
        }
      } catch (error) {
        console.error("Error fetching gems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGems();
  }, []);

  return (
    <main className="flex w-full max-w-[1920px] mx-auto px-0 md:px-6 xl:px-8 py-4 md:py-8 justify-center gap-8 relative pb-24 md:pb-8">
      {/* ─── Left Sidebar (xl+) ─────────────────────── */}
      <SidebarLeft />

      {/* ─── Main Feed Area ─────────────────────────── */}
      <div className="flex-1 max-w-[600px] flex flex-col w-full px-4 md:px-0">
        
        {/* Mobile top spacer (nav is sticky) */}
        <div className="md:hidden h-2" />

        {/* Filter Bar */}
        <FilterBar />

        {/* Story Bar */}
        <StoryBar stories={stories} />

        {/* ── Mobile: Trending Destinations section ────── */}
        <section className="lg:hidden mb-6">
          <h3 className="text-sm font-bold mb-3">Trending Destinations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {trendingDestinations.map((gem) => (
              <GemCard key={gem.id} gem={gem} />
            ))}
          </div>
        </section>

        {/* ── Mobile: Suggested Travelers ─────────────── */}
        <section className="lg:hidden mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">Suggested Travelers</h3>
            <button className="text-xs text-primary font-semibold">See All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {suggestedTravelers.map((traveler) => (
              <div
                key={traveler.id}
                className="flex flex-col items-center gap-2 shrink-0 w-20"
              >
                <div className="size-14 rounded-full bg-slate-200 overflow-hidden relative">
                  <Image
                    src={traveler.avatarUrl}
                    alt={traveler.avatarAlt}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <p className="text-[11px] font-semibold text-center truncate w-full">
                  {traveler.name}
                </p>
                <button className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-3 py-0.5 active:scale-95 transition-transform">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Dynamic Feed Posts or Empty State ──────────────────────────────── */}
        <div className="flex flex-col gap-6 md:gap-10 pb-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : gems.length > 0 ? (
            gems.map((post, index) => (
              <FeedPost
                key={post.id}
                post={post}
                isLast={index === gems.length - 1}
              />
            ))
          ) : (
            <div className="mt-8 border border-neutral-200 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md">
              <EmptyState />
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden mt-4">
          <Footer />
        </div>
      </div>

      {/* ─── Right Sidebar (lg+) ────────────────────── */}
      <SidebarRight />
    </main>
  );
}
