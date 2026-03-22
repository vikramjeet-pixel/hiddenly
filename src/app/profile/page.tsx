"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Bookmark } from "lucide-react";
import { doc, getDoc, setDoc, query, collection, where, getDocs, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/context/AuthContext";
import { db, storage, logOut } from "@/lib/firebase";
import ProfileStats from "@/components/ProfileStats";
import GemCard from "@/components/GemCard";
import FollowButton from "@/components/FollowButton";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support ?uid= for browsing other profiles (future expansion)
  const viewedUid = searchParams.get("uid") || user?.uid || "";
  const isOwnProfile = !searchParams.get("uid") || searchParams.get("uid") === user?.uid;

  const [bio, setBio] = useState<string>("Wandering through life, discovering one secret gem at a time. The world is too vast to stay in one place.");
  const [displayName, setDisplayName] = useState<string>("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState("");
  const [myGems, setMyGems] = useState<any[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // Social counters
  const [followerCount, setFollowerCount]   = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // Live-update counters when FollowButton fires
  const handleFollowChange = (nowFollowing: boolean) => {
    setFollowerCount(prev => nowFollowing ? prev + 1 : Math.max(0, prev - 1));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) return;

    setIsUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/avatar_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      // Update core Auth profile
      await updateProfile(user, { photoURL: url });
      
      // Force refresh to pull down new photo URL globally
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user && viewedUid) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", viewedUid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.bio)            setBio(data.bio);
            if (data.displayName)    setDisplayName(data.displayName);
            if (data.photoURL)       setAvatarUrl(data.photoURL);
            setFollowerCount(data.followerCount   || 0);
            setFollowingCount(data.followingCount || 0);
          } else if (isOwnProfile) {
            await setDoc(doc(db, "users", user.uid), { bio, createdAt: new Date() });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      };

      const fetchUserGems = async () => {
        try {
          const q = query(
            collection(db, "gems"),
            where("authorId", "==", viewedUid)
          );
          const snapshot = await getDocs(q);
          const userGems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          userGems.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setMyGems(userGems);
        } catch (error) {
          console.error("Error fetching gems:", error);
        }
      };

      fetchUserData();
      fetchUserGems();
    }
  }, [user, loading, router, viewedUid]);

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

  // Management controls for user posts
  const handleDeleteGem = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this Gem?")) {
      try {
        await deleteDoc(doc(db, "gems", id));
        // Update local state without needing another fetch
        setMyGems(prev => prev.filter(gem => gem.id !== id));
      } catch (error) {
        console.error("Failed to delete gem", error);
        alert("Failed to delete gem. Check your permissions.");
      }
    }
  };

  const handleEditGem = (id: string) => {
    alert("Full Edit Mode is coming soon! For now, please delete and repost.");
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const profileAvatar = avatarUrl || user.photoURL || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
  const profileName   = displayName || user.displayName || "Nomad Traveler";
  const shownUid      = viewedUid || user.uid;

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 md:pb-0">
      {/* Cover subtle gradient */}
      <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
        <div className="absolute top-6 right-6 flex gap-3">
          <button 
            onClick={() => router.push('/vault')}
            className="px-4 py-2 rounded-full bg-white/50 backdrop-blur-md flex items-center gap-2 hover:bg-white/80 transition-colors shadow-sm text-foreground text-xs font-bold tracking-widest uppercase"
          >
            <Bookmark className="size-4 text-emerald-500 fill-emerald-500" />
            Vault
          </button>
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
        <div className="size-32 md:size-48 rounded-full border-4 border-background overflow-hidden relative shadow-2xl bg-white mb-4 group cursor-pointer">
          <Image
            src={profileAvatar}
            alt="Profile Avatar"
            fill
            sizes="192px"
            className="object-cover"
          />
          {/* Edit Avatar Overlay — only own profile */}
          {isOwnProfile && (
            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              {isUploadingAvatar ? (
                <div className="size-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl mb-1">add_a_photo</span>
                  <span className="text-[10px] font-bold tracking-widest uppercase">Change</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploadingAvatar}
              />
            </label>
          )}
        </div>

        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-5xl font-black font-serif italic mb-2 tracking-tighter">
            {profileName}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">explore</span>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Pathfinder Rank • Level 3</span>
            </div>
            {/* Follow button — hidden on own profile */}
            {!isOwnProfile && (
              <FollowButton
                targetUserId={shownUid}
                targetName={profileName}
                size="md"
                onFollowChange={handleFollowChange}
              />
            )}
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
                  <button onClick={handleSaveBio} className="bg-primary text-primary-foreground rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest hover:bg-primary-hover active:scale-95 transition-all shadow-md">
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

        {/* Stats Row */}
        <ProfileStats
          gemsCount={myGems.length}
          trustScore={0}
          followingCount={followingCount}
          followerCount={followerCount}
        />

        {/* Spacer */}
        <div className="w-full h-[1px] bg-neutral-200 dark:bg-white/10 my-12 max-w-2xl" />

        {/* Bottom Section: My Posted Gems Grid */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-serif italic tracking-tighter">My Gems</h2>
            <div className="flex gap-2">
              <button className="size-10 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary-hover transition-all shadow-md shadow-primary/20 active:scale-95">
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button onClick={() => router.push('/post')} className="size-10 rounded-full border border-neutral-200 dark:border-white/10 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95">
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>

          {myGems.length === 0 ? (
            <div className="w-full h-48 border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white/30 dark:bg-black/20">
              <span className="material-symbols-outlined text-4xl text-neutral-300 dark:text-white/20 mb-3 block">photo_library</span>
              <p className="text-sm tracking-wide text-neutral-500 uppercase font-medium">No gems posted yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {myGems.map((gem) => (
                <GemCard 
                  key={gem.id} 
                  gem={gem} 
                  onDelete={handleDeleteGem}
                  onEdit={handleEditGem}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
