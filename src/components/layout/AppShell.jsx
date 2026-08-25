import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import InstallSuggestionBanner from '../pwa/InstallSuggestionBanner';
import InstallPromptModal from '../pwa/InstallPromptModal';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <TopBar />
      <main className="flex-1 w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-28 sm:pb-32">
        <div className="page-enter">
          <Outlet />
        </div>
      </main>
      <InstallSuggestionBanner />
      <InstallPromptModal />
      <BottomNav />
    </div>
  );
}
