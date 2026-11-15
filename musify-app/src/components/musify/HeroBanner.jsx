import { Play, Plus, Sparkles } from "lucide-react";
import { hero } from "@/lib/musicData";
import { usePlayer } from "./PlayerContext";

export default function HeroBanner() {
  const { playTrack } = usePlayer();

  return (
    <section className="animate-rise relative mt-6 overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#2a0a12_0%,#170d11_52%,#0c0f13_100%)] p-6 shadow-[0_24px_52px_-46px_rgba(0,0,0,0.95)] sm:p-9">
      <div className="pointer-events-none absolute -left-10 -top-24 h-64 w-64 animate-[musify-breathe_11s_ease-in-out_infinite] rounded-full bg-musify-accent/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full bg-[#2b7bd6]/12 blur-[90px]" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-musify-accent">
            <Sparkles className="h-3 w-3" />
            {hero.eyebrow}
          </span>
          <h1 className="mt-4 font-display text-[28px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[40px]">
            {hero.title}
            <br />
            <span className="text-musify-accent">{hero.highlight}</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/62">{hero.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playTrack(hero.track)}
              className="flex items-center gap-2 rounded-full bg-musify-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(237,23,64,0.55)] transition-all duration-400 ease-organic hover:scale-[1.03] hover:bg-musify-accent-strong"
            >
              <Play className="h-4 w-4 fill-current" />
              Ouvir agora
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2.5 text-sm font-semibold text-white/85 transition-all duration-400 ease-organic hover:bg-white/14 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Seguir
            </button>
          </div>
        </div>

        <div className="relative hidden h-44 w-64 shrink-0 lg:block">
          {hero.covers.map((src, index) => (
            <img
              key={src}
              src={src}
              alt=""
              loading="lazy"
              className="absolute h-36 w-36 rounded-2xl object-cover shadow-[0_28px_50px_-26px_rgba(0,0,0,0.95)] transition-transform duration-700 ease-organic hover:z-10 hover:-translate-y-2"
              style={{
                left: `${index * 52}px`,
                top: `${index === 1 ? 8 : index === 2 ? 26 : 0}px`,
                transform: `rotate(${index === 0 ? -7 : index === 1 ? 0 : 7}deg)`,
                opacity: 1 - index * 0.06,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}