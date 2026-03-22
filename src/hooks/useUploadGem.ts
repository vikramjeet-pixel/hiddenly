"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, GeoPoint, doc, getDoc } from "firebase/firestore";
import { db, storage, auth } from "@/lib/firebase";
import { generateGeoData } from "@/lib/geoUtils";

interface UploadState {
  progress: number;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface PostDetails {
  title: string;
  description: string;
  gemType: string;
  locationName: string;
  latitude: number;
  longitude: number;
}

export function useUploadGem() {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    loading: false,
    error: null,
    success: false,
  });

  const uploadFiles = async (files: File[], userId: string, details: PostDetails) => {
    setUploadState({ progress: 0, loading: true, error: null, success: false });

    try {
      if (!files.length) throw new Error("At least one media file is required.");
      if (!details.title) throw new Error("Title is required.");

      // ─── 1. Fetch author profile (Firestore → Auth fallback) ─────────
      const currentUser = auth.currentUser;
      let authorName = currentUser?.displayName || "Nomad Traveler";
      let authorAvatar = currentUser?.photoURL || "";
      let authorUsername = "secret_hunter";

      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        if (userSnap.exists()) {
          const p = userSnap.data();
          authorName    = p.displayName || p.name     || authorName;
          authorAvatar  = p.photoURL    || p.avatarUrl || authorAvatar;
          authorUsername = p.username   || authorUsername;
        }
      } catch (profileErr) {
        console.warn("Could not fetch user profile, using Auth values:", profileErr);
      }

      // ─── 2. Pre-calculate geohash before any I/O ─────────────────────
      const geoData = generateGeoData(details.latitude, details.longitude);
      // geoData = { geohash: "xn774c2fb", lat: number, lng: number }

      // ─── 3. Upload media files to Firebase Storage ───────────────────
      const postUuid = crypto.randomUUID();
      const mediaUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const filePath = `gems/${userId}/${postUuid}/${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              // Scale each file's contribution to the overall progress bar
              const overallProgress = ((i * 100) + fileProgress) / files.length;
              setUploadState((prev) => ({ ...prev, progress: Math.round(overallProgress) }));
            },
            (error) => { console.error("Storage upload error:", error); reject(error); },
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              mediaUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }

      // ─── 4. Write enriched Gem document to Firestore ─────────────────
      await addDoc(collection(db, "gems"), {
        // Core content
        title:        details.title,
        description:  details.description,
        type:         details.gemType,
        locationName: details.locationName,
        media:        mediaUrls,

        // Legacy GeoPoint (kept for MapView compatibility)
        coordinates: new GeoPoint(details.latitude, details.longitude),

        // ✅ Geospatial index fields (new — enables proximity queries)
        geohash: geoData.geohash,
        lat:     geoData.lat,
        lng:     geoData.lng,

        // Author metadata
        authorId:       userId,
        authorName,
        authorAvatar,
        authorUsername,

        // Counters & timestamps
        likesCount: 0,
        createdAt: serverTimestamp(),
      });

      setUploadState({ progress: 100, loading: false, error: null, success: true });
    } catch (err: any) {
      console.error("Upload process failed:", err);
      setUploadState((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to upload gem. Please try again.",
      }));
    }
  };

  const resetState = () => {
    setUploadState({ progress: 0, loading: false, error: null, success: false });
  };

  return { ...uploadState, uploadFiles, resetState };
}
