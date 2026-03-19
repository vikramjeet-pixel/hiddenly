import Image from "next/image";
import { User as UserIcon } from "lucide-react";

export default function FeedPost({ post, isLast = false }: { post: any; isLast?: boolean }) {
  // Extract robust fallbacks since Firestore schema differs from initial Mock UI schema
  const authorName = post.author?.name || "Nomad Traveler";
  const authorUsername = post.author?.username || "secret_hunter";
  const avatarUrl = post.author?.avatarUrl || null;
  const locationText = post.locationName || post.location || "Unknown Coordinate";
  const captionText = post.description || post.caption || post.title || "";
  const mainImage = (post.media && post.media[0]) || post.imageUrl || "";

  return (
    <article id={`post-${post.id}`} className="flex flex-col gap-3 md:gap-4 p-4 md:p-6 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-3xl border border-neutral-200 dark:border-white/10 shadow-sm">
      {/* Author Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 md:size-11 rounded-full bg-primary/10 overflow-hidden border border-primary/20 flex items-center justify-center shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${authorName}'s avatar`}
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <UserIcon className="size-5 text-primary" strokeWidth={2.5} />
            )}
          </div>
          <div>
            <h4 className="text-sm md:text-base font-bold font-serif tracking-tight">
              {authorName}
            </h4>
            <div className="flex items-center gap-1 text-neutral-500 text-[10px] tracking-widest uppercase font-bold">
              <span className="material-symbols-outlined !text-xs text-primary">
                location_on
              </span>
              <span>{locationText}</span>
            </div>
          </div>
        </div>
        
        {post.type && (
          <span className="hidden md:inline-flex px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-bold rounded-full">
            {post.type}
          </span>
        )}
      </div>

      {/* Post Image */}
      {mainImage && (
        <div className="rounded-2xl overflow-hidden bg-black/10 dark:bg-black/50 relative aspect-[16/10] mt-2 border border-neutral-200 dark:border-white/10 shadow-inner group">
          <Image
            src={mainImage}
            alt={post.title || "Hidden Gem Media"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            priority={false}
          />
        </div>
      )}

      {/* Title & Actions */}
      <div className="flex flex-col gap-3 mt-1">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black font-serif italic tracking-tight text-foreground pr-4">
            {post.title}
          </h3>
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <button className="flex items-center gap-1.5 group active:scale-90 transition-transform">
              <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">
                favorite
              </span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-500">
                {post.likes || 0}
              </span>
            </button>
            <button className="flex items-center gap-1.5 group active:scale-90 transition-transform hidden sm:flex">
              <span className="material-symbols-outlined text-neutral-400 group-hover:text-primary transition-colors">
                chat_bubble
              </span>
            </button>
            <button className="text-neutral-400 hover:text-primary transition-colors active:scale-90">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </div>

        {/* Caption */}
        {captionText && (
          <p className="text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
            <span className="font-bold tracking-wide mr-2 text-foreground">@{authorUsername}</span>
            {captionText}
          </p>
        )}

        {!isLast && (
          <div className="h-px bg-neutral-200 dark:bg-white/10 w-full mt-4" />
        )}
      </div>
    </article>
  );
}
