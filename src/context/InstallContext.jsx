import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const InstallContext = createContext();

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState('other'); // 'ios' | 'android' | 'desktop' | 'other'
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Synchronous check for standalone and local install flags
  const detectInstallationSync = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const isStandaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false;
    const isFullscreenMedia = window.matchMedia?.('(display-mode: fullscreen)')?.matches ?? false;
    const isMinimalUiMedia = window.matchMedia?.('(display-mode: minimal-ui)')?.matches ?? false;
    const isIosStandalone = window.navigator?.standalone === true;
    const isAndroidApp = typeof document !== 'undefined' && document.referrer?.includes('android-app://');
    const isStoredInstalled = localStorage.getItem('mybadyet_installed') === 'true';

    const standalone = Boolean(
      isStandaloneMedia || isFullscreenMedia || isMinimalUiMedia || isIosStandalone || isAndroidApp
    );
    const installed = standalone || isStoredInstalled;

    setIsStandalone(standalone);
    setIsInstalled(installed);

    return { standalone, installed };
  }, []);

  // Comprehensive check including async getInstalledRelatedApps API
  const checkInstallationState = useCallback(async () => {
    const { standalone, installed } = detectInstallationSync();
    let detectedInstalled = installed;

    // Check Chromium getInstalledRelatedApps API
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      try {
        const relatedApps = await navigator.getInstalledRelatedApps();
        if (Array.isArray(relatedApps) && relatedApps.length > 0) {
          detectedInstalled = true;
          setIsInstalled(true);
          localStorage.setItem('mybadyet_installed', 'true');
        }
      } catch (err) {
        // Ignore API failures or permissions issues gracefully
      }
    }

    if (detectedInstalled || standalone) {
      setShowBanner(false);
      setIsModalOpen(false);
    }

    return detectedInstalled || standalone;
  }, [detectInstallationSync]);

  // Initial detection & listeners
  useEffect(() => {
    // 1. Detect Platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    const isSafari =
      /safari/.test(ua) && !/crios|fxios|opios|mercury|edgios|chrome/.test(ua);

    if (isIosDevice) {
      setPlatform('ios');
      setIsIosSafari(isSafari);
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // 2. Perform initial sync and async detection
    let isCancelled = false;
    let suggestionTimer = null;

    const runInitialDetection = async () => {
      const isAlreadyInstalled = await checkInstallationState();

      if (isCancelled) return;

      // 3. Automatic Suggestion check - only suggest if NOT installed on device
      if (!isAlreadyInstalled) {
        const dismissedUntil = localStorage.getItem('mybadyet_install_dismissed_until');
        const now = Date.now();
        if (!dismissedUntil || now > parseInt(dismissedUntil, 10)) {
          // Show suggestion banner after a brief delay for smooth loading
          suggestionTimer = setTimeout(() => {
            if (!isCancelled) {
              setShowBanner(true);
            }
          }, 1500);
        }
      } else {
        setShowBanner(false);
      }
    };

    runInitialDetection();

    // 4. Media Query listeners for standalone mode changes
    const standaloneMQ = window.matchMedia?.('(display-mode: standalone)');
    const fullscreenMQ = window.matchMedia?.('(display-mode: fullscreen)');
    const minimalUiMQ = window.matchMedia?.('(display-mode: minimal-ui)');

    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
        localStorage.setItem('mybadyet_installed', 'true');
        setShowBanner(false);
        setIsModalOpen(false);
      } else {
        detectInstallationSync();
      }
    };

    standaloneMQ?.addEventListener?.('change', handleDisplayModeChange);
    fullscreenMQ?.addEventListener?.('change', handleDisplayModeChange);
    minimalUiMQ?.addEventListener?.('change', handleDisplayModeChange);

    // 5. Native Browser Installation Events
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsModalOpen(false);
      localStorage.setItem('mybadyet_installed', 'true');
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInstallationState();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (suggestionTimer) clearTimeout(suggestionTimer);
      standaloneMQ?.removeEventListener?.('change', handleDisplayModeChange);
      fullscreenMQ?.removeEventListener?.('change', handleDisplayModeChange);
      minimalUiMQ?.removeEventListener?.('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkInstallationState, detectInstallationSync]);

  // Dismiss auto suggestion for a number of days
  const dismissSuggestion = (days = 7) => {
    setShowBanner(false);
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem('mybadyet_install_dismissed_until', expireTime.toString());
  };

  // Trigger prompt or open modal
  const promptInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsStandalone(true);
          setIsInstalled(true);
          localStorage.setItem('mybadyet_installed', 'true');
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        setIsModalOpen(true);
      }
    } else {
      // For iOS or browsers without direct prompt event, open custom modal guide
      setIsModalOpen(true);
    }
  };

  const openInstallModal = () => {
    if (isInstalled || isStandalone) return;
    setIsModalOpen(true);
  };
  const closeInstallModal = () => setIsModalOpen(false);

  return (
    <InstallContext.Provider
      value={{
        isStandalone,
        isInstalled: isInstalled || isStandalone,
        platform,
        isIosSafari,
        showBanner: showBanner && !isInstalled && !isStandalone,
        isModalOpen,
        hasNativePrompt: !!deferredPrompt,
        promptInstall,
        openInstallModal,
        closeInstallModal,
        dismissSuggestion,
        checkInstallationState,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  const context = useContext(InstallContext);
  if (!context) {
    throw new Error('useInstall must be used within an InstallProvider');
  }
  return context;
}
