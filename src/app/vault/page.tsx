"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, documentId, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import FeedPost from "@/components/FeedPost";
import { Bookmark } from "lucide-react";

export default function VaultPage() {
  const { user, loading, savedSpots } = useAuth();
  const router = useRouter();
  
  const [vaultGems, setVaultGems] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    const fetchVaultGems = async () => {
      // Fast bypass if they don't have any saved spots at all
      if (!savedSpots || savedSpots.length === 0) {
        setVaultGems([]);
        setFetching(false);
        return;
      }

      try {
        // Firestore limits 'in' queries to 10 element thresholds.
        // To build a robust scaleable engine, we chunk the savedSpots array.
        const chunks = [];
        for (let i = 0; i < savedSpots.length; i += 10) {
          chunks.push(savedSpots.slice(i, i + 10));
        }

        let allGems: any[] = [];
        
        // Asynchronously map through chunks grabbing documents precisely matching the `savedSpots` tokens
        for (const chunk of chunks) {
          const q = query(
            collection(db, "gems"),
            where(documentId(), "in", chunk)
          );
          const snapshot = await getDocs(q);
          const gemsChunk = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
          allGems = [...allGems, ...gemsChunk];
        }

        // Apply a safe local sort mapping since complex indexes aren't natively synced
        allGems.sort((a, b) => {
          const timeA = a.createdAt?.toMillis() || 0;
          const timeB = b.createdAt?.toMillis() || 0;
          return timeB - timeA;
        });

        setVaultGems(allGems);
      } catch (error) {
        console.error("Critical error mapping vault documents:", error);
      } finally {
        setFetching(false);
      }
    };

    if (user && !loading) {
      fetchVaultGems();
    }
  }, [user, loading, savedSpots, router]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 md:px-0 py-8 md:py-12 min-h-screen animate-in fade-in duration-500">
      
      {/* Header Segment */}
      <div className="mb-8 flex flex-row items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-5xl font-black font-serif italic tracking-tighter mb-2 flex items-center gap-3">
            My Vault
            <Bookmark className="size-8 text-emerald-500 fill-emerald-500" />
          </h1>
          <p className="text-[10px] md:text-sm tracking-widest text-neutral-500 uppercase font-bold">
            Your preserved global secrets.
          </p>
        </div>
        <button 
          onClick={() => router.push('/profile')} 
          className="size-10 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors shadow-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </button>
      </div>

      {/* Main Feed Map */}
      <div className="flex flex-col gap-6 pb-20">
        {vaultGems.length === 0 ? (
          <div className="w-full h-80 border-2 border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white/30">
            <span className="material-symbols-outlined text-6xl text-neutral-300 mb-3 block">bookmark_add</span>
            <p className="text-sm tracking-wide text-neutral-500 uppercase font-medium">No gems saved yet.</p>
            <button 
              onClick={() => router.push('/')} 
              className="mt-6 px-8 py-3 bg-foreground text-background rounded-full text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform shadow-xl"
            >
              Explore Map
            </button>
          </div>
        ) : (
          vaultGems.map((post, idx) => (
            <FeedPost key={post.id} post={post} isLast={idx === vaultGems.length - 1} />
          ))
        )}
      </div>

    </main>
  );
}
