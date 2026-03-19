"use client";

import React, { useEffect, useState } from "react";
import { X as XIcon } from "lucide-react";

interface MediaPreviewProps {
  files: File[];
  onRemove: (index: number) => void;
}

export default function MediaPreview({ files, onRemove }: MediaPreviewProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    // Generate object URLs for the files to render them securely in browser
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);

    // Cleanup memory when component unmounts or files change
    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (files.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
      {files.map((file, index) => {
        const isVideo = file.type.startsWith("video/");
        const src = previews[index];

        // Wait for useEffect to populate the preview
        if (!src) return null;

        return (
          <div
            key={`${file.name}-${index}`}
            className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group border border-white/10 bg-black/50"
          >
            {isVideo ? (
              <video
                src={src}
                className="object-cover size-full opacity-80"
                controls={false}
                muted
              />
            ) : (
              // Use standard HTML img instead of next/image for client-side blob URLs!
              <img
                src={src}
                alt={`Selected media ${index + 1}`}
                className="object-cover size-full"
              />
            )}

            {isVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
                <span className="material-symbols-outlined text-white/80">play_circle</span>
                <span className="text-[9px] uppercase tracking-widest text-white/80 font-bold mt-1">Video</span>
              </div>
            )}

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute top-1.5 right-1.5 size-6 bg-black/60 hover:bg-red-500/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all opacity-100 lg:opacity-0 group-hover:opacity-100"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
