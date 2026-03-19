import Image from "next/image";
import type { FeedPost as FeedPostType } from "@/data/mockData";

interface FeedPostProps {
  post: FeedPostType;
  isLast?: boolean;
}

export default function FeedPost({ post, isLast = false }: FeedPostProps) {
  return (
    <article id={`post-${post.id}`} className="flex flex-col gap-3 md:gap-4">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 md:size-11 rounded-full bg-slate-200 overflow-hidden relative shrink-0">
            <Image
              src={post.author.avatarUrl}
              alt={post.author.avatarAlt}
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold">
              {post.author.name}
            </h4>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <span className="material-symbols-outlined !text-xs text-primary">
                location_on
              </span>
              <span className="font-medium">{post.location}</span>
            </div>
          </div>
        </div>
        <button
          className="text-slate-400 hover:text-slate-600 transition-colors active:scale-90"
          aria-label="More options"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      {/* Post Image */}
      <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative aspect-[16/10]">
        <Image
          src={post.imageUrl}
          alt={post.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50vw"
          className="object-cover"
          priority={post.id === "fp1"}
        />
      </div>

      {/* Actions & Caption */}
      <div className="flex flex-col gap-2 md:gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <button className="flex items-center gap-1 md:gap-1.5 group active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                favorite
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {post.likes}
              </span>
            </button>
            <button className="flex items-center gap-1 md:gap-1.5 group active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                chat_bubble
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {post.comments}
              </span>
            </button>
            <button className="flex items-center gap-1 md:gap-1.5 group active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                share
              </span>
            </button>
          </div>
          <button className="text-slate-600 dark:text-slate-400 hover:text-primary transition-colors active:scale-90">
            <span className="material-symbols-outlined">bookmark</span>
          </button>
        </div>

        <p className="text-sm md:text-base leading-relaxed text-slate-700 dark:text-slate-300">
          <span className="font-bold">{post.author.username}</span>{" "}
          {post.caption}
        </p>

        <button className="text-xs text-slate-400 font-medium w-fit hover:text-slate-500 transition-colors">
          View all {post.comments} comments
        </button>

        {!isLast && (
          <div className="h-px bg-slate-200 dark:bg-slate-800 w-full mt-3 md:mt-4" />
        )}
      </div>
    </article>
  );
}
