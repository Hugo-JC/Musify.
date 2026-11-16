import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Plus, Search } from "lucide-react";
import Cover from "./Cover";
import { library } from "@/lib/musicData";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Início", icon: Home },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/library", label: "Biblioteca", icon: Library },
];

export default function Sidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <aside className="hidden w-[264px] shrink-0 flex-col gap-2 lg:flex">
      <div className="rounded-[20px] bg-musify-surface p-3 shadow-[0_24px_60px_-52px_rgba(0,0,0,1)]">
        <Link to="/" className="flex items-center gap-2.5 px-2 py-2">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[linear-gradient(150deg,#ff5a72,#c90e32)] shadow-[0_10px_24px_-14px_rgba(237,23,64,0.85)]">
            <span className="flex items-end gap-[3px]">
              {[10, 16, 8, 14].map((height, index) => (
                <span
                  key={index}
                  className="w-[3px] rounded-full bg-[#2a0309]"
                  style={{ height: `${height}px` }}
                />
              ))}
            </span>
          </span>
          <span className="font-display text-[18px] font-semibold tracking-tight text-musify-text">
            Mus<span className="text-musify-accent">fy</span>
          </span>
        </Link>

        <nav className="mt-2 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-400 ease-organic",
                  active
                    ? "bg-musify-hover text-musify-text"
                    : "text-musify-dim hover:bg-musify-hover/50 hover:text-musify-text",
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors duration-400 ease-organic",
                    active ? "text-musify-accent" : "text-musify-dim group-hover:text-musify-text",
                  )}
                  strokeWidth={2}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-[20px] bg-musify-surface p-3 shadow-[0_24px_60px_-52px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-musify-dim">A tua biblioteca</span>
          <button
            type="button"
            aria-label="Criar playlist"
            className="grid h-7 w-7 place-items-center rounded-full text-musify-dim transition-all duration-400 ease-organic hover:bg-musify-hover hover:text-musify-text"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          {library.map((item) => (
            <Link
              key={item.id}
              to="/playlist/$playlistId"
              params={{ playlistId: item.id }}
              className="group flex items-center gap-3 rounded-xl p-2 transition-all duration-400 ease-organic hover:bg-musify-hover"
            >
              <Cover
                src={item.cover}
                alt={item.title}
                compact
                rounded="rounded-lg"
                className="h-11 w-11 shrink-0"
              />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-musify-text">{item.title}</span>
                <span className="block truncate text-[11px] text-musify-dim">{item.subtitle}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}