"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import FeedPost from "@/components/FeedPost";
import FilterBar from "@/components/FilterBar";
import SidebarLeft from "@/components/SidebarLeft";
import SidebarRight from "@/components/SidebarRight";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import ViewToggle from "@/components/ViewToggle";
import MapView from "@/components/MapView";
import LocationBanner from "@/components/LocationBanner";
import { useSearch } from "@/context/SearchContext";
import { useLocation } from "@/context/LocationContext";
import { useGems } from "@/hooks/useGems";
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { useAuth } from "@/context/AuthContext";
import { Search, X, Navigation, Globe, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Wrapper with Suspense boundary (required by Next.js 16 for useSearchParams)
export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex w-full justify-center items-center min-h-screen">
        <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [feedMode, setFeedMode] = useState<"latest" | "nearme" | "following">("latest");
  const { query: searchQuery, setQuery } = useSearch();
  const { coords, permissionStatus, requestLocation } = useLocation();
  const { user } = useAuth();
  const searchParams = useSearchParams();

  // Sync URL ?search= param into context on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch && !searchQuery) setQuery(urlSearch);
  }, [searchParams]); // eslint-disable-line

  // Fetch gems — mode switches between recent and near-me
  const { gems: allGems, loading: gemsLoading, error: gemsError } = useGems(feedMode === "nearme");

  // Smart following feed (only actively queries when mode is 'following')
  const { gems: followingGems, loading: followingLoading, error: followingError } = useFollowingFeed();

  // Convenience aliases for the active mode
  const isNearMe    = feedMode === "nearme";
  const isFollowing = feedMode === "following";
  const loading     = isFollowing ? followingLoading : gemsLoading;
  const error       = isFollowing ? followingError   : gemsError;

  // Handle toggling Near Me: request location if not already granted
  const handleNearMeToggle = () => {
    if (feedMode !== "nearme") {
      if (permissionStatus === "denied") return;
      if (permissionStatus === "prompt" || !coords) {
        requestLocation();
      }
      setFeedMode("nearme");
      setQuery("");
    } else {
      setFeedMode("latest");
    }
  };

  // Client-side search filter (only in default mode)
  const gems = useMemo(() => {
    // In 'following' mode, use the affinity-sorted feed
    if (isFollowing) return followingGems;

    const q = searchQuery.trim().toLowerCase();
    if (!q || isNearMe) return allGems;
    return allGems.filter((post: any) => {
      const title  = (post.title       || "").toLowerCase();
      const desc   = (post.description || "").toLowerCase();
      const loc    = (post.locationName || post.location || "").toLowerCase();
      const type   = (post.type        || "").toLowerCase();
      const author = (post.authorName  || post.author?.name || "").toLowerCase();
      return title.includes(q) || loc.includes(q) || type.includes(q) || desc.includes(q) || author.includes(q);
    });
  }, [allGems, followingGems, searchQuery, isNearMe, isFollowing]);

  const clearSearch = () => setQuery("");

  return (
    <main className="flex w-full max-w-[1920px] mx-auto px-0 md:px-6 xl:px-8 py-4 md:py-8 justify-center gap-8 relative pb-24 md:pb-8">
      {/* ─── Left Sidebar ─────────────────────────── */}
      <SidebarLeft />

      {/* ─── Main Feed ───────────────────────────── */}
      <div className="flex-1 max-w-[600px] flex flex-col w-full px-4 md:px-0">

        <div className="md:hidden h-2" />

        {/* Location permission banner (only in non-near-me mode or if not granted) */}
        {!isNearMe && <LocationBanner />}

        {/* ── Near Me / Global toggle ───────────────── */}
        <div className="flex items-center gap-2 mb-3">
          <button
            id="feed-sort-recent"
            onClick={() => { setFeedMode("latest"); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              feedMode === "latest"
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-white/10 hover:border-primary/40"
            }`}
          >
            <Globe className="size-3.5" />
            Latest
          </button>

          <button
            id="feed-sort-nearme"
            onClick={handleNearMeToggle}
            disabled={permissionStatus === "denied"}
            title={permissionStatus === "denied" ? "Location access denied — enable in browser settings" : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
              feedMode === "nearme"
                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-300"
                : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-white/10 hover:border-emerald-400 hover:text-emerald-600"
            }`}
          >
            <Navigation className="size-3.5" />
            Near Me
            {isNearMe && coords && (
              <span className="text-[10px] font-bold opacity-80">· 50 km</span>
            )}
          </button>

          {/* Following feed toggle — only shows when logged in */}
          {user && (
            <button
              id="feed-sort-following"
              onClick={() => setFeedMode(feedMode === "following" ? "latest" : "following")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                feedMode === "following"
                  ? "bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-300"
                  : "bg-white dark:bg-neutral-900 text-neutral-500 border-neutral-200 dark:border-white/10 hover:border-violet-400 hover:text-violet-600"
              }`}
            >
              <Users className="size-3.5" />
              Following
            </button>
          )}




          {/* Awaiting location indicator */}
          <AnimatePresence>
            {isNearMe && !coords && permissionStatus !== "denied" && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-neutral-400 flex items-center gap-1"
              >
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Getting location…
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Active search banner */}
        {searchQuery && !isNearMe && (
          <div className="flex items-center justify-between gap-2 mb-3 px-1 py-2 bg-primary/5 border border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300 pl-2">
              <Search className="size-3.5 text-primary shrink-0" />
              <span>
                Showing results for{" "}
                <strong className="text-primary">"{searchQuery}"</strong>
                {" "}—{" "}
                <span className="text-neutral-400">{gems.length} gem{gems.length !== 1 ? "s" : ""}</span>
              </span>
            </div>
            <button
              onClick={clearSearch}
              className="shrink-0 mr-2 size-6 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 transition-colors"
            >
              <X className="size-3.5 text-neutral-500" />
            </button>
          </div>
        )}

        {/* Near Me active banner */}
        <AnimatePresence>
          {isNearMe && coords && gems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl"
            >
              <Navigation className="size-3.5 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                {gems.length} gem{gems.length !== 1 ? "s" : ""} within 50 km of your location
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Bar (only in default mode when not searching) */}
        {!searchQuery && feedMode === "latest" && <FilterBar />}

        {/* Following mode active banner */}
        <AnimatePresence>
          {isFollowing && gems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mb-3 flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl"
            >
              <Users className="size-3.5 text-violet-500 shrink-0" />
              <p className="text-xs text-violet-700 dark:text-violet-400 font-semibold">
                {gems.length} gem{gems.length !== 1 ? "s" : ""} from people you follow
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* View Toggle */}
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

        {/* MAP VIEW */}
        <div className={`w-full mt-4 ${viewMode === "map" ? "block animate-in fade-in" : "hidden"}`}>
          <MapView gems={gems} />
        </div>

        {/* GRID VIEW */}
        <div className={`flex flex-col gap-6 md:gap-10 pb-6 mt-4 ${viewMode === "grid" ? "block animate-in fade-in" : "hidden"}`}>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                {isNearMe && (
                  <p className="text-xs text-neutral-400 animate-pulse">
                    Scanning nearby gems…
                  </p>
                )}
              </div>
            </div>
          ) : gems.length > 0 ? (
            gems.map((post, index) => (
              <FeedPost
                key={post.id}
                post={post}
                isLast={index === gems.length - 1}
                distanceKm={isNearMe ? (post as any).distanceKm : undefined}
                authorAffinity={isFollowing ? (post as any).authorAffinity : undefined}
              />
            ))
          ) : (
            <div className="mt-8 border border-neutral-200 dark:border-white/10 rounded-3xl bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
              {isFollowing ? (
              <>
                <Users className="size-8 text-violet-300" />
                <p className="text-base font-bold text-neutral-500">Your following feed is empty</p>
                <p className="text-sm text-neutral-400">Follow travelers to see their gems here!</p>
                <button
                  onClick={() => setFeedMode("latest")}
                  className="mt-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold"
                >
                  Discover travelers
                </button>
              </>
            ) : isNearMe ? (
              <>
                <Navigation className="size-8 text-emerald-300" />
                <p className="text-base font-bold text-neutral-500">No hidden gems within 50 km</p>
                <p className="text-sm text-neutral-400">Be the first to post a gem in your area!</p>
                <button
                  onClick={() => setFeedMode("latest")}
                  className="mt-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold"
                >
                  Browse all gems
                </button>
              </>
              ) : searchQuery ? (
                <>
                  <Search className="size-8 text-neutral-300" />
                  <p className="text-base font-bold text-neutral-500">No gems match "{searchQuery}"</p>
                  <p className="text-sm text-neutral-400">Try a different search or browse a category.</p>
                  <button
                    onClick={clearSearch}
                    className="mt-2 px-5 py-2 rounded-full bg-primary text-white text-sm font-semibold"
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          )}
        </div>

        {/* Mobile Footer */}
        <div className="lg:hidden mt-4">
          <Footer />
        </div>
      </div>

      {/* ─── Right Sidebar ────────────────────────── */}
      <SidebarRight />
    </main>
  );
}
