'use client';

import { useEffect, useState } from 'react';
import { AlbumCard } from '@/components/home/AlbumCard';
import { MoodSelector } from '@/components/home/MoodSelector';
import { QuickCard } from '@/components/home/QuickCard';
import { ApiErrorAlert, Message, Skeleton } from '@/components/ui/States';
import { greeting } from '@/lib/format';
import { useHome, useMood } from '@/lib/hooks';
import type { MoodKey } from '@/types';

export default function HomePage() {
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
    <div className="home-page">
      <section className="home-intro" aria-labelledby="greeting">
        <div>
          <h1 id="greeting">{hello}</h1>
          <p className="mt-2 text-sm text-white/55">Encontra algo bom para ouvir agora.</p>
        </div>
        <MoodSelector value={mood} onChange={setMood} />
      </section>

      {hasError && <ApiErrorAlert message={errorMessage} onRetry={handleRefresh} />}

      <section aria-label="Atalhos para playlists">
        {home.isLoading || (mood && moodQuery.isLoading && !home.data) ? (
          <div className="quick-grid">
            {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[76px]" />)}
          </div>
        ) : quick.length > 0 ? (
          <div className="quick-grid">
            {quick.map((card) => <QuickCard key={card.id} card={card} />)}
          </div>
        ) : !hasError ? (
          <Message title="Nenhum atalho disponível" hint="Experimenta outro mood ou faz uma pesquisa." />
        ) : null}
      </section>

      <section aria-labelledby="made-for-you">
        <div className="home-section-heading">
          <h2 id="made-for-you">Made For You</h2>
          <span className="home-section-link">A tua seleção</span>
        </div>

        {home.isLoading ? (
          <div className="featured-grid">
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-[340px]" />)}
          </div>
        ) : madeForYou.length > 0 ? (
          <div className="featured-grid">
            {madeForYou.slice(0, 3).map((card, index) => (
              <AlbumCard key={card.id} card={card} position={index + 1} badge={index === 0 ? 'Daily rotation' : undefined} />
            ))}
          </div>
        ) : !hasError ? (
          <Message title="Sem recomendações recentes" hint="Liga a tua conta YouTube para personalizar esta seleção." />
        ) : null}
      </section>
    </div>
  );
}
