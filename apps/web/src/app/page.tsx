'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlbumCard } from '@/components/home/AlbumCard';
import { FilterTabs, type Tab } from '@/components/home/FilterTabs';
import { MoodSelector } from '@/components/home/MoodSelector';
import { QuickCard } from '@/components/home/QuickCard';
import { Skeleton } from '@/components/ui/States';
import { greeting } from '@/lib/format';
import { useHome, useMood } from '@/lib/hooks';
import type { MoodKey } from '@/types';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('All');
  const [mood, setMood] = useState<MoodKey | null>('unwind');
  const [hello, setHello] = useState('Good morning');
  const home = useHome();
  const moodQuery = useMood(mood);

  useEffect(() => setHello(greeting()), []);

  const demo = home.data?.demo ?? false;
  const quick = (mood && moodQuery.data?.length ? moodQuery.data : home.data?.data.quick ?? []).slice(0, 6);
  const madeForYou = home.data?.data.madeForYou ?? [];

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="greeting" className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-5">
          <h1 id="greeting" className="text-[32px] font-bold leading-tight">
            {hello}
          </h1>
          <FilterTabs value={tab} onChange={setTab} />
        </div>
        <MoodSelector value={mood} onChange={setMood} />
      </section>

      {demo && (
        <p role="status" className="-mt-4 rounded-xl border border-line bg-surface-2 px-4 py-2 text-sm text-muted">
          Modo demo: a API não respondeu, por isso estão a ser mostrados dados de exemplo. Inicia o backend para ver playlists reais.
        </p>
      )}

      <section aria-label="Atalhos" className="grid grid-cols-3 gap-4">
        {home.isLoading || (mood && moodQuery.isLoading && !home.data)
          ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[76px]" />)
          : quick.map((c) => <QuickCard key={c.id} card={c} />)}
      </section>

      <section aria-labelledby="made-for-you">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="made-for-you" className="text-2xl font-bold">
            Made For You
          </h2>
          <Link href="/search?q=daily%20mix" className="pr-4 text-sm text-muted hover:text-white">
            Show all
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {home.isLoading
            ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[356px]" />)
            : madeForYou.slice(0, 3).map((c, i) => (
                <AlbumCard key={c.id} card={c} position={i + 1} badge={i === 0 ? 'Daily rotation' : undefined} />
              ))}
        </div>
      </section>
    </div>
  );
}
