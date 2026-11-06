'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Heart, Home, Library, Plus, Search, Sparkles } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useLibrary } from '@/stores/useLibrary';

type Filter = 'playlists' | 'artists' | null;

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex h-12 items-center gap-4 rounded-2xl px-4 text-base font-semibold transition-all duration-200',
        active ? 'bg-surface text-white shadow-sm ring-1 ring-line/50' : 'text-white/70 hover:bg-surface-2 hover:text-white',
      )}
    >
      <span className={clsx(active ? 'text-accent' : 'text-white/70')}>{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const likedCount = useLibrary((s) => s.liked.length);
  const [filter, setFilter] = useState<Filter>(null);

  const chip = (key: Exclude<Filter, null>, label: string) => (
    <button
      type="button"
      aria-pressed={filter === key}
      onClick={() => setFilter(filter === key ? null : key)}
      className={clsx(
        'h-8 rounded-full px-4 text-xs font-semibold tracking-wide transition-all',
        filter === key ? 'bg-accent text-on-accent shadow-sm' : 'bg-surface text-white/80 hover:bg-line hover:text-white',
      )}
    >
      {label}
    </button>
  );

  return (
    <aside className="flex min-h-0 flex-col px-4 pb-4 pt-4 border-r border-line/30" aria-label="Navegação e biblioteca">
      <nav className="flex flex-col gap-2">
        <NavItem
          href="/"
          label="Home"
          active={pathname === '/'}
          icon={<Home className={clsx('h-6 w-6 stroke-[2.2]', pathname === '/' && 'fill-accent/20')} />}
        />
        <NavItem
          href="/search"
          label="Search"
          active={pathname.startsWith('/search')}
          icon={<Search className="h-6 w-6 stroke-[2.2]" />}
        />
        <NavItem
          href="/account"
          label="Conta YouTube"
          active={pathname.startsWith('/account')}
          icon={<Sparkles className={clsx('h-6 w-6 stroke-[2.2]', pathname.startsWith('/account') && 'fill-accent/20')} />}
        />
      </nav>

      <div className="mt-8 flex items-center justify-between pl-2 pr-1">
        <div className="flex items-center gap-3 text-base font-semibold text-white/90">
          <Library className="h-6 w-6 text-accent stroke-[2.2]" aria-hidden />
          A tua Biblioteca
        </div>
        <Link
          href="/library"
          aria-label="Ver biblioteca"
          className="rounded-full p-1.5 text-white/70 transition hover:bg-surface hover:text-white"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </Link>
      </div>

      <div className="mt-3 flex gap-2 pl-1">
        {chip('playlists', 'Playlists')}
        {chip('artists', 'Artistas')}
      </div>

      <div className="mt-5 flex items-center justify-between pl-1 pr-3">
        <Search className="h-4 w-4 text-muted stroke-[2]" aria-hidden />
        <span className="flex items-center gap-1 text-xs text-muted">
          Recentes <ChevronDown className="h-3.5 w-3.5 stroke-[2]" aria-hidden />
        </span>
      </div>

      <ul className="scroll-panel mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {filter !== 'artists' && (
          <li>
            <Link
              href="/library"
              className={clsx(
                'flex items-center gap-3.5 rounded-2xl p-2.5 transition hover:bg-surface-2',
                pathname === '/library' && 'bg-surface ring-1 ring-line/50',
              )}
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 via-rose-600 to-red-800 shadow-md">
                <Heart className="h-6 w-6 fill-white text-white" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Liked Songs</span>
                <span className="block truncate text-xs text-muted">
                  Playlist · {likedCount} {likedCount === 1 ? 'faixa' : 'faixas'}
                </span>
              </span>
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
