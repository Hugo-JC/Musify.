'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, LibraryBig, Search, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { useLibrary } from '@/stores/useLibrary';

function NavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Home;
}) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={clsx('sidebar-link', active && 'is-active')}
    >
      <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const likedCount = useLibrary((state) => state.liked.length);
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="Navegação e biblioteca">
      <nav className="sidebar-nav" aria-label="Principal">
        <NavItem href="/" label="Home" icon={Home} />
        <NavItem href="/search" label="Search" icon={Search} />
      </nav>

      <section className="library-block" aria-labelledby="library-heading">
        <div className="library-heading" id="library-heading">
          <LibraryBig className="h-6 w-6" strokeWidth={2.4} aria-hidden />
          <span>Your Library</span>
        </div>

        <div className="library-items">
          <Link
            href="/library"
            aria-current={pathname === '/library' ? 'page' : undefined}
            className={clsx('library-item', pathname === '/library' && 'is-active')}
          >
            <span className="library-cover">
              <Heart className="h-6 w-6" fill="currentColor" strokeWidth={2.2} aria-hidden />
            </span>
            <span className="library-item-copy">
              <span className="library-item-title">Liked Songs</span>
              <span className="library-item-meta">Playlist · {likedCount} {likedCount === 1 ? 'song' : 'songs'}</span>
            </span>
          </Link>

          <Link href="/account" className="library-item">
            <span className="library-cover" style={{ background: 'linear-gradient(140deg, #41343a, #211c20)' }}>
              <UserRound className="h-5 w-5" aria-hidden />
            </span>
            <span className="library-item-copy">
              <span className="library-item-title">YouTube account</span>
              <span className="library-item-meta">Connect your library</span>
            </span>
          </Link>
        </div>
      </section>
    </aside>
  );
}
