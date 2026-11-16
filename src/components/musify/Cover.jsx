import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Cover({ src, alt = "", className, rounded = "rounded-xl", compact = false }) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-musify-card", rounded, className)}>
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div
      title="Sem capa disponível"
      className={cn(
        "group/art relative cursor-not-allowed select-none overflow-hidden bg-musify-card",
        rounded,
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_25%_0%,rgba(255,255,255,0.07),transparent_62%)]" />
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[3px]" />
      <div className="absolute inset-0 grid place-items-center">
        <Music2 className={cn("text-white/12", compact ? "h-1/2 w-1/2" : "h-1/3 w-1/3")} strokeWidth={1.4} />
      </div>

      <span
        className={cn(
          "absolute bottom-1 left-1 rounded-full bg-black/45 px-1.5 py-0.5 font-semibold uppercase tracking-[0.1em] text-white/45",
          compact ? "text-[7px]" : "text-[8.5px]",
        )}
      >
        Sem capa
      </span>

      <div className="pointer-events-none absolute inset-x-1 bottom-1 translate-y-2 rounded-lg bg-[#1b1e22]/95 px-2 py-1.5 opacity-0 shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)] ring-1 ring-white/8 backdrop-blur-md transition-all duration-500 ease-organic group-hover/art:translate-y-0 group-hover/art:opacity-100">
        <p className={cn("font-semibold text-white/85", compact ? "text-[9px]" : "text-[11px]")}>Sem capa</p>
        <p className={cn("leading-tight text-white/40", compact ? "text-[8px]" : "text-[10px]")}>Arte em preparação</p>
      </div>
    </div>
  );
}