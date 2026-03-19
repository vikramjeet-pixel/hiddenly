"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db, logOut } from "@/lib/firebase";
import ProfileStats from "@/components/ProfileStats";
import GemCard from "@/components/GemCard";
import type { GemCardData } from "@/data/mockData";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bio, setBio] = useState<string>("Wandering through life, discovering one secret gem at a time. The world is too vast to stay in one place.");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  
  // Dummy 'saved' gems for demonstration since saved logic is complex
  const [savedGems, setSavedGems] = useState<GemCardData[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // Protect route
      return;
    }

    if (user) {
      // Fetch user profile from Firestore
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.bio) setBio(data.bio);
          } else {
            // First time loading profile: optionally initialize minimal doc
            await setDoc(docRef, {
              bio,
              createdAt: new Date(),
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      fetchUserData();
    }
  }, [user, loading, router]);

  const handleSaveBio = async () => {
    setIsEditingBio(false);
    if (!user || !tempBio.trim()) return;

    setBio(tempBio);
    try {
      const docRef = doc(db, "users", user.uid);
      await setDoc(docRef, { bio: tempBio }, { merge: true });
    } catch (error) {
      console.error("Failed to update bio", error);
    }
  };

  const startEditing = () => {
    setTempBio(bio);
    setIsEditingBio(true);
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const dummyAvatar = user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      {/* Cover subtle gradient */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
        <div className="absolute top-6 right-6 flex gap-3">
          <button 
            onClick={logOut}
            className="size-10 rounded-full bg-white/50 backdrop-blur-md flex items-center justify-center hover:bg-white/80 transition-colors shadow-sm text-red-500"
          >
            <span className="material-symbols-outlined font-light">logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-24 md:-mt-32 relative z-10 flex flex-col items-center">
        {/* Top Section: Avatar & Info */}
        <div className="size-32 md:size-48 rounded-full border-4 border-background overflow-hidden relative shadow-2xl bg-white mb-4">
          <Image
            src={dummyAvatar}
            alt="Profile Avatar"
            fill
            sizes="192px"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-black font-serif italic mb-2 tracking-tighter">
            {user.displayName || "Nomad Traveler"}
          </h1>
          
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 mb-6">
            <span className="material-symbols-outlined text-[14px]">explore</span>
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Pathfinder Rank • Level 3</span>
          </div>

          {/* Bio Section */}
          <div className="max-w-md w-full mb-6 min-h-[60px]">
            {isEditingBio ? (
              <div className="flex flex-col gap-3 w-full bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <textarea
                  value={tempBio}
                  onChange={(e) => setTempBio(e.target.value)}
                  className="w-full bg-transparent border-0 resize-none text-sm md:text-base focus:ring-0 outline-none text-center"
                  rows={3}
                  placeholder="Share a short bio..."
                  autoFocus
                />
                <div className="flex justify-center gap-3 mt-2">
                  <button onClick={() => setIsEditingBio(false)} className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-black dark:hover:text-white px-4 py-2 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSaveBio} className="bg-primary text-white rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary-hover active:scale-95 transition-all shadow-md">
                    Save Bio
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 group">
                <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed font-label">
                  "{bio}"
                </p>
                <button 
                  onClick={startEditing} 
                  className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 hover:text-primary transition-colors flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit Bio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Row Segment */}
        <ProfileStats gemsCount={12} trustScore={950} followingCount={34} />

        {/* Spacer */}
        <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/10 my-12 max-w-2xl" />

        {/* Bottom Section: My Saved Gems Grid */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-serif italic tracking-tighter">My Saved Gems</h2>
            <div className="flex gap-2">
              <button className="size-10 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button className="size-10 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center bg-primary text-white hover:bg-primary-hover transition-all shadow-md shadow-primary/20 active:scale-95">
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
              </button>
            </div>
          </div>

          {savedGems.length === 0 ? (
            <div className="w-full h-48 border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white/30 dark:bg-black/20">
              <span className="material-symbols-outlined text-4xl text-neutral-300 dark:text-white/20 mb-3 block">turned_in_not</span>
              <p className="text-sm tracking-wide text-neutral-500 uppercase font-medium">No saved gems yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {savedGems.map((gem) => (
                <GemCard key={gem.id} gem={gem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
