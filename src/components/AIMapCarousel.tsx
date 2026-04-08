"use client";

/**
 * AIMapCarousel
 *
 * A bottom-anchored horizontal carousel that appears on top of the map
 * whenever the AI Bridge has results. Swiping a card pans the map to
 * that gem's location.
 */

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIMapBridge, BridgeGem } from "@/context/AIMapBridgeContext";
import { useAuth } from "@/context/AuthContext";
import { toggleSaveSpot } from "@/lib/vault-service";
import {
  Sparkles, X, Bookmark, BookmarkCheck, MapPin,
  ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

// ── Single carousel card ────────────────────────────────────────────────────
function CarouselCard({
  gem,
  index,
  isFocused,
  onFocus,
}: {
  gem: BridgeGem;
  index: number;
  isFocused: boolean;
  onFocus: () => void;
}) {
  const { user, savedSpots } = useAuth();
  const isSaved = savedSpots.includes(gem.id);
  const [saving, setSaving] = useState(false);

  const handleVault = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { toast.error("Sign in to save spots"); return; }
    setSaving(true);
    try {
      await toggleSaveSpot(user.uid, gem.id, isSaved);
      toast.success(isSaved ? "Removed from Vault" : "Saved to Vault 🔒");
    } catch {
      toast.error("Could not save spot");
    } finally {
      setSaving(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Nature: "bg-emerald-500",
    Urban: "bg-blue-500",
    "Food & Drink": "bg-amber-500",
    Adventure: "bg-red-500",
    Historical: "bg-purple-500",
    Beach: "bg-cyan-500",
  };
  const catColor = categoryColors[gem.category || ""] || "bg-zinc-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: isFocused ? 1.04 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onFocus}
      className={`flex-shrink-0 w-56 cursor-pointer rounded-2xl overflow-hidden shadow-xl transition-all duration-300 border-2
        ${isFocused
          ? "border-orange-400 shadow-orange-300/40 shadow-2xl"
          : "border-transparent bg-white"
        }`}
      style={{ background: isFocused ? undefined : "#fff" }}
    >
      {/* Image */}
      <div className="relative h-28 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        {gem.imageUrl ? (
          <img
            src={gem.imageUrl}
            alt={gem.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-orange-300" />
          </div>
        )}

        {/* Number badge */}
        <div className={`absolute top-2 left-2 w-5 h-5 rounded-full ${isFocused ? "bg-orange-500" : "bg-black/60"} flex items-center justify-center`}>
          <span className="text-[10px] font-bold text-white">{index + 1}</span>
        </div>

        {/* Category */}
        {gem.category && (
          <span className={`absolute bottom-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white ${catColor}`}>
            {gem.category}
          </span>
        )}

        {/* Vault */}
        <button
          onClick={handleVault}
          disabled={saving}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all
            ${isSaved ? "bg-orange-500 text-white" : "bg-white/80 text-zinc-500 hover:bg-orange-500 hover:text-white"}`}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSaved ? <BookmarkCheck className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
        </button>
      </div>

      {/* Body */}
      <div className="p-2.5">
        <h3 className="font-bold text-xs text-zinc-900 line-clamp-1">{gem.title}</h3>
        <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">{gem.description}</p>
        {gem.distanceKm !== undefined && (
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-400">
            <MapPin className="w-2.5 h-2.5" />
            {gem.distanceKm.toFixed(1)} km away
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Carousel ────────────────────────────────────────────────────────────
export default function AIMapCarousel() {
  const { gems, focusedIndex, setFocusedIndex, vibeLabel, clearBridge } = useAIMapBridge();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused card into view
  useEffect(() => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.querySelectorAll("[data-card]");
    const target = cards[focusedIndex] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [focusedIndex]);

  const prev = () => setFocusedIndex(Math.max(0, focusedIndex - 1));
  const next = () => setFocusedIndex(Math.min(gems.length - 1, focusedIndex + 1));

  if (gems.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-2 pointer-events-none"
      >
        {/* Header row */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-orange-400/40 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-semibold text-white">{vibeLabel}</span>
            <span className="text-[10px] text-orange-300">· {gems.length} gems</span>
          </div>
          <button
            onClick={clearBridge}
            className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Cards row */}
        <div className="flex items-center gap-2 w-full px-2 pointer-events-auto">
          {/* Prev arrow */}
          <button
            onClick={prev}
            disabled={focusedIndex === 0}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide flex-1 px-1 py-1"
          >
            {gems.map((gem, i) => (
              <div key={gem.id} data-card>
                <CarouselCard
                  gem={gem}
                  index={i}
                  isFocused={focusedIndex === i}
                  onFocus={() => setFocusedIndex(i)}
                />
              </div>
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={next}
            disabled={focusedIndex === gems.length - 1}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-1 pointer-events-auto">
          {gems.map((_, i) => (
            <button
              key={i}
              onClick={() => setFocusedIndex(i)}
              className={`rounded-full transition-all duration-200 ${
                focusedIndex === i
                  ? "w-4 h-1.5 bg-orange-400"
                  : "w-1.5 h-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
