"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User as UserIcon } from "lucide-react";
import type { User } from "firebase/auth";

interface ProfileButtonProps {
  user: User;
}

export default function ProfileButton({ user }: ProfileButtonProps) {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <button
      onClick={handleProfileClick}
      className="flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/10 p-1 pr-3 lg:pr-4 rounded-full transition-all active:scale-95 animate-in fade-in duration-300 border border-transparent hover:border-black/10 dark:hover:border-white/10"
    >
      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || "Profile picture"}
            width={32}
            height={32}
            className="size-full object-cover"
          />
        ) : (
          <UserIcon className="size-4 text-primary" strokeWidth={2.5} />
        )}
      </div>
      <span className="hidden lg:block text-xs font-bold tracking-widest uppercase text-foreground/80 truncate max-w-[100px]">
        My Profile
      </span>
    </button>
  );
}
