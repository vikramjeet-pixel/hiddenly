import { db } from "@/lib/firebase";
import { doc, runTransaction, arrayUnion, arrayRemove, increment } from "firebase/firestore";

export const toggleLike = async (userId: string, gemId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  const gemRef = doc(db, "gems", gemId);

  try {
    const isLiked = await runTransaction(db, async (transaction) => {
      // 1. Read existing user document
      const userDoc = await transaction.get(userRef);
      
      const userData = userDoc.exists() ? userDoc.data() : { likedSpots: [] };
      const likedSpots = userData.likedSpots || [];

      // 2. Check current state inside transaction to ensure atomic sync
      const currentlyLiked = likedSpots.includes(gemId);

      // 3. Issue write operations simultaneously 
      if (currentlyLiked) {
        transaction.update(userRef, { likedSpots: arrayRemove(gemId) });
        transaction.update(gemRef, { likesCount: increment(-1) });
      } else {
        transaction.set(userRef, { likedSpots: arrayUnion(gemId) }, { merge: true });
        transaction.set(gemRef, { likesCount: increment(1) }, { merge: true });
      }

      return !currentlyLiked; // Return the new projected state
    });

    return isLiked;
  } catch (error) {
    console.error("Critical transaction failure mapping like:", error);
    throw error;
  }
};
