import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import NotificationsCard from "./NotificationsCard";

export default function TopBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const router = useRouter();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  // Wait for the session so the server and the first client render agree (no hydration mismatch).
  const signedIn = !isLoadingAuth && isAuthenticated;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const submit = (event) => {
    event.preventDefault();
    navigate({ to: "/search", search: { q: query } });
  };

  const initial = (user?.full_name || user?.email || "M").trim().charAt(0).toUpperCase();

  return (
    <header className="relative z-20 flex shrink-0 items-center gap-2 px-3.5 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
      <div className="hidden items-center gap-1.5 md:flex">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.history.back()}
          className="grid h-8 w-8 place-items-center rounded-full bg-musify-hover/60 text-musify-dim transition-all duration-400 ease-organic hover:bg-musify-hover hover:text-musify-text"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Avançar"
          onClick={() => router.history.forward()}
          className="grid h-8 w-8 place-items-center rounded-full bg-musify-hover/60 text-musify-dim transition-all duration-400 ease-organic hover:bg-musify-hover hover:text-musify-text"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <form
        onSubmit={submit}
        className="flex h-11 min-w-0 flex-1 items-center rounded-full bg-musify-hover/55 px-4 transition-all duration-400 ease-organic focus-within:bg-musify-hover sm:max-w-[420px]"
      >
        <Search className="h-4 w-4 shrink-0 text-musify-dim" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Artistas, músicas ou podcasts"
          className="w-full bg-transparent px-3 text-[13px] text-musify-text placeholder:text-musify-dim/70 focus:outline-none"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
        <div className="relative">
          <button
            type="button"
            aria-label="Notificações"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((value) => !value)}
            className="relative grid h-9 w-9 place-items-center rounded-full text-musify-dim transition-all duration-400 ease-organic hover:bg-musify-hover hover:text-musify-text"
          >
            <Bell className="h-[17px] w-[17px]" />
            {hasUnread && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-musify-accent" />}
          </button>
          <NotificationsCard
            open={notificationsOpen}
            unread={hasUnread}
            onClose={() => setNotificationsOpen(false)}
            onReadAll={() => setHasUnread(false)}
          />
        </div>

        {signedIn ? (
          <Link
            to="/profile"
            className="flex items-center gap-2 rounded-full bg-musify-hover/55 py-1 pl-1 pr-3 transition-all duration-400 ease-organic hover:bg-musify-hover"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[linear-gradient(150deg,#ff5a72,#c90e32)] text-[13px] font-bold text-white">
              {initial}
            </span>
            <span className="hidden max-w-[120px] truncate text-[12px] font-semibold text-musify-text sm:block">
              {user?.full_name || "O meu perfil"}
            </span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="rounded-full bg-musify-text px-4 py-2 text-[12px] font-bold text-[#0a0b0d] transition-all duration-400 ease-organic hover:scale-[1.03] hover:bg-white"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}