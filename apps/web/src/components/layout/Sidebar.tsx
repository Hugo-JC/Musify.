'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Heart, Home, Library, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { Cover } from '@/components/ui/Cover';
import { SEED_LIBRARY } from '@/lib/mock';
import { useLibrary } from '@/stores/useLibrary';

type Filter = 'playlists' | 'artists' | null;

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx(
        'flex h-12 items-center gap-4 rounded-full px-4 text-base font-semibold transition-colors',
        active ? 'bg-surface text-white' : 'text-white/80 hover:text-white',
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const likedCount = useLibrary((s) => s.liked.length);
  const [filter, setFilter] = useState<Filter>(null);

  const items = SEED_LIBRARY.filter((i) =>
    filter === null ? true : filter === 'artists' ? i.kind === 'artist' : i.kind === 'playlist',
  );

  const chip = (key: Exclude<Filter, null>, label: string) => (
    <button
      type="button"
      aria-pressed={filter === key}
      onClick={() => setFilter(filter === key ? null : key)}
      className={clsx(
        'h-8 rounded-full px-4 text-sm font-medium transition-colors',
        filter === key ? 'bg-accent text-on-accent' : 'bg-surface text-white hover:bg-line',
      )}
    >
      {label}
    </button>
  );

  return (
    <aside className="flex min-h-0 flex-col px-4 pb-4 pt-4" aria-label="Navegação e biblioteca">
      <nav className="flex flex-col gap-3.5">
        <NavItem href="/" label="Home" active={pathname === '/'} icon={<Home className="h-6 w-6" />} />
        <NavItem href="/search" label="Search" active={pathname.startsWith('/search')} icon={<Search className="h-6 w-6" />} />
      </nav>

      <div className="mt-12 flex items-center justify-between pl-2 pr-1">
        <div className="flex items-center gap-3 text-base font-semibold text-white/80">
          <Library className="h-6 w-6" aria-hidden />
          Your Library
        </div>
        <button type="button" aria-label="Create playlist" className="rounded-full p-1 text-white/80 hover:text-white">
          <Plus className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-4 flex gap-2 pl-1">
        {chip('playlists', 'Playlists')}
        {chip('artists', 'Artists')}
      </div>

      <div className="mt-5 flex items-center justify-between pl-1 pr-3">
        <Search className="h-5 w-5 text-white/80" aria-hidden />
        <button type="button" className="flex items-center gap-2 text-xs text-muted hover:text-white">
          Recents <ChevronDown className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <ul className="scroll-panel mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {filter !== 'artists' && (
          <li>
            <Link href="/library" className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-blue-500">
                <Heart className="h-6 w-6 fill-white text-white" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">Liked Songs</span>
                <span className="block truncate text-xs text-muted">
                  Playlist . {likedCount} {likedCount === 1 ? 'song' : 'songs'}
                </span>
              </span>
            </Link>
          </li>
        )}
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/search?q=${encodeURIComponent(item.title)}`}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-surface-2"
            >
              <Cover alt={item.title} round={item.kind === 'artist'} className="h-12 w-12 text-xs" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="block truncate text-xs text-muted">{item.subtitle}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
