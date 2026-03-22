"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  startAt,
  endAt,
} from "firebase/firestore";
import { geohashQueryBounds, distanceBetween } from "geofire-common";
import { db } from "@/lib/firebase";
import { useLocation } from "@/context/LocationContext";
import { calculateDistance } from "@/lib/geoUtils";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Gem {
  id: string;
  title: string;
  description?: string;
  type?: string;
  locationName?: string;
  media?: string[];
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  authorUsername?: string;
  likesCount?: number;
  createdAt?: any;
  // Geospatial fields
  geohash?: string;
  lat?: number;
  lng?: number;
  coordinates?: { latitude: number; longitude: number };
  // Injected client-side for Near Me mode
  distanceKm?: number;
}

// ─────────────────────────────────────────────────────────────────────────────

const NEAR_ME_RADIUS_KM = 50; // 50 km radius
const NEAR_ME_RADIUS_M  = NEAR_ME_RADIUS_KM * 1000;

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useGems
 * -------
 * Central data hook for the discovery feed.
 *
 * @param isNearMe  When true, queries the `geohash` index within 50 km of
 *                  the user's location using geofire-common bounds.
 *                  When false (default), fetches all gems by `createdAt DESC`.
 */
export function useGems(isNearMe = false) {
  const { coords } = useLocation();

  const [gems, setGems] = useState<Gem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch: recent gems (default) ────────────────────────────────────────────
  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(
        query(collection(db, "gems"), orderBy("createdAt", "desc"))
      );
      const results: Gem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Gem, "id">),
      }));
      setGems(results);
    } catch (err: any) {
      console.error("useGems/fetchRecent:", err);
      setError("Failed to load gems. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch: Near Me (geohash bounds) ─────────────────────────────────────────
  const fetchNearMe = useCallback(
    async (userLat: number, userLng: number) => {
      setLoading(true);
      setError(null);
      try {
        // 1. Get the set of geohash prefix ranges that cover the 50 km circle
        const bounds = geohashQueryBounds([userLat, userLng], NEAR_ME_RADIUS_M);

        // 2. One Firestore query per bound (typically 4–8 range queries)
        const snapshots = await Promise.all(
          bounds.map((b) =>
            getDocs(
              query(
                collection(db, "gems"),
                orderBy("geohash"),
                startAt(b[0]),
                endAt(b[1])
              )
            )
          )
        );

        // 3. Flatten + de-duplicate + precise radius filter
        //    (geohash bounds are bounding-box approximations — Haversine trims the corners)
        const seenIds = new Set<string>();
        const results: Gem[] = [];

        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            if (seenIds.has(doc.id)) continue;
            seenIds.add(doc.id);

            const data = doc.data() as Omit<Gem, "id">;

            // Pull lat/lng from flat fields first, fall back to GeoPoint
            const gemLat = data.lat ?? data.coordinates?.latitude;
            const gemLng = data.lng ?? data.coordinates?.longitude;

            if (gemLat === undefined || gemLng === undefined) continue;

            // Precise circle check using distanceBetween (km)
            const distKm = distanceBetween(
              [userLat, userLng],
              [gemLat, gemLng]
            );

            if (distKm > NEAR_ME_RADIUS_KM) continue;

            results.push({
              id: doc.id,
              ...data,
              // Annotate with distance so FeedPost can render the badge
              distanceKm: Math.round(distKm * 10) / 10,
            });
          }
        }

        // 4. Sort by ascending distance (closest first)
        results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

        setGems(results);
      } catch (err: any) {
        console.error("useGems/fetchNearMe:", err);
        setError("Failed to load nearby gems. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [] // no external deps — coords passed as args
  );

  // ── Effect: re-run whenever mode or coords change ────────────────────────────
  useEffect(() => {
    if (isNearMe) {
      if (!coords) {
        // No location yet — show empty list (LocationBanner will prompt user)
        setGems([]);
        setLoading(false);
        return;
      }
      fetchNearMe(coords.lat, coords.lng);
    } else {
      fetchRecent();
    }
  }, [isNearMe, coords, fetchRecent, fetchNearMe]);

  return { gems, loading, error };
}
