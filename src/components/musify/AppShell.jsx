import { PlayerProvider } from "./PlayerContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import NowPlayingPanel from "./NowPlayingPanel";
import PlayerBar from "./PlayerBar";
import MobileNav from "./MobileNav";

export default function AppShell({ children }) {
  return (
    <PlayerProvider>
      <div className="flex h-[100dvh] flex-col gap-2 overflow-hidden bg-musify-bg p-2">
        <div className="flex min-h-0 flex-1 gap-2">
          <Sidebar />

          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] bg-musify-surface shadow-[0_30px_90px_-70px_rgba(0,0,0,1)]">
            <TopBar />
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
              {children}
            </div>
          </div>

          <NowPlayingPanel />
        </div>

        <MobileNav />
        <PlayerBar />
      </div>
    </PlayerProvider>
  );
}