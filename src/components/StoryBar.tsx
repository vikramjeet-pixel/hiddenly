import Image from "next/image";
import type { Story } from "@/data/mockData";

interface StoryBarProps {
  stories: Story[];
}

export default function StoryBar({ stories }: StoryBarProps) {
  return (
    <div
      id="story-bar"
      className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide"
    >
      {stories.map((story) => (
        <button
          key={story.id}
          id={`story-${story.id}`}
          className="flex flex-col items-center gap-1.5 md:gap-2 shrink-0 active:scale-95 transition-transform"
        >
          <div
            className={`size-14 md:size-16 rounded-full p-0.5 ${
              story.isOwn || story.hasNewStory
                ? "border-2 border-primary"
                : "border-2 border-slate-200"
            }`}
          >
            <div className="size-full rounded-full bg-slate-200 overflow-hidden relative">
              <Image
                src={story.imageUrl}
                alt={story.alt}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          </div>
          <span className="text-[10px] md:text-[11px] font-medium text-slate-700">
            {story.name}
          </span>
        </button>
      ))}
    </div>
  );
}
