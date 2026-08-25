import { createContext, useContext, useState, useEffect } from 'react';

const InstallContext = createContext();

export function InstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState('other'); // 'ios' | 'android' | 'desktop' | 'other'
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check standalone mode and platform
  useEffect(() => {
    // 1. Detect Standalone
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = window.navigator.standalone === true;
      const isAndroidApp = document.referrer.includes('android-app://');
      const standalone = isStandaloneMedia || isIosStandalone || isAndroidApp;
      setIsStandalone(standalone);
      return standalone;
    };

    const standalone = checkStandalone();

    // 2. Detect Platform
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

    // 3. Listen to display-mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e) => {
      setIsStandalone(e.matches);
      if (e.matches) {
        setShowBanner(false);
        setIsModalOpen(false);
      }
    };
    mediaQuery.addEventListener?.('change', handleDisplayModeChange);

    // 4. Capture beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      setIsModalOpen(false);
      localStorage.setItem('mybadyet_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 5. Automatic Suggestion check
    if (!standalone) {
      const dismissedUntil = localStorage.getItem('mybadyet_install_dismissed_until');
      const now = Date.now();
      if (!dismissedUntil || now > parseInt(dismissedUntil, 10)) {
        // Show suggestion after a short delay for smooth page loading
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      mediaQuery.removeEventListener?.('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

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
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error invoking install prompt:', err);
        setIsModalOpen(true);
      }
    } else {
      // For iOS or browsers without direct prompt event, open our custom modal guide
      setIsModalOpen(true);
    }
  };

  const openInstallModal = () => setIsModalOpen(true);
  const closeInstallModal = () => setIsModalOpen(false);

  return (
    <InstallContext.Provider
      value={{
        isStandalone,
        platform,
        isIosSafari,
        showBanner,
        isModalOpen,
        hasNativePrompt: !!deferredPrompt,
        promptInstall,
        openInstallModal,
        closeInstallModal,
        dismissSuggestion,
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
