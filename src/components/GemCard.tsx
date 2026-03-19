import Image from "next/image";
import type { GemCardData } from "@/data/mockData";

interface GemCardProps {
  gem: GemCardData;
}

export default function GemCard({ gem }: GemCardProps) {
  return (
    <div
      id={`gem-card-${gem.id}`}
      className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square hover:scale-[1.02] active:scale-95 transition-transform duration-300 ease-out"
    >
      <Image
        src={gem.imageUrl}
        alt={gem.imageAlt}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-3 md:p-4">
        <span className="text-white text-xs md:text-sm font-bold">
          {gem.title}
        </span>
        <span className="text-white/70 text-[10px] md:text-xs">
          {gem.secretSpots}
        </span>
      </div>
    </div>
  );
}
