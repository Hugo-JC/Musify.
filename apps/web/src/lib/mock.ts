import type { HomeData, PlaylistCard } from '@/types';

// Conteúdo do frame do Figma, usado quando a API não está disponível (modo demo).
const card = (id: string, title: string, subtitle?: string): PlaylistCard => ({
  id: `mock-${id}`,
  title,
  subtitle,
  thumbnail: null,
  kind: 'playlist',
});

export const MOCK_HOME: HomeData = {
  quick: [
    card('you-and-me', 'You and Me'),
    card('bob', 'Best of the Best-Justin Biber'),
    card('thalaivar', 'Thalaivar Hits'),
    card('peace-love-wiz', 'Peace & Love - Wiz Khalifa'),
    card('kollywood', 'Kollywood Rap'),
    card('arr', 'Straight outta ARR'),
  ],
  madeForYou: [
    card('peace-love', 'Peace & Love'),
    card('fast-furious', 'Fast & Furious'),
    card('all-out-10s', 'All Out 10s'),
  ],
};

export const SEED_LIBRARY = [
  { id: 'yuvan', title: 'Yuvan Shankar Raja', subtitle: 'Artist', kind: 'artist' as const },
  { id: 'anirudh', title: 'Anirudh Ravichander', subtitle: 'Artist', kind: 'artist' as const },
  { id: 'arr', title: 'A.R.Rahman', subtitle: 'Artist', kind: 'artist' as const },
  { id: 'motivate', title: 'Motivate Me - Tamil Playlist', subtitle: 'Playlist . Iyyappan Arumugam', kind: 'playlist' as const },
];
