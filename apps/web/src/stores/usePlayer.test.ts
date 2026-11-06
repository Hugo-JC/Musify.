import { beforeEach, describe, expect, it } from 'vitest';

import { usePlayer } from './usePlayer';
import { formatTime } from '@/lib/format';
import type { Track } from '@/types';

const t = (id: string): Track => ({ videoId: id.padEnd(11, 'x'), title: id, artists: [] });
const tracks = [t('a'), t('b'), t('c')];

beforeEach(() => {
  usePlayer.setState({ queue: [], index: -1, isPlaying: false, repeat: 'off', shuffle: false });
});

describe('usePlayer', () => {
  it('playQueue arranca na faixa pedida', () => {
    usePlayer.getState().playQueue(tracks, 1);
    expect(usePlayer.getState().index).toBe(1);
    expect(usePlayer.getState().isPlaying).toBe(true);
  });

  it('next avança e para no fim com repeat off', () => {
    usePlayer.getState().playQueue(tracks, 2);
    usePlayer.getState().next();
    expect(usePlayer.getState().isPlaying).toBe(false);
    expect(usePlayer.getState().index).toBe(2);
  });

  it('repeat all volta ao início', () => {
    usePlayer.getState().playQueue(tracks, 2);
    usePlayer.getState().cycleRepeat();
    usePlayer.getState().next();
    expect(usePlayer.getState().index).toBe(0);
  });

  it('prev regressa à faixa anterior do histórico', () => {
    usePlayer.getState().playQueue(tracks, 0);
    usePlayer.getState().next();
    usePlayer.getState().prev();
    expect(usePlayer.getState().index).toBe(0);
  });

  it('cycleRepeat percorre off, all, one', () => {
    const s = usePlayer.getState();
    s.cycleRepeat();
    expect(usePlayer.getState().repeat).toBe('all');
    s.cycleRepeat();
    expect(usePlayer.getState().repeat).toBe('one');
    s.cycleRepeat();
    expect(usePlayer.getState().repeat).toBe('off');
  });
});

describe('formatTime', () => {
  it('formata m:ss', () => {
    expect(formatTime(66)).toBe('1:06');
    expect(formatTime(402)).toBe('6:42');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
