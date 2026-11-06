'use client';

import { useEffect, useState } from 'react';
import { Skeleton, Message } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { greeting } from '@/lib/format';
import { useAudiusTrending } from '@/lib/hooks';
import { usePlayer } from '@/stores/usePlayer';
import type { Track } from '@/types';

export default function HomePage() {
  const [hello, setHello] = useState('Good morning');
  const trending = useAudiusTrending();
  const playQueue = usePlayer((state) => state.playQueue);
  const tracks = trending.data ?? [];

  useEffect(() => setHello(greeting()), []);

  return (
    <div className="home-page">
      <section className="home-intro" aria-labelledby="greeting">
        <div>
          <h1 id="greeting">{hello}</h1>
          <p className="mt-2 text-sm text-white/55">Descobre faixas para ouvir no Musify.</p>
        </div>
      </section>

      <section aria-labelledby="trending-heading">
        <div className="home-section-heading">
          <h2 id="trending-heading">Em alta no Audius</h2>
          <span className="home-section-link">Atualizado regularmente</span>
        </div>

        {trending.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-[68px]" />
            ))}
          </div>
        ) : trending.isError ? (
          <Message
            title="Não foi possível carregar as tendências"
            hint="Confirma a ligação e tenta novamente."
          />
        ) : tracks.length ? (
          <ul>
            {tracks.map((track: Track, index: number) => (
              <TrackRow
                key={track.id ?? index}
                track={track}
                index={index}
                onPlay={() => playQueue(tracks, index)}
              />
            ))}
          </ul>
        ) : (
          <Message title="Ainda não há faixas disponíveis" hint="Experimenta pesquisar um artista ou uma música." />
        )}
      </section>
    </div>
  );
}
