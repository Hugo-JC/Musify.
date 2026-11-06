'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AudioLines, Search, User } from 'lucide-react';
import { useState } from 'react';
import { Cover } from '@/components/ui/Cover';
import { useYouTubeAccount } from '@/lib/hooks';

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data: account } = useYouTubeAccount();
  const channel = account?.connected ? account.channel : null;

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
        <Link
          href="/account"
          className={`header-account${channel ? ' is-connected' : ''}`}
          aria-label={channel ? `Conta YouTube: ${channel.title}` : 'Abrir conta YouTube'}
          title={channel?.title || 'Conta YouTube'}
        >
          {channel?.thumbnail ? (
            <Cover
              src={channel.thumbnail}
              alt=""
              round
              className="header-account-avatar"
            />
          ) : (
            <span className="header-account-avatar-fallback">
              <User className="h-5 w-5" strokeWidth={2.1} aria-hidden />
            </span>
          )}
          {channel && <span className="header-account-name">{channel.title}</span>}
        </Link>
      </div>
    </header>
  );
}
