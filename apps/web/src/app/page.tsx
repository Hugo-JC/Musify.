'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlbumCard } from '@/components/home/AlbumCard';
import { FilterTabs, type Tab } from '@/components/home/FilterTabs';
import { MoodSelector } from '@/components/home/MoodSelector';
import { QuickCard } from '@/components/home/QuickCard';
import { ApiErrorAlert, Message, Skeleton } from '@/components/ui/States';
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

  const quick = (mood && moodQuery.data?.length ? moodQuery.data : home.data?.quick ?? []).slice(0, 6);
  const madeForYou = home.data?.madeForYou ?? [];

  const hasError = Boolean(home.error) || (Boolean(mood) && Boolean(moodQuery.error));
  const errorMessage = (home.error as Error)?.message || (moodQuery.error as Error)?.message;

  const handleRefresh = () => {
    void home.refetch();
    if (mood) void moodQuery.refetch();
  };

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

      {hasError && <ApiErrorAlert message={errorMessage} onRetry={handleRefresh} />}

      <section aria-label="Atalhos">
        {home.isLoading || (mood && moodQuery.isLoading && !home.data) ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[76px]" />
            ))}
          </div>
        ) : quick.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {quick.map((c) => (
              <QuickCard key={c.id} card={c} />
            ))}
          </div>
        ) : !hasError ? (
          <Message title="Nenhum atalho disponível de momento" hint="Experimenta pesquisar ou selecionar outro mood." />
        ) : null}
      </section>

      <section aria-labelledby="made-for-you">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="made-for-you" className="text-2xl font-bold">
            Made For You
          </h2>
          <Link href="/search?q=daily%20mix" className="pr-4 text-sm text-muted transition hover:text-white">
            Show all
          </Link>
        </div>
        {home.isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-[356px]" />
            ))}
          </div>
        ) : madeForYou.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {madeForYou.slice(0, 3).map((c, i) => (
              <AlbumCard key={c.id} card={c} position={i + 1} badge={i === 0 ? 'Daily rotation' : undefined} />
            ))}
          </div>
        ) : !hasError ? (
          <Message title="Sem recomendações recentes" hint="Liga a tua conta YouTube na secção Conta para obteres recomendações baseadas no teu perfil." />
        ) : null}
      </section>
    </div>
  );
}
