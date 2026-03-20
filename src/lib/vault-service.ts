import { db } from "@/lib/firebase";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * Toggles a spot's saved status in the user's personal vault (Firestore profile).
 * 
 * @param userId - The ID of the current authenticated user
 * @param spotId - The ID of the post/spot to be bookmarked
 * @param isCurrentlySaved - True if the spot is already saved, false otherwise
 */
export async function toggleSaveSpot(userId: string, spotId: string, isCurrentlySaved: boolean) {
  try {
    const userRef = doc(db, "users", userId);
    
    if (isCurrentlySaved) {
      // Remove it from the vault array
      await setDoc(
        userRef, 
        { savedSpots: arrayRemove(spotId) }, 
        { merge: true } // Creates the doc strictly ensuring it exists without wiping others
      );
    } else {
      // Add it to the vault array
      await setDoc(
        userRef, 
        { savedSpots: arrayUnion(spotId) }, 
        { merge: true }
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error toggling saved spot in Vault:", error);
    throw error;
  }
}
