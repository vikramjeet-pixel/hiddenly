"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  savedSpots: string[];
  likedSpots: string[];
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  savedSpots: [],
  likedSpots: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedSpots, setSavedSpots] = useState<string[]>([]);
  const [likedSpots, setLikedSpots] = useState<string[]>([]);

  useEffect(() => {
    let unsubscribeFirestore: () => void;

    console.log("Setting up Firebase Auth Listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("Current User State:", currentUser);
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to the user's Firestore document for realtime updates to savedSpots
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeFirestore = onSnapshot(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setSavedSpots(data.savedSpots || []);
            setLikedSpots(data.likedSpots || []);
          } else {
            setSavedSpots([]);
            setLikedSpots([]);
          }
        }, (error) => {
          console.error("Error listening to user document:", error);
          setSavedSpots([]);
          setLikedSpots([]);
        });
      } else {
        setSavedSpots([]);
        if (unsubscribeFirestore) unsubscribeFirestore();
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, savedSpots, likedSpots }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
