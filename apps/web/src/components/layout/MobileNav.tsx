'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Home, Search, User } from 'lucide-react';
import clsx from 'clsx';

const ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Pesquisar', icon: Search },
  { href: '/library', label: 'Favoritos', icon: Heart },
  { href: '/account', label: 'Conta', icon: UserRound },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav" aria-label="Navegação principal">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={clsx('mobile-nav-link', active && 'is-active')}
          >
            <Icon
              className="h-5 w-5"
              strokeWidth={2.2}
              fill={active && (href === '/' || href === '/library') ? 'currentColor' : 'none'}
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
