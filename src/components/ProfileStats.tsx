import React from "react";

interface ProfileStatsProps {
  gemsCount: number;
  trustScore: number;
  followingCount: number;
}

export default function ProfileStats({
  gemsCount,
  trustScore,
  followingCount,
}: ProfileStatsProps) {
  const isScratchUser = followingCount === 0;

  return (
    <div className={`flex w-full ${isScratchUser ? "max-w-xs" : "max-w-md"} justify-between items-center rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-md p-4 mt-6 border border-neutral-200 dark:border-white/10 shadow-sm`}>
      <div className="flex flex-col items-center flex-1">
        <span className="text-xl font-bold font-serif">{gemsCount}</span>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mt-1">
          Gems
        </span>
      </div>

      {!isScratchUser && (
        <>
          <div className="h-8 w-[1px] bg-neutral-300 dark:bg-white/10 mx-2" />

          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-bold font-serif flex items-center gap-1">
              {trustScore}
              <span className="material-symbols-outlined text-[16px] text-primary">
                local_fire_department
              </span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mt-1">
              Trust Score
            </span>
          </div>

          <div className="h-8 w-[1px] bg-neutral-300 dark:bg-white/10 mx-2" />

          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-bold font-serif">{followingCount}</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mt-1">
              Following
            </span>
          </div>
        </>
      )}
    </div>
  );
}
