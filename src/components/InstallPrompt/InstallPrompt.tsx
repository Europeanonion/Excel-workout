import { useState, useEffect, FC } from 'react';
import styles from './install-prompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPrompt: FC = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Chrome, Edge, etc.)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event for later use
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      // Show our custom install prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS instructions after a delay if on iOS
    if (isIOSDevice) {
      setTimeout(() => setShowIOSInstructions(true), 5000);
    }

    // Clean up event listener
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle the install button click
  const handleInstallClick = async () => {
    if (!installPromptEvent) return;

    // Show the install prompt
    await installPromptEvent.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPromptEvent.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstalled(true);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPromptEvent(null);
    setShowPrompt(false);
  };

  // Close the prompt
  const handleClose = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  // Don't show anything if the app is already installed
  if (isInstalled) return null;

  return (
    <>
      {/* Standard install prompt for Chrome, Edge, etc. */}
      {showPrompt && installPromptEvent && (
        <div className={styles.promptContainer}>
          <div className={styles.prompt}>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
            <h3>Install Excel Workout App</h3>
            <p>Install this app on your device for offline access and a better experience.</p>
            <div className={styles.buttonContainer}>
              <button className={styles.installButton} onClick={handleInstallClick}>
                Install
              </button>
              <button className={styles.laterButton} onClick={handleClose}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari instructions */}
      {isIOS && showIOSInstructions && (
        <div className={styles.promptContainer}>
          <div className={styles.prompt}>
            <button className={styles.closeButton} onClick={handleClose}>×</button>
            <h3>Install Excel Workout App</h3>
            <p>To install this app on your iOS device:</p>
            <ol className={styles.instructions}>
              <li>Tap the <span className={styles.shareIcon}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                </svg>
              </span> share button</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> in the top right corner</li>
            </ol>
            <div className={styles.buttonContainer}>
              <button className={styles.laterButton} onClick={handleClose}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPrompt;