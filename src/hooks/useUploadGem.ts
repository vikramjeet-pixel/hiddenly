"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";

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

      const postUuid = crypto.randomUUID();
      const mediaUrls: string[] = [];

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Path matches specs: gems/{uid}/{uuid}/filename
        const filePath = `gems/${userId}/${postUuid}/${file.name}`;
        const storageRef = ref(storage, filePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Calculate overall progress based on multiple files
              const fileProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              const overallProgress = ((i * 100) + fileProgress) / files.length;
              setUploadState((prev) => ({ ...prev, progress: Math.round(overallProgress) }));
            },
            (error) => {
              console.error("Storage upload error:", error);
              reject(error);
            },
            async () => {
              // Upload completed successfully
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              mediaUrls.push(downloadURL);
              resolve();
            }
          );
        });
      }

      // 3. DATABASE LOGIC (Firestore)
      // Create document in "gems" collection
      const gemsRef = collection(db, "gems");
      
      const docData = {
        title: details.title,
        description: details.description,
        type: details.gemType,
        locationName: details.locationName,
        coordinates: new GeoPoint(details.latitude, details.longitude),
        media: mediaUrls, // Array of URLs
        authorId: userId,
        createdAt: serverTimestamp(),
      };

      await addDoc(gemsRef, docData);

      setUploadState({ progress: 100, loading: false, error: null, success: true });
    } catch (err: any) {
      console.error("Upload process failed", err);
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
