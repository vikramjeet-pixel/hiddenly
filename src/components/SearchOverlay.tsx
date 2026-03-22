"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Clock, TrendingUp, MapPin, Tag, Sparkles } from "lucide-react";
import Image from "next/image";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearch } from "@/context/SearchContext";

// ── Constants ─────────────────────────────────────────────────

const TRENDING_LOCATIONS = [
  { label: "Iceland", icon: "🧊" },
  { label: "Kyoto", icon: "⛩️" },
  { label: "Bali", icon: "🌴" },
  { label: "Patagonia", icon: "🏔️" },
  { label: "Morocco", icon: "🕌" },
  { label: "Santorini", icon: "🇬🇷" },
  { label: "Machu Picchu", icon: "🦙" },
  { label: "Maldives", icon: "🐠" },
];

const CATEGORIES = [
  { label: "Nature", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { label: "Urban", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { label: "Culinary", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { label: "Secret Stay", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  { label: "Beach", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { label: "Mountain", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
];

// ── Types ─────────────────────────────────────────────────────

interface GemResult {
  id: string;
  title: string;
  locationName?: string;
  type?: string;
  media?: string[];
  authorName?: string;
}

// ── Debounce hook ─────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Sub-components ─────────────────────────────────────────────

function Chip({
  label,
  prefix,
  onClick,
  colorClass,
}: {
  label: string;
  prefix?: string;
  onClick: () => void;
  colorClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 hover:scale-105
        ${colorClass ?? "bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/20"}`}
    >
      {prefix && <span>{prefix}</span>}
      {label}
    </button>
  );
}

function ResultRow({ gem, onSelect }: { gem: GemResult; onSelect: (gem: GemResult) => void }) {
  const thumb = gem.media?.[0];
  return (
    <button
      onClick={() => onSelect(gem)}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-xl transition-colors text-left group"
    >
      {/* Thumbnail */}
      <div className="shrink-0 size-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative">
        {thumb ? (
          <Image src={thumb} alt={gem.title} fill sizes="48px" className="object-cover" />
        ) : (
          <div className="size-full flex items-center justify-center">
            <MapPin className="size-5 text-neutral-400" />
          </div>
        )}
      </div>
      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-primary transition-colors">
          {gem.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {gem.locationName && (
            <span className="text-[11px] text-neutral-400 truncate">{gem.locationName}</span>
          )}
          {gem.type && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 bg-primary/10 text-primary rounded-full">
              {gem.type}
            </span>
          )}
        </div>
      </div>
      <span className="material-symbols-outlined text-neutral-300 group-hover:text-primary transition-colors !text-base shrink-0">
        north_west
      </span>
    </button>
  );
}

// ── Main Overlay ───────────────────────────────────────────────

export default function SearchOverlay() {
  const router = useRouter();
  const { isOverlayOpen, closeOverlay, query: ctxQuery, setQuery, addRecentSearch, recentSearches, clearRecentSearches } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState(ctxQuery);
  const [results, setResults] = useState<GemResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debouncedQuery = useDebounce(localQuery, 320);

  // Auto-focus input when overlay opens
  useEffect(() => {
    if (isOverlayOpen) {
      setLocalQuery(ctxQuery);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOverlayOpen, ctxQuery]);

  // Live Firestore search
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setSearching(true);
      try {
        const gemsRef = collection(db, "gems");
        const results: GemResult[] = [];
        const seenIds = new Set<string>();

        // 1. Category/type exact match
        const categoryQ = query(gemsRef, where("type", "==", q), limit(5));
        const catSnap = await getDocs(categoryQ);
        catSnap.docs.forEach((d) => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            results.push({ id: d.id, ...(d.data() as Omit<GemResult, "id">) });
          }
        });

        // 2. Title prefix search (Firestore range trick)
        const lower = q.toLowerCase();
        const upper = lower.replace(/.$/, (c) => String.fromCharCode(c.charCodeAt(0) + 1));
        const titleQ = query(
          gemsRef,
          orderBy("title"),
          where("title", ">=", q),
          where("title", "<", upper),
          limit(8)
        );
        const titleSnap = await getDocs(titleQ);
        titleSnap.docs.forEach((d) => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            results.push({ id: d.id, ...(d.data() as Omit<GemResult, "id">) });
          }
        });

        // 3. Location prefix search
        const locQ = query(
          gemsRef,
          orderBy("locationName"),
          where("locationName", ">=", q),
          where("locationName", "<", upper),
          limit(5)
        );
        const locSnap = await getDocs(locQ);
        locSnap.docs.forEach((d) => {
          if (!seenIds.has(d.id)) {
            seenIds.add(d.id);
            results.push({ id: d.id, ...(d.data() as Omit<GemResult, "id">) });
          }
        });

        setResults(results.slice(0, 10));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const commitSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      addRecentSearch(trimmed);
      setQuery(trimmed);
      closeOverlay();
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    },
    [addRecentSearch, setQuery, closeOverlay, router]
  );

  const handleGemSelect = useCallback(
    (gem: GemResult) => {
      addRecentSearch(gem.title);
      closeOverlay();
      router.push(`/?search=${encodeURIComponent(gem.title)}`);
    },
    [addRecentSearch, closeOverlay, router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitSearch(localQuery);
    if (e.key === "Escape") closeOverlay();
  };

  if (!isOverlayOpen) return null;

  const showEmpty = !localQuery.trim();
  const showResults = !showEmpty && results.length > 0;
  const showNoResults = !showEmpty && !searching && results.length === 0;

  return (
    <AnimatePresence>
      <motion.div
        key="search-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[200] flex flex-col"
        onClick={(e) => e.target === e.currentTarget && closeOverlay()}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeOverlay} />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 w-full max-w-2xl mx-auto mt-4 md:mt-16 px-4"
        >
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden">
            
            {/* ── Search Input ─────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-100 dark:border-white/5">
              <Search className="size-5 shrink-0 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search gems, places, categories…"
                className="flex-1 bg-transparent text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none"
              />
              {localQuery && (
                <button
                  onClick={() => setLocalQuery("")}
                  className="size-6 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-white/10 text-neutral-500 hover:bg-neutral-300 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
              <button
                onClick={closeOverlay}
                className="text-sm font-semibold text-primary hover:text-primary/70 transition-colors ml-1"
              >
                Cancel
              </button>
            </div>

            {/* ── Content Area ─────────────────────── */}
            <div className="max-h-[70vh] overflow-y-auto p-4 flex flex-col gap-5">

              {/* Live search results */}
              {searching && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 py-2 px-2">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Searching…
                </div>
              )}

              {showResults && (
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-2 mb-1">
                    Results
                  </p>
                  {results.map((gem) => (
                    <ResultRow key={gem.id} gem={gem} onSelect={handleGemSelect} />
                  ))}
                  <button
                    onClick={() => commitSearch(localQuery)}
                    className="mt-1 mx-2 flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/70 transition-colors"
                  >
                    <Search className="size-3.5" />
                    See all results for "{localQuery}"
                  </button>
                </div>
              )}

              {showNoResults && (
                <div className="text-center py-4 text-neutral-400">
                  <Sparkles className="size-6 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No gems found for "<strong>{localQuery}</strong>"</p>
                  <p className="text-xs mt-1">Try a category like "Nature" or a city name.</p>
                </div>
              )}

              {/* ── Recent Searches ──────────────────── */}
              {showEmpty && recentSearches.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      <Clock className="size-3" />
                      Recent
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] text-neutral-400 hover:text-rose-500 transition-colors font-semibold"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s) => (
                      <Chip key={s} label={s} onClick={() => commitSearch(s)} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Categories ───────────────────────── */}
              {showEmpty && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1">
                    <Tag className="size-3" />
                    Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <Chip
                        key={c.label}
                        label={c.label}
                        onClick={() => commitSearch(c.label)}
                        colorClass={c.color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Trending Destinations ─────────────── */}
              {showEmpty && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1">
                    <TrendingUp className="size-3" />
                    Trending Destinations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_LOCATIONS.map((t) => (
                      <Chip
                        key={t.label}
                        label={t.label}
                        prefix={t.icon}
                        onClick={() => commitSearch(t.label)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
