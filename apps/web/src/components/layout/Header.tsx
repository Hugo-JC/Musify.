'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AudioLines, Search, User } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (term) router.push('/search?q=' + encodeURIComponent(term));
  };

  return (
    <header className="app-header">
      <Link href="/" className="brand-link" aria-label="Musify — página inicial">
        <span className="brand-mark">
          <AudioLines aria-hidden />
        </span>
        <span className="brand-word">Mus<span>ify.</span></span>
      </Link>

      <form className="global-search" onSubmit={submit} role="search">
        <label>
          <Search className="h-5 w-5 shrink-0" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Pesquisar músicas, artistas e playlists"
            aria-label="Pesquisar músicas, artistas e playlists"
          />
        </label>
      </form>

      <div className="header-actions">
        <Link href="/account" className="header-account" aria-label="Abrir conta YouTube" title="Conta">
          <UserRound className="h-5 w-5" strokeWidth={2.1} aria-hidden />
        </Link>
      </div>
    </header>
  );
}
