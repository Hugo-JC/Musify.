import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Play, Search as SearchIcon } from "lucide-react";
import Cover from "@/components/musify/Cover";
import { usePlayer } from "@/components/musify/PlayerContext";
import { formatTime, shelves, tracks } from "@/lib/musicData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_site/search")({
  validateSearch: (search) => ({
    q: typeof search.q === "string" && search.q.length ? search.q : undefined,
  }),
  component: SearchPage,
  head: () => ({ meta: [{ title: "Buscar · Musify" }] }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q ?? "");
  const { current, playing, playTrack, toggle } = usePlayer();

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return [];
    return tracks.filter(
      (track) =>
        track.title.toLowerCase().includes(needle) ||
        track.artist.toLowerCase().includes(needle) ||
        track.album.toLowerCase().includes(needle),
    );
  }, [term]);

  const collections = useMemo(
    () =>
      shelves
        .flatMap((shelf) => shelf.items)
        .filter((item) => item.title.toLowerCase().includes(term.trim().toLowerCase()))
        .slice(0, 6),
    [term],
  );

  return (
    <div className="px-3.5 pb-12 sm:px-6">
      <div className="animate-rise mt-6 flex h-12 items-center rounded-full bg-musify-card/70 px-4 shadow-[0_20px_50px_-45px_rgba(0,0,0,1)]">
        <SearchIcon className="h-4 w-4 text-musify-dim" />
        <input
          autoFocus
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="O que queres ouvir hoje?"
          className="w-full bg-transparent px-3 text-sm text-musify-text placeholder:text-musify-dim/70 focus:outline-none"
        />
      </div>

      {!term.trim() && (
        <div className="animate-rise mt-10" style={{ animationDelay: "80ms" }}>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-musify-text">Explorar tudo</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-musify-dim">
            Procura por artistas, músicas, álbuns ou podcasts. Começa a escrever para veres resultados.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {["Rap", "Ao vivo", "Chill", "Vinil", "Sessões", "Luanda"].map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => setTerm(tag)}
                className="animate-rise h-24 rounded-2xl bg-musify-card/60 p-4 text-left transition-all duration-500 ease-organic hover:-translate-y-1 hover:bg-musify-hover"
                style={{ animationDelay: `${120 + index * 60}ms` }}
              >
                <span className="font-display text-sm font-semibold text-musify-text">{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {term.trim() && (
        <>
          {collections.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {collections.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-musify-card/60 p-2">
                  <Cover src={item.cover} alt={item.title} compact rounded="rounded-md" className="h-11 w-11 shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-musify-text">{item.title}</span>
                    <span className="block truncate text-[11px] text-musify-dim">{item.subtitle}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-musify-text">Músicas</h2>
            {results.length === 0 ? (
              <p className="rounded-2xl bg-musify-card/50 p-6 text-sm text-musify-dim">
                Nada encontrado para “{term}”. Tenta outro nome de artista ou música.
              </p>
            ) : (
              <div className="space-y-0.5">
                {results.map((track, index) => {
                  const isCurrent = current.id === track.id;
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => (isCurrent ? toggle() : playTrack(track))}
                      className={cn(
                        "animate-rise group flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-400 ease-organic hover:bg-musify-hover",
                        isCurrent && "bg-musify-hover/70",
                      )}
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      <span className="hidden w-4 shrink-0 text-center text-[11px] tabular-nums text-musify-dim sm:block">
                        {index + 1}
                      </span>
                      <Cover src={track.cover} alt={track.title} compact rounded="rounded-md" className="h-10 w-10 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px] font-semibold", isCurrent ? "text-musify-accent" : "text-musify-text")}>
                          {track.title}
                        </span>
                        <span className="block truncate text-[11px] text-musify-dim">{track.artist}</span>
                      </span>
                      <span className="hidden text-[11px] text-musify-dim md:block">{track.album}</span>
                      <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-musify-dim">
                        {formatTime(track.duration)}
                      </span>
                      <Play
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-musify-text transition-opacity duration-300",
                          isCurrent && playing ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}