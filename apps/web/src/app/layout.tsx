import '@fontsource-variable/inter';
import './globals.css';
import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PlaybackBar } from '@/components/player/PlaybackBar';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Musify',
  description: 'A tua biblioteca musical num espaço simples, rápido e organizado.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT">
      <body>
        <Providers>
          <div className="app-shell">
            <Header />
            <Sidebar />
            <main className="main-content scroll-panel">{children}</main>
            <PlaybackBar />
            <MobileNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
