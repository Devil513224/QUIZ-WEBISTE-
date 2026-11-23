import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'drawer' | 'footer';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const buttonClasses =
    variant === 'drawer'
      ? 'flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-[#102544] transition-colors hover:bg-slate-100 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#facc15] dark:hover:bg-[#1b3a6b]'
      : variant === 'footer'
      ? 'inline-flex items-center gap-2 rounded-lg border border-[#24385c] bg-[#16294b] px-3 py-1.5 text-xs font-semibold text-[#facc15] transition-colors hover:bg-[#1b3a6b]'
      : 'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#102544] transition-colors hover:bg-slate-50 sm:h-9 sm:px-3 dark:border-[#24385c] dark:bg-[#16294b] dark:text-[#facc15] dark:hover:bg-[#1b3a6b]';

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isIOS ? 'Install Learn With TG on iOS' : 'Install Learn With TG App'}
        className={buttonClasses}
      >
        {isIOS ? <Smartphone className="h-3.5 w-3.5 shrink-0" /> : <Download className="h-3.5 w-3.5 shrink-0" />}
        <span className={variant === 'header' ? 'hidden md:inline' : ''}>
          {isIOS ? 'Add App' : 'Install App'}
        </span>
      </button>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-pwa-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-[#24385c] dark:bg-[#122443]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  id="ios-pwa-title"
                  className="font-display text-base font-bold text-[#102544] dark:text-white"
                >
                  Install Learn With TG
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-[#9fb0c8]">
                  Add to your iPhone or iPad Home Screen for full-screen app access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close install instructions"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[#16294b] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ol className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-[#24385c] dark:bg-[#0b1730]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#102544] font-mono-num text-xs font-bold text-[#facc15]">
                  1
                </span>
                <span>
                  Tap the <strong className="inline-flex items-center gap-1">Share <Share className="inline h-3.5 w-3.5" /></strong> button in the Safari toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-[#24385c] dark:bg-[#0b1730]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#102544] font-mono-num text-xs font-bold text-[#facc15]">
                  2
                </span>
                <span>
                  Scroll down and tap <strong>Add to Home Screen</strong>.
                </span>
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-lg bg-[#102544] py-2 text-sm font-semibold text-white hover:bg-[#1b3a6b] dark:bg-[#facc15] dark:text-[#102544]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-400/50 bg-[#102544] px-3 py-2 text-xs font-medium text-amber-200 shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" />
      <span>Offline Mode — Cached pages are active</span>
    </div>
  );
};
