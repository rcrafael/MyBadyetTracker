import { useInstall } from '../../context/InstallContext';

export default function InstallSuggestionBanner() {
  const {
    showBanner,
    isStandalone,
    isInstalled,
    platform,
    promptInstall,
    dismissSuggestion,
  } = useInstall();

  if (!showBanner || isStandalone || isInstalled) return null;

  return (
    <aside
      aria-label="Install App Suggestion"
      className="fixed bottom-20 sm:bottom-22 left-4 right-4 max-w-lg md:max-w-xl mx-auto z-45 animate-fadeIn"
    >
      <div className="bg-surface-container-lowest/95 dark:bg-surface-container-low/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-xl border border-secondary/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-secondary text-xl">
              {platform === 'ios' ? 'phone_iphone' : 'add_to_home_screen'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-on-surface font-headline truncate">
                Add to Home Screen
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary/15 text-secondary">
                {platform === 'ios' ? 'iOS' : platform === 'android' ? 'Android' : 'App'}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-on-surface-variant line-clamp-1">
              {platform === 'ios'
                ? 'Create a home screen shortcut via Safari for fast access'
                : 'Install shortcut for faster 1-tap full screen access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={() => dismissSuggestion(7)}
            className="text-xs font-semibold text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-lg hover:bg-surface-container transition-colors"
          >
            Later
          </button>
          <button
            type="button"
            onClick={promptInstall}
            className="text-xs font-semibold bg-secondary text-white hover:bg-secondary/90 px-3.5 py-1.5 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">
              {platform === 'ios' ? 'ios_share' : 'install_mobile'}
            </span>
            <span>{platform === 'ios' ? 'How to Add' : 'Install'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
