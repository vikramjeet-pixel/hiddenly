"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User as UserIcon, Bookmark, Heart, MessageCircle, Navigation } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { toggleSaveSpot } from "@/lib/vault-service";
import { toggleLike } from "@/lib/interaction-service";
import CommentSection from "@/components/CommentSection";
import { formatDistance } from "@/lib/geoUtils";
import FollowButton from "@/components/FollowButton";

export default function FeedPost({
  post,
  isLast = false,
  distanceKm,
  authorAffinity,
}: {
  post: any;
  isLast?: boolean;
  /** Distance in km injected by Near Me mode — renders an emerald badge when set */
  distanceKm?: number;
  /** Affinity score from the following-edge — renders a Top Pathfinder badge when > 20 */
  authorAffinity?: number;
}) {
  const { user, savedSpots, likedSpots } = useAuth();
  
  // Extract robust fallbacks since Firestore schema differs from initial Mock UI schema
  const authorName = post.author?.name || "Nomad Traveler";
  const authorUsername = post.author?.username || "secret_hunter";
  const avatarUrl = post.author?.avatarUrl || null;
  const locationText = post.locationName || post.location || "Unknown Coordinate";
  const captionText = post.description || post.caption || post.title || "";
  const mainImage = (post.media && post.media[0]) || post.imageUrl || "";

  // Derive initial mapping directly from the globally synced states
  const isInitiallySaved = savedSpots.includes(post.id);
  const isInitiallyLiked = likedSpots?.includes(post.id) || false;

  const [isSaved, setIsSaved] = useState(isInitiallySaved);
  const [isLiked, setIsLiked] = useState(isInitiallyLiked);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || post.likes || 0);
  const [showComments, setShowComments] = useState(false);

  // Maintain sync if they mutate from another tab/instance globally
  useEffect(() => {
    setIsSaved(savedSpots.includes(post.id));
    setIsLiked(likedSpots?.includes(post.id) || false);
  }, [savedSpots, likedSpots, post.id]);

  const handleToggleLike = async () => {
    if (!user) {
      toast.error("Sign in to like gems!");
      return;
    }

    const previousLikedState = isLiked;
    const previousLikesCount = likesCount;

    // 1. Optimistic UI update ensuring absolute zero-latency response
    setIsLiked(!previousLikedState);
    setLikesCount(prev => (previousLikedState ? prev - 1 : prev + 1));

    try {
      // 2. Transact globally
      await toggleLike(user.uid, post.id);
    } catch (error) {
      // 3. Rollback immediately on failure
      setIsLiked(previousLikedState);
      setLikesCount(previousLikesCount);
      toast.error("Failed to map like. Please try again.");
    }
  };

  const handleToggleSave = async () => {
    if (!user) {
      toast.error("Sign in to save gems to your Vault!");
      return;
    }

    const previousServerState = isSaved;
    const optimisticState = !isSaved;

    setIsSaved(optimisticState);
    if (optimisticState) {
      toast.success("Saved to Vault");
    } else {
      toast.success("Removed from Vault");
    }

    try {
      await toggleSaveSpot(user.uid, post.id, previousServerState);
    } catch (error) {
      setIsSaved(previousServerState);
      toast.error("Failed to update vault. Please try again.");
    }
  };

  return (
    <article id={`post-${post.id}`} className="flex flex-col gap-3 md:gap-4 p-4 md:p-6 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 md:size-11 rounded-full bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${authorName}'s avatar`}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <UserIcon className="size-5 text-primary" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm md:text-base font-bold font-serif tracking-tight">
                {authorName}
              </h4>
              {/* Top Pathfinder badge — shown when affinity > 20 */}
              {typeof authorAffinity === "number" && authorAffinity > 20 && (
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700"
                  title={`Affinity: ${authorAffinity}`}
                >
                  <span className="material-symbols-outlined !text-[11px]">local_fire_department</span>
                  Top Pathfinder
                </span>
              )}
              {/* Follow button — hides itself automatically on own posts */}
              {post.authorId && (
                <FollowButton
                  targetUserId={post.authorId}
                  targetName={authorName}
                  size="sm"
                />
              )}
            </div>
            <div className="flex items-center gap-1 text-neutral-500 text-[10px] tracking-widest uppercase font-bold">
              <span className="material-symbols-outlined !text-xs text-primary">
                location_on
              </span>
              <span>{locationText}</span>
            </div>
          </div>
        </div>

        
        {/* Category tag + Distance badge */}
        <div className="flex items-center gap-2">
          {post.type && (
            <span className="hidden md:inline-flex px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold rounded-full">
              {post.type}
            </span>
          )}
          {distanceKm !== undefined && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide"
              style={{ background: "#dcfce7", color: "#16a34a" }}
            >
              <Navigation className="size-3" />
              {formatDistance(distanceKm, "km")} away
            </span>
          )}
        </div>
      </div>

      {/* Post Image */}
      {mainImage && (
        <div className="rounded-2xl overflow-hidden bg-black/10 dark:bg-black/50 relative aspect-[16/10] mt-2 border border-neutral-200 dark:border-white/10 shadow-inner group">
          <Image
            src={mainImage}
            alt={post.title || "Hidden Gem Media"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            priority={false}
          />
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black font-serif italic tracking-tight text-foreground pr-4">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            
            <button 
              onClick={handleToggleLike} 
              className="flex items-center gap-1.5 group select-none outline-none"
            >
              <motion.div 
                whileTap={{ scale: 0.8 }} 
                animate={{ scale: isLiked ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart className={`size-6 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-zinc-400 group-hover:text-red-400"}`} />
              </motion.div>
              <span className={`text-[10px] font-bold tracking-widest ${isLiked ? "text-red-500" : "text-neutral-500"}`}>
                {likesCount}
              </span>
            </button>
            
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 group outline-none"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <MessageCircle className={`size-6 transition-colors ${showComments ? "text-primary" : "text-zinc-400 group-hover:text-primary"}`} />
              </motion.div>
            </button>
            
            <button 
              onClick={handleToggleSave}
              className="outline-none group mt-[2px]"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <Bookmark className={`size-6 transition-colors ${isSaved ? "fill-emerald-500 text-emerald-500" : "text-zinc-400 group-hover:text-emerald-400"}`} />
              </motion.div>
            </button>
            
          </div>
        </div>

        {/* Caption */}
        {captionText && (
          <p className="text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="font-bold tracking-wide mr-2 text-foreground">@{authorUsername}</span>
            {captionText}
          </p>
        )}

        {/* Comments Section */}
        {showComments && (
          <CommentSection gemId={post.id} />
        )}

        {!isLast && (
          <div className="h-px bg-neutral-200 dark:bg-white/10 w-full mt-4" />
        )}
      </div>
    </article>
  );
}
