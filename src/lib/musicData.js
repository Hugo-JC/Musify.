const art = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=640&q=80`;

export const cover = {
  studio: art("photo-1470225620780-dba8ba36b745"),
  mic: art("photo-1493225457124-a3eb161ffa5f"),
  guitar: art("photo-1516280440614-37939bbacd81"),
  vinyl: art("photo-1514320291840-2e0a9bf2a9ae"),
  crowd: art("photo-1459749411175-04bf5292ceea"),
  dj: art("photo-1499415479124-43c32433a620"),
  stage: art("photo-1483412033650-1015ddeb83d1"),
  headphones: art("photo-1524368535928-5b5e00ddc76b"),
  keys: art("photo-1511671782779-c97d3d27a1d4"),
  live: art("photo-1571330735066-03aaa9429d89"),
};

export const formatTime = (seconds) => {
  const value = Math.max(0, Math.round(seconds || 0));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
};

export const tracks = [
  {
    id: "t1",
    title: "Crónica do Último Ronin",
    artist: "Carneiro Rap",
    album: "Cidade Fria",
    cover: cover.studio,
    duration: 214,
    plays: "1 284 992",
  },
  {
    id: "t2",
    title: "Cais de Madrugada",
    artist: "Márcia Lume",
    album: "Maré Alta",
    cover: cover.mic,
    duration: 197,
    plays: "862 341",
  },
  {
    id: "t3",
    title: "Neon na Rua 24",
    artist: "Kudissanga",
    album: "Rua 24",
    cover: cover.dj,
    duration: 233,
    plays: "2 041 887",
  },
  {
    id: "t4",
    title: "Fio de Luz",
    artist: "Ana Souto",
    album: "Intervalo",
    cover: cover.guitar,
    duration: 204,
    plays: "431 208",
  },
  {
    id: "t5",
    title: "Sessão 07",
    artist: "Estúdio Aberto",
    album: "Sessões Cruas",
    cover: null,
    duration: 176,
    plays: "12 804",
  },
  {
    id: "t6",
    title: "Kilamba Nights",
    artist: "DJ Njila",
    album: "Depois das Duas",
    cover: cover.live,
    duration: 258,
    plays: "1 907 442",
  },
  {
    id: "t7",
    title: "Maré Alta",
    artist: "Márcia Lume",
    album: "Maré Alta",
    cover: cover.crowd,
    duration: 221,
    plays: "655 019",
  },
  {
    id: "t8",
    title: "Intervalo",
    artist: "Ana Souto",
    album: "Intervalo",
    cover: cover.vinyl,
    duration: 189,
    plays: "298 776",
  },
];

export const hero = {
  eyebrow: "Em destaque · Topsify",
  title: "O Natal está a chegar.",
  highlight: "A playlist também.",
  description:
    "Uma seleção quente de clássicos, vozes novas e gravações raras para os dias mais compridos do ano.",
  covers: [cover.crowd, cover.vinyl, cover.mic],
  track: tracks[6],
};

export const filters = ["Tudo", "Música", "Podcasts", "Ao vivo"];

export const library = [
  {
    id: "favoritas",
    title: "Músicas favoritas",
    subtitle: "Playlist · 128 músicas",
    cover: cover.headphones,
  },
  {
    id: "rua-24",
    title: "Rua 24",
    subtitle: "Álbum · Kudissanga",
    cover: null,
  },
  {
    id: "mix-semanal",
    title: "Mix Semanal",
    subtitle: "Playlist · 50 músicas",
    cover: cover.dj,
  },
  {
    id: "chill-luanda",
    title: "Chill Luanda",
    subtitle: "Playlist · 42 músicas",
    cover: cover.stage,
  },
  {
    id: "sessoes",
    title: "Sessões da Madrugada",
    subtitle: "Playlist · 18 músicas",
    cover: null,
  },
];

export const shelves = [
  {
    id: "for-you",
    title: "Escolhas para ti",
    items: [
      { id: "p1", title: "Mix Diário 01", subtitle: "Kudissanga, Márcia Lume, DJ Njila", cover: cover.dj, track: tracks[2] },
      { id: "p2", title: "Rap de Luanda", subtitle: "Playlist · Carneiro Rap", cover: cover.studio, track: tracks[0] },
      { id: "p3", title: "Vozes ao Vivo", subtitle: "Sessões gravadas em estúdio", cover: cover.mic, track: tracks[1] },
      { id: "p4", title: "Guitarra & Silêncio", subtitle: "Ana Souto e convidados", cover: cover.guitar, track: tracks[3] },
      { id: "p5", title: "Depois das Duas", subtitle: "Álbum · DJ Njila", cover: cover.live, track: tracks[5] },
      { id: "p6", title: "Sessões Cruas 07", subtitle: "Estúdio Aberto · ainda sem capa", cover: null, track: tracks[4] },
    ],
  },
  {
    id: "new-week",
    title: "Chegou a Novidade da Semana",
    items: [
      { id: "p7", title: "Maré Alta", subtitle: "Márcia Lume · single", cover: cover.crowd, track: tracks[6] },
      { id: "p8", title: "Vinil de Domingo", subtitle: "Playlist · 33 músicas", cover: cover.vinyl, track: tracks[7] },
      { id: "p9", title: "Palco Aberto", subtitle: "Ao vivo em Talatona", cover: cover.stage, track: tracks[5] },
      { id: "p10", title: "Sala de Ensaio", subtitle: "Gravações de bastidores", cover: cover.keys, track: tracks[2] },
      { id: "p11", title: "Noite Longa", subtitle: "Playlist · 61 músicas", cover: cover.headphones, track: tracks[1] },
      { id: "p12", title: "Rua 24 — Remixes", subtitle: "Kudissanga · sem capa", cover: null, track: tracks[2] },
    ],
  },
  {
    id: "albums",
    title: "Álbuns em destaque",
    items: [
      { id: "a1", title: "Cidade Fria", subtitle: "Carneiro Rap", cover: cover.studio, track: tracks[0] },
      { id: "a2", title: "Intervalo", subtitle: "Ana Souto", cover: cover.guitar, track: tracks[3] },
      { id: "a3", title: "Rua 24", subtitle: "Kudissanga", cover: cover.dj, track: tracks[2] },
      { id: "a4", title: "Maré Alta", subtitle: "Márcia Lume", cover: cover.mic, track: tracks[1] },
      { id: "a5", title: "Depois das Duas", subtitle: "DJ Njila", cover: cover.live, track: tracks[5] },
      { id: "a6", title: "Sessões Cruas", subtitle: "Estúdio Aberto", cover: cover.vinyl, track: tracks[7] },
    ],
  },
];