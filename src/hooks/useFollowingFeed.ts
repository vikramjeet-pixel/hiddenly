"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FollowingFeedGem {
  id: string;
  authorAffinity: number; // affinity score of the gem's author (from the follow-edge)
  [key: string]: any;
}

interface FollowEntry {
  uid: string;
  affinity: number;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * useFollowingFeed
 * ----------------
 * Fetches a "smart" feed of gems posted by people the current user follows,
 * weighted by the affinity score on each follow-edge.
 *
 * Algorithm:
 *   1. Read social/{uid}/following ordered by affinity DESC (top 10).
 *   2. Firestore `in` queries support max 30 values — we use a 10-element
 *      "top tier" and the remaining UIDs as a "second tier".
 *   3. Query gems WHERE authorId IN [top-tier UIDs], ordered by createdAt.
 *   4. Query gems WHERE authorId IN [second-tier UIDs], ordered by createdAt.
 *   5. Merge: top-affinity gems first, then the rest chronologically.
 *   6. Tag every gem with `authorAffinity` so the UI can badge "Top Pathfinder".
 */
export function useFollowingFeed() {
  const { user } = useAuth();

  const [topGems, setTopGems]       = useState<FollowingFeedGem[]>([]);
  const [restGems, setRestGems]     = useState<FollowingFeedGem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTopGems([]);
      setRestGems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const uid = user.uid;

    const fetchFeed = async () => {
      setLoading(true);
      setError(null);

      try {
        // ── Step 1: fetch full following list ordered by affinity ────────────
        const followingRef = collection(db, "social", uid, "following");
        const topQ = query(followingRef, orderBy("affinity", "desc"), limit(30));
        const followSnap = await getDocs(topQ);

        if (followSnap.empty) {
          if (!cancelled) {
            setTopGems([]);
            setRestGems([]);
            setLoading(false);
          }
          return;
        }

        // Build list with affinity attached
        const allFollowed: FollowEntry[] = followSnap.docs.map((d) => ({
          uid: d.id,
          affinity: d.data().affinity ?? 0,
        }));

        // Split into top-10 and remaining
        const topTier    = allFollowed.slice(0, 10);
        const secondTier = allFollowed.slice(10);

        // Build a fast lookup map: uid → affinity
        const affinityMap = new Map<string, number>(
          allFollowed.map((f) => [f.uid, f.affinity])
        );

        // ── Step 2: query gems from top-tier authors ────────────────────────
        const topUids = topTier.map((f) => f.uid);

        const topGemsResult = await queryGemsByAuthors(topUids, affinityMap);

        // ── Step 3: query gems from remaining authors ───────────────────────
        let restGemsResult: FollowingFeedGem[] = [];

        if (secondTier.length > 0) {
          // Firestore `in` supports up to 30 values — chunk accordingly
          const chunks = chunkArray(
            secondTier.map((f) => f.uid),
            30
          );

          const chunkResults = await Promise.all(
            chunks.map((chunk) => queryGemsByAuthors(chunk, affinityMap))
          );

          restGemsResult = chunkResults.flat();
        }

        if (!cancelled) {
          setTopGems(topGemsResult);
          setRestGems(restGemsResult);
        }
      } catch (err: any) {
        console.error("useFollowingFeed error:", err);
        if (!cancelled) setError("Failed to load your following feed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFeed();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // ── Step 5: merge arrays with useMemo ───────────────────────────────────────
  const gems = useMemo<FollowingFeedGem[]>(() => {
    // Top gems sorted by affinity DESC, then createdAt DESC
    const sorted = [...topGems].sort((a, b) => {
      if (b.authorAffinity !== a.authorAffinity) {
        return b.authorAffinity - a.authorAffinity;
      }
      return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
    });

    // Rest sorted by createdAt DESC (recency after affinity batch)
    const sortedRest = [...restGems].sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    );

    return [...sorted, ...sortedRest];
  }, [topGems, restGems]);

  return { gems, loading, error };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Query gems by a batch of author UIDs, tagging each with their affinity */
async function queryGemsByAuthors(
  authorUids: string[],
  affinityMap: Map<string, number>
): Promise<FollowingFeedGem[]> {
  if (authorUids.length === 0) return [];

  const gemsRef = collection(db, "gems");
  const q = query(
    gemsRef,
    where("authorId", "in", authorUids),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      authorAffinity: affinityMap.get(data.authorId) ?? 0,
    } as FollowingFeedGem;
  });
}

/** Split an array into chunks of size `n` */
function chunkArray<T>(arr: T[], n: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}
