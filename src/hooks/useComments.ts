import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Comment {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: any;
}

export function useComments(gemId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!gemId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Build chronological ordered snapshot reference
    const commentsRef = collection(db, "gems", gemId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    // 2. Attach robust listener gracefully unsubscribing automatically
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Comment, "id">),
        }));
        
        setComments(fetchedComments);
        setLoading(false);
      },
      (err) => {
        console.error("Critical error mapping realtime comments:", err);
        setError(err);
        setLoading(false);
      }
    );

    // 3. Clear memory leaks securely on unmount
    return () => unsubscribe();
  }, [gemId]);

  return { comments, loading, error };
}
