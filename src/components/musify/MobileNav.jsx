import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Library, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Início", icon: Home },
  { to: "/search", label: "Buscar", icon: Search },
  { to: "/library", label: "Biblioteca", icon: Library },
  { to: "/profile", label: "Perfil", icon: User },
];

export default function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className="flex h-[54px] shrink-0 items-center justify-around rounded-[18px] bg-musify-surface px-2 shadow-[0_24px_60px_-50px_rgba(0,0,0,1)] lg:hidden">
      {items.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-1 text-[10px] font-semibold transition-colors duration-400 ease-organic",
              active ? "text-musify-text" : "text-musify-dim",
            )}
          >
            <Icon className={cn("h-[18px] w-[18px]", active && "text-musify-accent")} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}