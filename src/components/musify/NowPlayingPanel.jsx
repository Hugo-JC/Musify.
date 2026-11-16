import { Heart, MoreHorizontal, Play, Plus } from "lucide-react";
import Cover from "./Cover";
import { usePlayer } from "./PlayerContext";
import { cn } from "@/lib/utils";

export default function NowPlayingPanel() {
  const { current, queue, playing, playTrack, toggle, liked, toggleLike } = usePlayer();
  const isLiked = liked.has(current.id);

  const upcoming = queue
    .slice(queue.findIndex((track) => track.id === current.id) + 1)
    .concat(queue.slice(0, Math.max(0, queue.findIndex((track) => track.id === current.id))))
    .slice(0, 5);

  return (
    <aside className="hidden w-[292px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-musify-surface shadow-[0_24px_60px_-52px_rgba(0,0,0,1)] xl:flex">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-musify-dim">A tocar</p>
        <button
          type="button"
          aria-label="Mais opções"
          className="grid h-7 w-7 place-items-center rounded-full text-musify-dim transition-colors duration-400 ease-organic hover:bg-musify-hover hover:text-musify-text"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="relative">
          <Cover
            src={current.cover}
            alt={current.title}
            rounded="rounded-2xl"
            className="aspect-square w-full shadow-[0_30px_60px_-38px_rgba(0,0,0,1)]"
          />
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold leading-tight text-musify-text">{current.title}</p>
            <p className="mt-1 truncate text-[12px] text-musify-dim">{current.artist}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleLike(current.id)}
            aria-label="Guardar"
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-400 ease-organic hover:bg-musify-hover",
              isLiked ? "text-musify-accent" : "text-musify-dim hover:text-musify-text",
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-musify-card/70 p-3.5 shadow-[0_18px_40px_-34px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-musify-dim">Créditos</span>
            <span className="text-[11px] font-semibold text-musify-text/70">Mostrar tudo</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[12.5px] font-semibold text-musify-text">{current.artist}</p>
              <p className="truncate text-[11px] text-musify-dim">Compositor · {current.album}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-full bg-musify-hover px-3 py-1.5 text-[11px] font-semibold text-musify-text transition-all duration-400 ease-organic hover:bg-musify-accent hover:text-white"
            >
              A seguir
            </button>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-musify-dim">Próximas na fila</span>
            <button type="button" className="text-[11px] font-semibold text-musify-text/70 transition-colors hover:text-musify-text">
              Abrir fila
            </button>
          </div>

          <div className="mt-2.5 space-y-0.5">
            {upcoming.map((track) => (
              <button
                key={track.id}
                type="button"
                onClick={() => playTrack(track)}
                className="group flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors duration-400 ease-organic hover:bg-musify-hover"
              >
                <Cover src={track.cover} alt={track.title} compact rounded="rounded-md" className="h-9 w-9 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-musify-text">{track.title}</span>
                  <span className="block truncate text-[10.5px] text-musify-dim">{track.artist}</span>
                </span>
                <Play className="h-3 w-3 shrink-0 text-musify-dim opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={toggle}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-musify-hover/70 py-2 text-[11.5px] font-semibold text-musify-text transition-all duration-400 ease-organic hover:bg-musify-hover"
        >
          <Plus className="h-3.5 w-3.5" />
          {playing ? "A tocar agora" : "Continuar a ouvir"}
        </button>
      </div>
    </aside>
  );
}