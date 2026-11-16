import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import Cover from "@/components/musify/Cover";
import Section from "@/components/musify/Section";
import { library, shelves } from "@/lib/musicData";

export const Route = createFileRoute("/_site/library")({
  component: LibraryPage,
  head: () => ({ meta: [{ title: "A tua biblioteca · Musify" }] }),
});

const recent = shelves[1];

function LibraryPage() {
  return (
    <div className="px-3.5 pb-12 sm:px-6">
      <div className="animate-rise mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-musify-dim">Coleção</p>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-musify-text sm:text-[34px]">
            A tua biblioteca
          </h1>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-musify-hover/70 px-4 py-2 text-[12px] font-semibold text-musify-text transition-all duration-400 ease-organic hover:bg-musify-hover"
        >
          <Plus className="h-4 w-4" />
          Criar playlist
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {library.map((item, index) => (
          <Link
            key={item.id}
            to="/playlist/$playlistId"
            params={{ playlistId: item.id }}
            className="animate-rise group rounded-2xl bg-musify-card/50 p-3 transition-all duration-500 ease-organic hover:-translate-y-1 hover:bg-musify-hover hover:shadow-[0_24px_44px_-28px_rgba(0,0,0,0.95)]"
            style={{ animationDelay: `${80 + index * 60}ms` }}
          >
            <Cover src={item.cover} alt={item.title} className="aspect-square w-full" rounded="rounded-xl" />
            <p className="mt-3 truncate text-sm font-semibold text-musify-text">{item.title}</p>
            <p className="mt-0.5 truncate text-[12px] text-musify-dim">{item.subtitle}</p>
          </Link>
        ))}
      </div>

      <Section title={recent.title} items={recent.items} index={1} />
    </div>
  );
}