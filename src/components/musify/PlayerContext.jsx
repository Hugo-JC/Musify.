import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { tracks as allTracks } from "@/lib/musicData";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [queue, setQueue] = useState(allTracks);
  const [currentId, setCurrentId] = useState(allTracks[0].id);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(38);
  const [volume, setVolume] = useState(0.72);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState(() => new Set(["t1", "t3"]));

  const current = useMemo(
    () => queue.find((track) => track.id === currentId) ?? queue[0] ?? allTracks[0],
    [queue, currentId],
  );

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setProgress((value) => Math.min(value + 1, current.duration));
    }, 1000);
    return () => clearInterval(timer);
  }, [playing, current.duration]);

  const step = useCallback(
    (direction) => {
      setCurrentId((id) => {
        const list = queue.length ? queue : allTracks;
        const index = list.findIndex((track) => track.id === id);
        if (shuffle) {
          const options = list.filter((track) => track.id !== id);
          return (options[Math.floor(Math.random() * options.length)] ?? list[0]).id;
        }
        const next = (index + direction + list.length) % list.length;
        return list[next].id;
      });
      setProgress(0);
    },
    [queue, shuffle],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  useEffect(() => {
    if (progress < current.duration) return;
    if (repeat) {
      setProgress(0);
      return;
    }
    if (playing) next();
  }, [progress, current.duration, repeat, playing, next]);

  const playTrack = useCallback((track, list) => {
    if (!track) return;
    if (list && list.length) setQueue(list);
    setCurrentId(track.id);
    setProgress(0);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => setPlaying((value) => !value), []);

  const seek = useCallback((seconds) => setProgress(Math.max(0, Math.min(seconds, current.duration))), [current.duration]);

  const toggleLike = useCallback((id) => {
    setLiked((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) updated.delete(id);
      else updated.add(id);
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      queue,
      current,
      playing,
      progress,
      volume,
      shuffle,
      repeat,
      liked,
      playTrack,
      toggle,
      next,
      previous,
      seek,
      setVolume,
      setShuffle,
      setRepeat,
      toggleLike,
    }),
    [queue, current, playing, progress, volume, shuffle, repeat, liked, playTrack, toggle, next, previous, seek, toggleLike],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used inside PlayerProvider");
  return context;
}