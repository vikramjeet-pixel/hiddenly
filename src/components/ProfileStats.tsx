import React from "react";

interface ProfileStatsProps {
  gemsCount: number;
  trustScore: number;
  followingCount: number;
  followerCount: number;
}

export default function ProfileStats({
  gemsCount,
  trustScore,
  followingCount,
  followerCount,
}: ProfileStatsProps) {
  const stats = [
    { label: "Gems", value: gemsCount },
    { label: "Followers", value: followerCount },
    { label: "Following", value: followingCount },
  ];

  return (
    <div className="flex w-full max-w-sm justify-between items-center rounded-2xl bg-white/50 dark:bg-black/30 backdrop-blur-md p-4 mt-6 border border-neutral-200 dark:border-white/10 shadow-sm">
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && (
            <div className="h-8 w-[1px] bg-neutral-300 dark:bg-white/10 mx-2" />
          )}
          <div className="flex flex-col items-center flex-1">
            <span className="text-xl font-bold font-serif">{stat.value}</span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mt-1">
              {stat.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
