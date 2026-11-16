import { createFileRoute } from "@tanstack/react-router";
import HeroBanner from "@/components/musify/HeroBanner";
import FilterPills from "@/components/musify/FilterPills";
import Section from "@/components/musify/Section";
import { shelves } from "@/lib/musicData";

export const Route = createFileRoute("/_site/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "Musify — Ouve o que te move" },
      { name: "description", content: "Música, álbuns e playlists num só lugar. Descobre o teu próximo som." },
    ],
  }),
});

function Home() {
  return (
    <div className="px-3.5 pb-12 sm:px-6">
      <HeroBanner />
      <FilterPills />

      {shelves.map((shelf, index) => (
        <Section key={shelf.id} title={shelf.title} items={shelf.items} index={index} />
      ))}

      <p className="mt-12 text-[10.5px] uppercase tracking-[0.18em] text-musify-dim/50">
        Demonstração de interface · conteúdo de exemplo
      </p>
    </div>
  );
}