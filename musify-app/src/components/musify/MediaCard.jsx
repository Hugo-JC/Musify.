import { Pause, Play } from "lucide-react";
import Cover from "./Cover";
import { usePlayer } from "./PlayerContext";
import { cn } from "@/lib/utils";

export default function MediaCard({ item }) {
  const { current, playing, playTrack, toggle } = usePlayer();
  const disabled = !item.cover;
  const isCurrent = current?.id === item.track?.id;
  const isPlaying = isCurrent && playing;

  const handleClick = () => {
    if (disabled || !item.track) return;
    if (isCurrent) toggle();
    else playTrack(item.track);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl p-3 text-left transition-all duration-500 ease-organic",
        disabled
          ? "cursor-not-allowed bg-musify-card/40 opacity-70"
          : "cursor-pointer bg-musify-card/50 hover:bg-musify-hover hover:shadow-[0_22px_42px_-28px_rgba(0,0,0,0.95)]",
      )}
    >
      <div className="relative">
        <Cover src={item.cover} alt={item.title} className="aspect-square w-full" rounded="rounded-xl" />
        {!disabled && (
          <span
            className={cn(
              "absolute bottom-2 right-2 grid h-10 w-10 place-items-center rounded-full bg-musify-accent text-white shadow-[0_12px_26px_-12px_rgba(237,23,64,0.6)] transition-all duration-500 ease-organic",
              isCurrent
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
            )}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          </span>
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-musify-text">{item.title}</p>
      <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-musify-dim">{item.subtitle}</p>
    </button>
  );
}