import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, Mail, Pencil } from "lucide-react";
import Cover from "@/components/musify/Cover";
import { useAuth } from "@/lib/AuthContext";
import { library, shelves } from "@/lib/musicData";

export const Route = createFileRoute("/_site/_authed/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "O meu perfil · Musify" }] }),
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const name = user?.full_name || "Ouvinte Musify";
  const initial = name.trim().charAt(0).toUpperCase();
  const recent = shelves[0].items.slice(0, 3);

  const stats = [
    { label: "Playlists", value: library.length },
    { label: "Músicas guardadas", value: 128 },
    { label: "Horas ouvidas", value: 42 },
  ];

  return (
    <div className="px-3.5 pb-12 sm:px-6">
      <section className="animate-rise relative mt-6 overflow-hidden rounded-[22px] bg-[linear-gradient(120deg,#2a0a12_0%,#170d11_55%,#0c0f13_100%)] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-musify-accent/10 blur-[80px]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[linear-gradient(150deg,#ff5a72,#c90e32)] font-display text-3xl font-bold text-white shadow-[0_20px_42px_-26px_rgba(237,23,64,0.6)]">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-musify-accent">Perfil</p>
            <h1 className="mt-1.5 truncate font-display text-[26px] font-semibold tracking-tight text-white sm:text-[34px]">
              {name}
            </h1>
            <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/55">
              <Mail className="h-3.5 w-3.5" />
              {user?.email || "sem email associado"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[12px] font-semibold text-white/85 transition-all duration-400 ease-organic hover:bg-white/14 hover:text-white"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar perfil
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="flex items-center gap-2 rounded-full bg-white/8 px-4 py-2 text-[12px] font-semibold text-white/85 transition-all duration-400 ease-organic hover:bg-white/14 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>

        <div className="relative mt-7 grid grid-cols-3 gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/6 px-4 py-3">
              <p className="font-display text-xl font-semibold text-white">{stat.value}</p>
              <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.14em] text-white/45">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-8" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-musify-text">Ouvido recentemente</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {recent.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl bg-musify-card/50 p-2.5 transition-colors duration-400 ease-organic hover:bg-musify-hover"
            >
              <Cover src={item.cover} alt={item.title} compact rounded="rounded-lg" className="h-12 w-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-musify-text">{item.title}</p>
                <p className="truncate text-[11px] text-musify-dim">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="animate-rise mt-8" style={{ animationDelay: "200ms" }}>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-musify-text">As tuas playlists</h2>
          <Link to="/library" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-musify-dim hover:text-musify-text">
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {library.slice(0, 4).map((item) => (
            <Link
              key={item.id}
              to="/playlist/$playlistId"
              params={{ playlistId: item.id }}
              className="group rounded-2xl bg-musify-card/50 p-3 transition-colors duration-500 ease-organic hover:bg-musify-hover"
            >
              <Cover src={item.cover} alt={item.title} className="aspect-square w-full" rounded="rounded-xl" />
              <p className="mt-3 truncate text-sm font-semibold text-musify-text">{item.title}</p>
              <p className="mt-0.5 truncate text-[12px] text-musify-dim">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}