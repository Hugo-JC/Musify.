import '@fontsource-variable/inter';
import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { PlaybackBar } from '@/components/player/PlaybackBar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Musify',
  description: 'Streaming de música com Next.js, FastAPI e Redis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <Providers>
          <div className="grid h-screen min-w-[1100px] grid-cols-shell grid-rows-shell">
            <Header />
            <Sidebar />
            <main className="scroll-panel mb-4 mr-4 mt-2 min-h-0 overflow-y-auto rounded-panel bg-panel p-6">{children}</main>
            <PlaybackBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
