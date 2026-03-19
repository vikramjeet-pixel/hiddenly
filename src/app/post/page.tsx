"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUploadGem, PostDetails } from "@/hooks/useUploadGem";
import MediaPreview from "@/components/MediaPreview";

const GEM_TYPES = [
  "Nature",
  "Urban",
  "Culinary",
  "Secret Stay",
  "Other",
];

export default function PostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { progress, loading, error, success, uploadFiles } = useUploadGem();

  const [files, setFiles] = useState<File[]>([]);
  const [details, setDetails] = useState<PostDetails>({
    title: "",
    description: "",
    gemType: "Nature",
    locationName: "",
    latitude: 37.7749, // Mock default coordinates
    longitude: -122.4194,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (success) {
      // Redirect to main feed after a small delay to show success state
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
      );
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await uploadFiles(files, user.uid, details);
  };

  const isFormValid = details.title.trim() !== "" && files.length > 0 && details.locationName.trim() !== "";

  if (authLoading || !user) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 flex flex-col min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-3xl lg:text-5xl font-black font-serif italic mb-3">
          Share a Gem
        </h1>
        <p className="text-sm tracking-widest text-neutral-500 uppercase font-medium">
          The globe expands with every story.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 pb-24">
        
        {/* MEDIA UPLOAD AREA */}
        <div className="space-y-3">
          <label className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 uppercase">
            Media (Images & Video) <span className="text-primary">*</span>
          </label>
          
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 md:h-64 border-2 border-dashed border-neutral-300 dark:border-white/10 bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-white/5 rounded-3xl flex flex-col items-center justify-center text-center cursor-pointer transition-all p-6 group"
          >
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, video/mp4"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={loading}
            />
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-primary size-8" />
            </div>
            <p className="font-semibold text-sm mb-1 text-foreground/80">Click or drag media here</p>
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              JPG, PNG, or MP4
            </p>
          </div>

          <MediaPreview files={files} onRemove={handleRemoveFile} />
        </div>

        {/* DETAILS SECTION */}
        <div className="space-y-6 bg-white/50 dark:bg-black/20 p-6 md:p-8 rounded-3xl border border-neutral-200 dark:border-white/10 backdrop-blur-md">
          
          {/* Title */}
          <div className="group relative">
            <label className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 uppercase mb-2 block group-focus-within:text-foreground transition-colors">
              Gem Title <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              placeholder="E.g. Hidden Kyoto Bamboo Grove"
              className="w-full bg-transparent border-0 border-b-2 border-neutral-200 dark:border-white/10 py-3 px-0 focus:ring-0 focus:border-foreground text-foreground text-sm tracking-wide transition-all outline-none"
              value={details.title}
              onChange={(e) => setDetails({ ...details, title: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="group relative">
            <label className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 uppercase mb-2 block group-focus-within:text-foreground transition-colors">
              Story / Description
            </label>
            <textarea
              placeholder="What makes this place special? How do you get there?"
              className="w-full bg-transparent border-0 border-b-2 border-neutral-200 dark:border-white/10 py-3 px-0 focus:ring-0 focus:border-foreground text-foreground text-sm tracking-wide transition-all outline-none resize-none min-h-[100px]"
              value={details.description}
              onChange={(e) => setDetails({ ...details, description: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Type */}
            <div className="group relative">
              <label className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 uppercase mb-2 block group-focus-within:text-foreground transition-colors">
                Category
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-transparent border-0 border-b-2 border-neutral-200 dark:border-white/10 py-3 px-0 focus:ring-0 focus:border-foreground text-foreground text-sm tracking-wide transition-all outline-none"
                  value={details.gemType}
                  onChange={(e) => setDetails({ ...details, gemType: e.target.value })}
                  disabled={loading}
                >
                  {GEM_TYPES.map((type) => (
                    <option className="bg-background text-foreground" key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" />
              </div>
            </div>

             {/* Location Name */}
             <div className="group relative">
              <label className="text-[10px] tracking-[0.2em] font-bold text-neutral-500 uppercase mb-2 block group-focus-within:text-foreground transition-colors">
                City / Country <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                placeholder="Kyoto, Japan"
                className="w-full bg-transparent border-0 border-b-2 border-neutral-200 dark:border-white/10 py-3 px-0 focus:ring-0 focus:border-foreground text-foreground text-sm tracking-wide transition-all outline-none"
                value={details.locationName}
                onChange={(e) => setDetails({ ...details, locationName: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            
            {/* Hidden Coordinates */}
            <input type="hidden" name="latitude" value={details.latitude} />
            <input type="hidden" name="longitude" value={details.longitude} />
          </div>
        </div>

        {/* ERROR / SUCCESS FEEDBACK */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-4">
            <p className="text-red-500 text-sm font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mt-4 flex items-center gap-3">
            <CheckCircle2 className="text-green-500 size-5" />
            <p className="text-green-500 text-sm font-semibold">Gem added successfully! Redirecting...</p>
          </div>
        )}

        {/* UPLOAD PROGRESS & SUBMIT */}
        <div className="mt-4">
          {loading && (
            <div className="w-full h-1.5 bg-neutral-200 dark:bg-white/10 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
              <p className="text-[10px] text-right mt-1.5 font-bold tracking-widest uppercase text-neutral-500">
                {progress}%
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || loading || success}
            className="w-full py-5 rounded-full bg-foreground text-background font-bold text-sm uppercase tracking-widest disabled:opacity-50 disabled:active:scale-100 hover:bg-foreground/90 active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            {loading ? "Publishing Gem..." : success ? "Published!" : "Post Hidden Gem"}
            {!loading && !success && <span className="material-symbols-outlined text-lg">public</span>}
          </button>
        </div>
      </form>
    </main>
  );
}
