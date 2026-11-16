import { cn } from "@/lib/utils";

export default function Scrubber({ value, max, onSeek, className }) {
  const percent = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  const handleClick = (event) => {
    if (!onSeek) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * max);
  };

  return (
    <div
      onClick={handleClick}
      role="slider"
      tabIndex={0}
      aria-valuenow={Math.round(value)}
      aria-valuemax={max}
      aria-label="Progresso"
      className={cn(
        "group/scrub relative h-1 w-full cursor-pointer rounded-full bg-white/12 transition-all duration-300 ease-organic hover:bg-white/20",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-white/75 transition-all duration-300 ease-organic group-hover/scrub:bg-musify-accent"
        style={{ width: `${percent}%` }}
      />
      <span
        className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_0_4px_rgba(0,0,0,0.25)] transition-opacity duration-300 ease-organic group-hover/scrub:opacity-100"
        style={{ left: `${percent}%` }}
      />
    </div>
  );
}