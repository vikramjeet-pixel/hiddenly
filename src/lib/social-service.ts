import {
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FollowResult {
  isFollowing: boolean; // New state AFTER the action
}

// ─── toggleFollow ─────────────────────────────────────────────────────────────

/**
 * toggleFollow
 * ------------
 * Atomically follows or unfollows a user using a single writeBatch.
 *
 * Sub-collection strategy (avoids document size limits at scale):
 *   social/{currentUserId}/following/{targetUserId}   ← "I follow you"
 *   social/{targetUserId}/followers/{currentUserId}   ← "You follow me"
 *
 * Counter fields are stored on users/{uid} documents:
 *   followingCount  — incremented on the current user
 *   followerCount   — incremented on the target user
 *
 * @param currentUserId   The authenticated user performing the action
 * @param targetUserId    The user being followed / unfollowed
 * @param isCurrentlyFollowing  Pass the CURRENT state from your optimistic UI
 * @returns               { isFollowing: boolean } — the NEW state after commit
 */
export async function toggleFollow(
  currentUserId: string,
  targetUserId: string,
  isCurrentlyFollowing: boolean
): Promise<FollowResult> {
  if (currentUserId === targetUserId) {
    throw new Error("A user cannot follow themselves.");
  }

  const batch = writeBatch(db);

  // ── Document refs ──────────────────────────────────────────────────────────
  const followingRef = doc(
    db,
    "social",
    currentUserId,
    "following",
    targetUserId
  );
  const followerRef = doc(
    db,
    "social",
    targetUserId,
    "followers",
    currentUserId
  );
  const currentUserRef = doc(db, "users", currentUserId);
  const targetUserRef  = doc(db, "users", targetUserId);

  if (!isCurrentlyFollowing) {
    // ── FOLLOW ───────────────────────────────────────────────────────────────
    const payload = {
      createdAt: serverTimestamp(),
      affinity: 0,
    };

    batch.set(followingRef, payload);
    batch.set(followerRef, payload);

    // Increment counters (merge:true handles missing user docs gracefully)
    batch.set(
      currentUserRef,
      { followingCount: increment(1) },
      { merge: true }
    );
    batch.set(
      targetUserRef,
      { followerCount: increment(1) },
      { merge: true }
    );
  } else {
    // ── UNFOLLOW ─────────────────────────────────────────────────────────────
    batch.delete(followingRef);
    batch.delete(followerRef);

    // Decrement (won't go below 0 in typical usage — guard in rules if needed)
    batch.set(
      currentUserRef,
      { followingCount: increment(-1) },
      { merge: true }
    );
    batch.set(
      targetUserRef,
      { followerCount: increment(-1) },
      { merge: true }
    );
  }

  await batch.commit();

  return { isFollowing: !isCurrentlyFollowing };
}

// ─── checkIsFollowing ─────────────────────────────────────────────────────────

/**
 * checkIsFollowing
 * ----------------
 * Checks whether currentUserId is already following targetUserId
 * by reading the sub-collection document (exists = following).
 *
 * Use this on mount to initialize the Follow button state.
 */
export async function checkIsFollowing(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return false;
  }

  try {
    const { getDoc } = await import("firebase/firestore");
    const followingRef = doc(
      db,
      "social",
      currentUserId,
      "following",
      targetUserId
    );
    const snap = await getDoc(followingRef);
    return snap.exists();
  } catch {
    return false;
  }
}
