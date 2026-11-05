'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AudioLines, Search, User, Users } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/ui/IconButton';

export function Header() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="col-span-2 flex items-center">
      <Link href="/" className="flex w-[288px] shrink-0 items-center gap-3 pl-8" aria-label="Musify, página inicial">
        <AudioLines className="h-6 w-6 text-accent-strong" aria-hidden />
        <span className="text-[28px] font-bold leading-none tracking-tight">
          Mus<span className="text-accent-strong">ify</span>
          <span className="text-accent-strong"> .</span>
        </span>
      </Link>

      <form onSubmit={submit} role="search" className="flex-1 pl-6 pr-6">
        <label className="flex h-12 w-full max-w-[608px] items-center gap-3 rounded-full border border-line bg-surface-2 px-4 focus-within:border-accent">
          <Search className="h-6 w-6 text-muted" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search in Albums"
            aria-label="Pesquisar"
            className="w-full bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
          />
        </label>
      </form>

      <div className="flex items-center gap-4 pr-6">
        <button
          type="button"
          className="h-10 rounded-full bg-[#dcd1f7] px-5 text-sm font-semibold text-on-accent transition-colors hover:bg-white"
        >
          Upgrade
        </button>
        <IconButton label="Friends" className="h-12 w-12 bg-surface-2">
          <Users className="h-6 w-6" />
        </IconButton>
        <IconButton label="Account" className="h-12 w-12 bg-surface-2">
          <User className="h-6 w-6" />
        </IconButton>
      </div>
    </header>
  );
}
