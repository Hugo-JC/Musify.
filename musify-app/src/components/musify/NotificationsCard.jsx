import { useEffect, useRef } from "react";
import { Disc3, Heart, Radio, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
  {
    id: 1,
    icon: Disc3,
    title: "Novo álbum na tua biblioteca",
    body: "O disco que guardaste já está completo para ouvir.",
    time: "há 12 min",
  },
  {
    id: 2,
    icon: Heart,
    title: "Playlist atualizada",
    body: "Adicionámos 6 faixas novas às tuas músicas favoritas.",
    time: "há 2 h",
  },
  {
    id: 3,
    icon: Radio,
    title: "Estação para ti",
    body: "Uma nova mistura de artistas que ouviste esta semana.",
    time: "ontem",
  },
  {
    id: 4,
    icon: Sparkles,
    title: "Descoberta da semana",
    body: "Há um artista novo parecido com o que ouves.",
    time: "há 3 dias",
  },
];

export default function NotificationsCard({ open, unread, onClose, onReadAll }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) onClose();
    };
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-label="Notificações"
      className="animate-soft-in absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(21rem,calc(100vw-1.75rem))] overflow-hidden rounded-2xl bg-musify-card shadow-[0_28px_60px_-24px_rgba(0,0,0,0.95)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-musify-dim">Notificações</span>
        <button
          type="button"
          onClick={onReadAll}
          className="rounded-full px-1 text-[11px] font-semibold text-musify-accent transition-colors duration-400 ease-organic hover:text-musify-text"
        >
          Marcar como lidas
        </button>
      </div>

      <ul className="max-h-[min(21rem,58vh)] overflow-y-auto px-1.5 pb-1.5">
        {notifications.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={onReadAll}
                className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors duration-400 ease-organic hover:bg-musify-hover"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-musify-surface text-musify-accent">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-musify-text">{item.title}</span>
                    {unread && item.id === 1 && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-musify-accent" />
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[11.5px] leading-snug text-musify-dim">
                    {item.body}
                  </span>
                  <span className={cn("mt-1 block text-[10.5px] uppercase tracking-[0.12em] text-musify-dim/60")}>
                    {item.time}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}