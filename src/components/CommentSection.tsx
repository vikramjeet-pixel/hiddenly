"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useComments } from "@/hooks/useComments";
import toast from "react-hot-toast";
import { Send, User as UserIcon } from "lucide-react";

export default function CommentSection({ gemId }: { gemId: string }) {
  const { user } = useAuth();
  const { comments, loading, error } = useComments(gemId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment.");
      return;
    }
    if (!text.trim()) return;

    setSubmitting(true);
    try {
      const docRef = collection(db, "gems", gemId, "comments");
      await addDoc(docRef, {
        text: text.trim(),
        authorId: user.uid,
        authorName: user.displayName || "Nomad Traveler",
        authorAvatar: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error("Failed creating comment:", err);
      toast.error("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-neutral-200 dark:border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* Scrollable Comments View */}
      <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto scrollbar-hide">
        {loading && (
          <div className="flex justify-center p-4">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-xs text-center text-neutral-500 font-medium py-4 uppercase tracking-wider">
            No comments yet. Be the first!
          </p>
        )}

        {error && (
          <p className="text-xs text-center text-red-500 font-medium py-4">
            Something went wrong loading comments.
          </p>
        )}

        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 animate-in fade-in duration-300">
            <div className="size-8 rounded-full overflow-hidden bg-neutral-200 dark:bg-white/10 relative shrink-0 border border-neutral-200 dark:border-white/10">
              {comment.authorAvatar ? (
                <Image src={comment.authorAvatar} alt={comment.authorName} fill className="object-cover" />
              ) : (
                <UserIcon className="size-4 m-auto text-neutral-500 dark:text-neutral-400 absolute inset-0" />
              )}
            </div>
            
            <div className="flex flex-col bg-neutral-100 dark:bg-white/5 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm max-w-[85%]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-0.5">
                {comment.authorName}
              </span>
              <p className="text-sm text-foreground leading-snug break-words">
                {comment.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative mt-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Add a comment..." : "Sign in to join the conversation"}
          disabled={!user || submitting}
          className="flex-1 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || !user || submitting}
          className="absolute right-2 size-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-sm"
        >
          {submitting ? (
             <div className="size-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
             <Send className="size-3.5 ml-[-1px]" />
          )}
        </button>
      </form>
    </div>
  );
}
