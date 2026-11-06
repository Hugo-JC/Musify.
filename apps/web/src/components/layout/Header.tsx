'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioLines, Search, User, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import { Cover } from '@/components/ui/Cover';
import { api } from '@/lib/api';
import type { YouTubeAccount } from '@/types';

export function Header() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [account, setAccount] = useState<YouTubeAccount | null>(null);

  useEffect(() => {
    let active = true;
    void api.account().then((data) => {
      if (active) setAccount(data);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="col-span-2 flex items-center justify-between border-b border-line/40 px-6">
      <Link href="/" className="flex w-[260px] shrink-0 items-center gap-3" aria-label="Musify, página inicial">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-accent shadow-md">
          <AudioLines className="h-6 w-6 stroke-[2.2]" aria-hidden />
        </span>
        <span className="text-[26px] font-bold leading-none tracking-tight">
          Mus<span className="text-accent">ify</span>
          <span className="text-accent">.</span>
        </span>
      </Link>

      <form onSubmit={submit} role="search" className="flex-1 max-w-[620px] px-4">
        <label className="flex h-12 w-full items-center gap-3 rounded-full border border-line bg-surface-2 px-4 transition-colors focus-within:border-accent focus-within:bg-surface">
          <Search className="h-5 w-5 text-muted stroke-[2.2]" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pesquisar músicas, álbuns e playlists"
            aria-label="Pesquisar"
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </label>
      </form>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/account')}
          className="hidden h-10 rounded-full bg-accent px-5 text-xs font-bold uppercase tracking-wider text-on-accent shadow-md transition-all hover:bg-accent-strong hover:scale-105 active:scale-95 sm:inline-flex sm:items-center"
        >
          {account?.connected ? 'Conta Verificada' : 'Ligar YouTube'}
        </button>
        <IconButton label="Amigos" className="h-11 w-11 bg-surface-2 hover:bg-surface">
          <Users className="h-5 w-5 stroke-[2]" />
        </IconButton>
        <Link
          href="/account"
          aria-label="Aceder à conta"
          title={account?.channel?.title ? `Conta: ${account.channel.title}` : 'Conta YouTube'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 transition hover:bg-surface hover:ring-2 hover:ring-accent"
        >
          {account?.channel?.thumbnail ? (
            <Cover src={account.channel.thumbnail} alt={account.channel.title} round className="h-9 w-9 text-[10px]" />
          ) : (
            <User className="h-5 w-5 text-white/90 stroke-[2]" />
          )}
        </Link>
      </div>
    </header>
  );
}
