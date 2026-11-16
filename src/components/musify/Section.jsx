import { ChevronRight } from "lucide-react";
import MediaCard from "./MediaCard";

export default function Section({ title, items, action = "Mostrar tudo", index = 0 }) {
  return (
    <section
      className="animate-rise mt-8"
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-musify-text sm:text-xl">{title}</h2>
        <button
          type="button"
          className="group flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim transition-colors duration-300 ease-organic hover:text-musify-text"
        >
          {action}
          <ChevronRight className="h-3.5 w-3.5 transition-colors duration-300 ease-organic" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}