import Image from "next/image";

interface GemCardProps {
  gem: any;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function GemCard({ gem, onDelete, onEdit }: GemCardProps) {
  const mainImage = (gem.media && gem.media[0]) || gem.imageUrl || "";
  const locationText = gem.locationName || gem.location || "Unknown Coordinate";

  return (
    <div
      id={`gem-card-${gem.id}`}
      className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square hover:scale-[1.02] active:scale-95 transition-all duration-300 ease-out border border-neutral-200"
    >
      <Image
        src={mainImage}
        alt={gem.title || "Gem Media"}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover transition-transform duration-500 group-hover:scale-110 bg-black/5"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 md:p-4">
        <span className="text-white text-sm md:text-base font-bold font-serif italic tracking-tight mb-0.5">
          {gem.title}
        </span>
        <span className="text-white/80 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
          {locationText}
        </span>
      </div>

      {/* Management Actions (Only visible if props are passed) */}
      {(onDelete || onEdit) && (
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit(gem.id);
              }}
              className="size-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-lg"
              title="Edit Gem"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(gem.id);
              }}
              className="size-8 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-lg"
              title="Delete Gem"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
