import { useState } from "react";
import { filters } from "@/lib/musicData";
import { cn } from "@/lib/utils";

export default function FilterPills() {
  const [active, setActive] = useState(filters[0]);

  return (
    <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActive(filter)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-400 ease-organic",
            active === filter
              ? "bg-musify-text text-[#0a0b0d] shadow-[0_8px_22px_-12px_rgba(255,255,255,0.55)]"
              : "bg-musify-hover/70 text-musify-text/80 hover:bg-musify-hover hover:text-musify-text",
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}