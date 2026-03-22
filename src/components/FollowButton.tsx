"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toggleFollow, checkIsFollowing } from "@/lib/social-service";
import toast from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FollowButtonProps {
  /** UID of the user whose profile this button appears on */
  targetUserId: string;
  /** Display name used in toast messages */
  targetName?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Optional callback so the parent can react to follow state changes */
  onFollowChange?: (isFollowing: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * FollowButton
 * ------------
 * Self-contained follow/unfollow button with:
 * - Optimistic UI (state flips instantly, reverts on error)
 * - Animated transitions between Following / Follow states
 * - Reads initial state from the social sub-collection on mount
 * - Hidden automatically when viewing your own profile
 */
export default function FollowButton({
  targetUserId,
  targetName = "this traveler",
  size = "md",
  onFollowChange,
}: FollowButtonProps) {
  const { user } = useAuth();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // true while checking initial state
  const [isPending, setIsPending] = useState(false); // true during the batch write

  // ── Initialise follow state on mount ────────────────────────────────────────
  useEffect(() => {
    if (!user || user.uid === targetUserId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    checkIsFollowing(user.uid, targetUserId).then((result) => {
      if (!cancelled) {
        setIsFollowing(result);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [user, targetUserId]);

  // ── Follow / Unfollow handler ───────────────────────────────────────────────
  const handleToggle = useCallback(async () => {
    if (!user) {
      toast.error("Sign in to follow travelers!");
      return;
    }
    if (isPending) return;

    const previousState = isFollowing;

    // 1. Optimistic update — instant visual feedback
    setIsFollowing(!previousState);
    setIsPending(true);

    try {
      await toggleFollow(user.uid, targetUserId, previousState);
      toast.success(
        previousState
          ? `Unfollowed ${targetName}`
          : `Now following ${targetName}! 🌍`
      );
      onFollowChange?.(!previousState);
    } catch (err: any) {
      // 2. Rollback on failure
      setIsFollowing(previousState);
      toast.error("Something went wrong. Please try again.");
      console.error("toggleFollow failed:", err);
    } finally {
      setIsPending(false);
    }
  }, [user, targetUserId, isFollowing, isPending, targetName, onFollowChange]);

  // ── Hide when viewing own profile ──────────────────────────────────────────
  if (!user || user.uid === targetUserId) return null;

  // ── Size tokens ────────────────────────────────────────────────────────────
  const sizeClasses = {
    sm: "px-3 py-1 text-[10px] gap-1",
    md: "px-4 py-1.5 text-xs gap-1.5",
    lg: "px-6 py-2 text-sm gap-2",
  };

  const iconSize = { sm: "size-3", md: "size-3.5", lg: "size-4" };

  return (
    <motion.button
      id={`follow-btn-${targetUserId}`}
      onClick={handleToggle}
      disabled={isLoading || isPending}
      whileTap={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className={`
        relative flex items-center font-bold uppercase tracking-widest rounded-full
        transition-all select-none outline-none border
        disabled:opacity-60 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${
          isFollowing
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 hover:bg-red-50 hover:text-red-500 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            : "bg-primary text-white border-primary hover:bg-primary/85 shadow-sm shadow-primary/25"
        }
      `}
      title={isFollowing ? `Unfollow ${targetName}` : `Follow ${targetName}`}
    >
      {/* Spinner during initial load or batch commit */}
      {(isLoading || isPending) ? (
        <Loader2 className={`${iconSize[size]} animate-spin`} />
      ) : isFollowing ? (
        <>
          <UserCheck className={`${iconSize[size]} shrink-0`} />
          <span className="group-hover:hidden">Following</span>
        </>
      ) : (
        <>
          <UserPlus className={`${iconSize[size]} shrink-0`} />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
}
