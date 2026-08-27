import { useState, useEffect } from 'react';
import { useInstall } from '../../context/InstallContext';

export default function InstallPromptModal() {
  const {
    isModalOpen,
    closeInstallModal,
    platform,
    hasNativePrompt,
    promptInstall,
    isStandalone,
    isInstalled,
  } = useInstall();

  const [activeTab, setActiveTab] = useState(platform === 'ios' ? 'ios' : 'android');

  useEffect(() => {
    if (platform === 'ios') {
      setActiveTab('ios');
    } else if (platform === 'android') {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, [platform, isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="app-card max-w-md w-full p-5 sm:p-6 shadow-2xl border border-secondary/30 max-h-[90vh] flex flex-col relative"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline-variant/20 shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="MyBadyet Icon"
              className="w-12 h-12 rounded-2xl border border-secondary/30 shadow-xs object-cover shrink-0"
            />
            <div>
              <h3 id="install-modal-title" className="font-headline text-base sm:text-lg font-bold text-on-surface">
                Add to Home Screen
              </h3>
              <p className="text-xs text-on-surface-variant">
                Install MyBadyetTracker for instant, full-screen access
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeInstallModal}
            aria-label="Close modal"
            className="p-1 text-outline hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex p-1 bg-surface-container rounded-xl my-3 shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'android'
                ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">android</span>
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'ios'
                ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">phone_iphone</span>
            <span>iOS (iPhone/iPad)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'desktop'
                ? 'bg-surface-container-lowest text-secondary shadow-xs font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">laptop</span>
            <span>Desktop</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 py-1 flex-1 pr-1 custom-scrollbar">
          {/* Status banner if already installed or standalone */}
          {(isStandalone || isInstalled) && (
            <div className="p-3 bg-secondary/15 border border-secondary/30 rounded-xl flex items-center gap-2.5 text-xs text-on-surface">
              <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
              <span>The app is currently installed on this device!</span>
            </div>
          )}

          {/* Android Tab Content */}
          {activeTab === 'android' && (
            <div className="space-y-3.5">
              {hasNativePrompt ? (
                <div className="p-3.5 bg-secondary-container/30 border border-secondary/30 rounded-xl text-center space-y-2.5">
                  <p className="text-xs font-medium text-on-surface">
                    One-click installation is supported on this browser!
                  </p>
                  <button
                    type="button"
                    onClick={promptInstall}
                    className="w-full py-2.5 px-4 bg-secondary text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-secondary/90 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">add_to_home_screen</span>
                    <span>Install App on Android</span>
                  </button>
                </div>
              ) : null}

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Manual Installation Steps (Chrome / Samsung Internet):
                </h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">Tap the Browser Menu</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Tap the three dots icon (<span className="font-mono font-bold">⋮</span> or <span className="font-mono font-bold">≡</span>) in the top-right or bottom bar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">Choose Install / Add to Home screen</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Select <span className="font-semibold text-secondary">"Install app"</span> or <span className="font-semibold text-secondary">"Add to Home screen"</span>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <p className="font-semibold text-on-surface">Confirm & Launch</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Tap <span className="font-semibold text-secondary">"Install"</span>. The app icon will appear on your phone's home screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* iOS Tab Content */}
          {activeTab === 'ios' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-surface-container rounded-xl flex items-center gap-2.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-secondary text-lg shrink-0">info</span>
                <span>Open this page in <strong>Safari</strong> on your iPhone or iPad to create a home screen shortcut.</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Follow these 3 quick steps in Safari:
                </h4>

                <div className="space-y-2 text-xs">
                  {/* Step 1 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-on-surface">Tap the Share Button</p>
                        <span className="material-symbols-outlined text-secondary text-base">
                          ios_share
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Look for the square icon with an arrow pointing up at the bottom toolbar (or top on iPad).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-on-surface">Tap "Add to Home Screen"</p>
                        <span className="material-symbols-outlined text-secondary text-base">
                          add_box
                        </span>
                      </div>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Scroll down the options list and select <span className="font-semibold text-secondary">"Add to Home Screen"</span>.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                    <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-on-surface">Tap "Add" in Top-Right</p>
                      <p className="text-on-surface-variant text-[11px] mt-0.5">
                        Confirm the title and tap <span className="font-semibold text-secondary">"Add"</span>. MyBadyet is now on your iOS home screen!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Tab Content */}
          {activeTab === 'desktop' && (
            <div className="space-y-3 text-xs">
              <p className="text-on-surface-variant">
                You can also install MyBadyetTracker as a lightweight desktop app on Chrome, Edge, or Brave:
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-on-surface">Check the Address Bar</p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      Click the <span className="font-semibold text-secondary">Install</span> or <span className="font-semibold text-secondary">App Available</span> icon located at the right side of the address bar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/20">
                  <span className="w-5 h-5 rounded-full bg-secondary text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-on-surface">Click Install</p>
                    <p className="text-on-surface-variant text-[11px] mt-0.5">
                      Accept the prompt to add MyBadyetTracker to your Desktop and Applications menu.
                    </p>
                  </div>
                </div>
              </div>

              {hasNativePrompt && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="w-full py-2.5 px-4 bg-secondary text-white font-semibold text-xs rounded-xl shadow-xs hover:bg-secondary/90 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Install App on Desktop</span>
                </button>
              )}
            </div>
          )}

          {/* Benefits Grid */}
          <div className="pt-2 border-t border-outline-variant/20">
            <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Why create a home screen shortcut?
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-surface-container/40">
                <span className="material-symbols-outlined text-secondary text-base block mb-0.5">
                  bolt
                </span>
                <span className="text-[10px] font-semibold text-on-surface block">Instant Launch</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container/40">
                <span className="material-symbols-outlined text-secondary text-base block mb-0.5">
                  fullscreen
                </span>
                <span className="text-[10px] font-semibold text-on-surface block">Full-Screen</span>
              </div>
              <div className="p-2 rounded-xl bg-surface-container/40">
                <span className="material-symbols-outlined text-secondary text-base block mb-0.5">
                  cloud_done
                </span>
                <span className="text-[10px] font-semibold text-on-surface block">Fast & Clean</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/20 shrink-0">
          <button
            type="button"
            onClick={closeInstallModal}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
