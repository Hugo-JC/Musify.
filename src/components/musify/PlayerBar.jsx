import { usePlayer } from "./PlayerContext";
import { formatTime } from "@/lib/musicData";
import Cover from "./Cover";
import Scrubber from "./Scrubber";
import { Heart, ListMusic, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

const controlClass =
  "grid place-items-center rounded-full text-musify-dim transition-all duration-400 ease-organic hover:text-musify-text";

export default function PlayerBar() {
  const {
    current,
    playing,
    toggle,
    next,
    previous,
    progress,
    seek,
    volume,
    setVolume,
    shuffle,
    setShuffle,
    repeat,
    setRepeat,
    liked,
    toggleLike,
  } = usePlayer();

  const isLiked = liked.has(current.id);

  return (
    <div className="flex h-[68px] shrink-0 items-center gap-3 rounded-[20px] bg-musify-surface px-2.5 shadow-[0_24px_60px_-44px_rgba(0,0,0,1)] sm:px-3.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
        <Cover src={current.cover} alt={current.title} compact rounded="rounded-lg" className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-semibold leading-tight text-musify-text">{current.title}</p>
          <p className="truncate text-[11px] leading-tight text-musify-dim">{current.artist}</p>
        </div>
        <button
          type="button"
          onClick={() => toggleLike(current.id)}
          aria-label="Guardar"
          className={cn("ml-1 shrink-0 p-1.5 max-sm:hidden", controlClass, isLiked && "text-musify-accent hover:text-musify-accent")}
        >
          <Heart className={cn("h-[15px] w-[15px]", isLiked && "fill-current")} />
        </button>
      </div>

      <div className="flex w-[42%] max-w-[460px] flex-col items-center gap-1 md:w-[460px]">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setShuffle(!shuffle)}
            aria-label="Aleatório"
            className={cn("h-7 w-7 max-sm:hidden", controlClass, shuffle && "text-musify-accent hover:text-musify-accent")}
          >
            <Shuffle className="h-[15px] w-[15px]" />
          </button>
          <button type="button" onClick={previous} aria-label="Anterior" className={cn("h-7 w-7", controlClass)}>
            <SkipBack className="h-4 w-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar" : "Reproduzir"}
            className="grid h-9 w-9 place-items-center rounded-full bg-musify-text text-[#0a0b0d] shadow-[0_10px_24px_-12px_rgba(255,255,255,0.6)] transition-all duration-400 ease-organic hover:scale-105 hover:bg-white"
          >
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
          <button type="button" onClick={next} aria-label="Seguinte" className={cn("h-7 w-7", controlClass)}>
            <SkipForward className="h-4 w-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => setRepeat(!repeat)}
            aria-label="Repetir"
            className={cn("h-7 w-7 max-sm:hidden", controlClass, repeat && "text-musify-accent hover:text-musify-accent")}
          >
            <Repeat className="h-[15px] w-[15px]" />
          </button>
        </div>

        <div className="flex w-full items-center gap-2">
          <span className="hidden w-8 shrink-0 text-right text-[10px] tabular-nums text-musify-dim sm:block">
            {formatTime(progress)}
          </span>
          <Scrubber value={progress} max={current.duration} onSeek={seek} />
          <span className="hidden w-8 shrink-0 text-[10px] tabular-nums text-musify-dim sm:block">
            {formatTime(current.duration)}
          </span>
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-end gap-2.5 md:flex">
        <button type="button" aria-label="Fila" className={cn("h-7 w-7", controlClass)}>
          <ListMusic className="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          onClick={() => setVolume(volume === 0 ? 0.72 : 0)}
          aria-label="Volume"
          className={cn("h-7 w-7", controlClass)}
        >
          {volume === 0 ? <VolumeX className="h-[15px] w-[15px]" /> : <Volume2 className="h-[15px] w-[15px]" />}
        </button>
        <div className="w-20">
          <Scrubber value={volume} max={1} onSeek={setVolume} />
        </div>
      </div>
    </div>
  );
}