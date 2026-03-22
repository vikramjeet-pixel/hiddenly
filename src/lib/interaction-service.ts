import { db, auth } from "@/lib/firebase";
import {
  doc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  setDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

export const toggleLike = async (userId: string, gemId: string): Promise<boolean> => {
  const userRef = doc(db, "users", userId);
  const gemRef = doc(db, "gems", gemId);
  const likeRef = doc(db, "gems", gemId, "likes", userId); // triggers Cloud Function

  try {
    const isLiked = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.exists() ? userDoc.data() : { likedSpots: [] };
      const likedSpots = userData.likedSpots || [];
      const currentlyLiked = likedSpots.includes(gemId);

      if (currentlyLiked) {
        transaction.update(userRef, { likedSpots: arrayRemove(gemId) });
        transaction.update(gemRef, { likesCount: increment(-1) });
      } else {
        transaction.set(userRef, { likedSpots: arrayUnion(gemId) }, { merge: true });
        transaction.set(gemRef, { likesCount: increment(1) }, { merge: true });
      }

      return !currentlyLiked;
    });

    // After transaction, write/delete the likes sub-doc (triggers Cloud Function for notifications)
    if (isLiked) {
      // Fetch the current user's display info for the notification payload
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      await setDoc(likeRef, {
        fromUserId: userId,
        fromUserName: userData.displayName || auth.currentUser?.displayName || "A traveler",
        fromUserAvatar: userData.avatarUrl || auth.currentUser?.photoURL || "",
        likedAt: serverTimestamp(),
      });
    } else {
      // Remove the like doc so the Cloud Function won't re-fire on re-like
      await deleteDoc(likeRef);
    }

    return isLiked;
  } catch (error) {
    console.error("Critical transaction failure mapping like:", error);
    throw error;
  }
};
