import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, Heart, MoreHorizontal, Pause, Play } from "lucide-react";
import Cover from "@/components/musify/Cover";
import { usePlayer } from "@/components/musify/PlayerContext";
import { formatTime, library, tracks } from "@/lib/musicData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/playlist/$playlistId")({
  component: PlaylistPage,
  head: () => ({ meta: [{ title: "Playlist · Musify" }] }),
});

function PlaylistPage() {
  const { playlistId } = Route.useParams();
  const { playTrack, current, playing, toggle, liked, toggleLike } = usePlayer();

  const playlist =
    library.find((item) => item.id === playlistId) ?? {
      id: playlistId,
      title: "Mix Semanal",
      subtitle: "Playlist · 50 músicas",
      cover: null,
    };

  const list = tracks;
  const total = list.reduce((sum, track) => sum + track.duration, 0);
  const isPlayingList = playing && list.some((track) => track.id === current.id);

  return (
    <div className="pb-12">
      <div className="relative overflow-hidden px-3.5 pb-6 pt-8 sm:px-6">
        <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full bg-musify-accent/12 blur-[90px]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end">
          <Cover
            src={playlist.cover}
            alt={playlist.title}
            rounded="rounded-2xl"
            className="h-40 w-40 shrink-0 shadow-[0_30px_60px_-36px_rgba(0,0,0,1)] sm:h-48 sm:w-48"
          />
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-musify-dim">Playlist</p>
            <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight tracking-tight text-musify-text sm:text-[44px]">
              {playlist.title}
            </h1>
            <p className="mt-2 text-[12.5px] text-musify-dim">
              {playlist.subtitle} · {formatTime(total)} de duração
            </p>
          </div>
        </div>

        <div className="relative mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (isPlayingList ? toggle() : playTrack(list[0], list))}
            aria-label="Reproduzir"
            className="grid h-12 w-12 place-items-center rounded-full bg-musify-accent text-white shadow-[0_18px_38px_-20px_rgba(237,23,64,0.55)] transition-all duration-400 ease-organic hover:scale-105 hover:bg-musify-accent-strong"
          >
            {isPlayingList ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
          <button
            type="button"
            aria-label="Mais opções"
            className="grid h-9 w-9 place-items-center rounded-full text-musify-dim transition-colors duration-400 ease-organic hover:text-musify-text"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
          <Link
            to="/library"
            className="ml-auto text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim transition-colors duration-400 hover:text-musify-text"
          >
            Biblioteca
          </Link>
        </div>
      </div>

      <div className="px-3.5 sm:px-6">
        <div className="mb-2 flex items-center gap-3 px-2 text-[10.5px] uppercase tracking-[0.16em] text-musify-dim/70">
          <span className="w-4 text-center">#</span>
          <span>Título</span>
          <span className="ml-auto">Álbum</span>
          <Clock3 className="h-3.5 w-3.5" />
        </div>

        <div className="space-y-0.5">
          {list.map((track, index) => {
            const isCurrent = current.id === track.id;
            const isLiked = liked.has(track.id);
            return (
              <div
                key={track.id}
                className={cn(
                  "group flex items-center gap-3 rounded-xl p-2 transition-colors duration-400 ease-organic hover:bg-musify-hover",
                  isCurrent && "bg-musify-hover/70",
                )}
              >
                <button
                  type="button"
                  onClick={() => (isCurrent ? toggle() : playTrack(track, list))}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className="w-4 shrink-0 text-center text-[11px] tabular-nums text-musify-dim group-hover:hidden">
                    {index + 1}
                  </span>
                  <span className="hidden w-4 shrink-0 place-items-center text-musify-text group-hover:grid">
                    {isCurrent && playing ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
                  </span>
                  <Cover src={track.cover} alt={track.title} compact rounded="rounded-md" className="h-10 w-10 shrink-0" />
                  <span className="min-w-0">
                    <span className={cn("block truncate text-[13px] font-semibold", isCurrent ? "text-musify-accent" : "text-musify-text")}>
                      {track.title}
                    </span>
                    <span className="block truncate text-[11px] text-musify-dim">{track.artist}</span>
                  </span>
                </button>

                <span className="hidden w-40 truncate text-[11px] text-musify-dim lg:block">{track.album}</span>
                <button
                  type="button"
                  onClick={() => toggleLike(track.id)}
                  aria-label="Guardar"
                  className={cn(
                    "hidden h-7 w-7 shrink-0 place-items-center rounded-full transition-colors duration-300 sm:grid",
                    isLiked ? "text-musify-accent" : "text-musify-dim opacity-0 group-hover:opacity-100 hover:text-musify-text",
                  )}
                >
                  <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                </button>
                <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-musify-dim">
                  {formatTime(track.duration)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}