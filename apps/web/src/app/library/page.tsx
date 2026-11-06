'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Heart, Play, Upload } from 'lucide-react';
import { Message, Skeleton } from '@/components/ui/States';
import { TrackRow } from '@/components/ui/TrackRow';
import { importLocalAudio, listLocalAudio, removeLocalAudio } from '@/lib/localLibrary';
import { useLibrary } from '@/stores/useLibrary';
import { usePlayer } from '@/stores/usePlayer';
import { trackKey, type Track } from '@/types';

export default function LibraryPage() {
  const liked = useLibrary((state) => state.liked);
  const playQueue = usePlayer((state) => state.playQueue);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [loadingLocal, setLoadingLocal] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listLocalAudio()
      .then((tracks) => { if (active) setLocalTracks(tracks); })
      .catch((error: unknown) => {
        if (active) setLocalError(error instanceof Error ? error.message : 'Não foi possível abrir a biblioteca local.');
      })
      .finally(() => { if (active) setLoadingLocal(false); });
    return () => { active = false; };
  }, []);

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setLocalError(null);
    try {
      const imported = await importLocalAudio(files);
      setLocalTracks((current) => [
        ...imported,
        ...current.filter((track) => !imported.some((item) => trackKey(item) === trackKey(track))),
      ]);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Não foi possível importar os ficheiros.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemove = async (track: Track) => {
    const localId = track.localId;
    if (!localId) return;
    try {
      await removeLocalAudio(localId);
      setLocalTracks((current) => current.filter((item) => trackKey(item) !== trackKey(track)));
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Não foi possível remover o ficheiro local.');
    }
  };

  return (
    <div>
      <header className="library-hero mb-8 flex items-end gap-6">
        <span className="library-hero-art flex h-[200px] w-[200px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-600 to-blue-500">
          <Heart className="h-20 w-20 fill-white text-white" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted">A tua biblioteca</p>
          <h1 className="my-2 text-[40px] font-bold leading-tight">Música guardada</h1>
          <p className="text-sm text-muted">{liked.length} favoritos · {localTracks.length} ficheiros locais</p>
        </div>
      </header>

      <section className="mb-10" aria-labelledby="local-audio-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="local-audio-heading" className="text-xl font-bold">Áudio local</h2>
            <p className="mt-1 text-xs text-muted">Os ficheiros ficam neste browser e não são enviados para o servidor.</p>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent transition hover:brightness-110"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Adicionar ficheiros
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.oga,.opus,.flac,.webm"
            multiple
            className="hidden"
            onChange={handleImport}
            aria-label="Selecionar ficheiros de áudio"
          />
        </div>

        {localError && <p role="alert" className="mb-3 text-sm text-red-300">{localError}</p>}
        {loadingLocal ? (
          <div className="space-y-2">
            <Skeleton className="h-[68px]" />
            <Skeleton className="h-[68px]" />
          </div>
        ) : localTracks.length ? (
          <ul>
            {localTracks.map((track, index) => (
              <TrackRow
                key={trackKey(track)}
                track={track}
                index={index}
                onPlay={() => playQueue(localTracks, index)}
                onRemove={() => void handleRemove(track)}
                showAlbum={false}
              />
            ))}
          </ul>
        ) : (
          <Message title="Ainda não adicionaste ficheiros" hint="Escolhe músicas guardadas no teu dispositivo para ouvires no Musify." />
        )}
      </section>

      <section aria-labelledby="liked-heading">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 id="liked-heading" className="text-xl font-bold">Favoritos</h2>
            <p className="mt-1 text-xs text-muted">{liked.length} faixas guardadas neste browser</p>
          </div>
          {liked.length > 0 && (
            <button
              type="button"
              aria-label="Tocar favoritos"
              onClick={() => playQueue(liked, 0)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-on-accent transition-transform hover:scale-105"
            >
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </button>
          )}
        </div>
        {liked.length ? (
          <ul>
            {liked.map((track, index) => (
              <TrackRow key={trackKey(track)} track={track} index={index} onPlay={() => playQueue(liked, index)} showAlbum={false} />
            ))}
          </ul>
        ) : (
          <Message title="Ainda não tens favoritos" hint="Toca no coração de qualquer faixa para a guardar aqui." />
        )}
      </section>
    </div>
  );
}
