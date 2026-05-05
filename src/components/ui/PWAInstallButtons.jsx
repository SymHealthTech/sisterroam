"use client";

import { useState, useEffect } from "react";

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M3.18 23.76c.38.21.82.26 1.25.12l12.49-7.21-2.72-2.73-11.02 9.82zM.75 1.61C.44 1.97.25 2.5.25 3.17v17.66c0 .67.19 1.2.5 1.56l.08.08 9.9-9.9v-.22L.83 1.53l-.08.08zM20.3 10.28l-2.82-1.63-3.07 3.07 3.07 3.07 2.84-1.64c.81-.47.81-1.23-.02-1.87zM4.43.12L16.92 7.33l-2.72 2.72L3.18.23C3.62.09 4.06.13 4.43.12z" />
  </svg>
);

export default function PWAInstallButtons() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [showIOSTip, setShowIOSTip] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) && !window.MSStream) setPlatform("ios");
    else if (/android/i.test(ua)) setPlatform("android");
    else setPlatform("other");

    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  useEffect(() => {
    if (isInstalled) return;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isInstalled]);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  const btnBase =
    "inline-flex items-center gap-3 px-5 py-3.5 bg-white text-gray-900 rounded-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  // On iOS: App Store button works, Play button dimmed
  // On Android: Play button works (when prompt ready), App Store button dimmed
  // platform=null (SSR/before hydration): both shown, enabled state resolved client-side
  const iosActive = platform === "ios";
  const androidActive = platform === "android" && !!deferredPrompt;

  return (
    <div className="md:hidden flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
      {/* App Store — active on iOS */}
      <button
        type="button"
        onClick={() => {
          if (iosActive) setShowIOSTip((v) => !v);
        }}
        disabled={platform !== null && !iosActive}
        className={`${btnBase} ${iosActive ? "hover:bg-white/90" : ""}`}
        aria-label="Download on the App Store"
      >
        <AppleIcon />
        <div className="text-left">
          <p className="text-[10px] text-gray-500 leading-none">Download on the</p>
          <p className="text-sm font-semibold leading-tight">App Store</p>
        </div>
      </button>

      {/* Google Play — active on Android when prompt is ready */}
      <button
        type="button"
        onClick={handleAndroidInstall}
        disabled={platform !== null && !androidActive}
        className={`${btnBase} ${androidActive ? "hover:bg-white/90" : ""}`}
        aria-label="Get it on Google Play"
      >
        <PlayIcon />
        <div className="text-left">
          <p className="text-[10px] text-gray-500 leading-none">Get it on</p>
          <p className="text-sm font-semibold leading-tight">Google Play</p>
        </div>
      </button>

      {/* iOS "Add to Home Screen" instruction */}
      {showIOSTip && (
        <p className="w-full text-xs text-white/80 leading-relaxed">
          In Safari tap the{" "}
          <span className="font-semibold text-white">Share</span> button{" "}
          <span aria-hidden="true">⎙</span>, then choose{" "}
          <span className="font-semibold text-white">Add to Home Screen</span>.
        </p>
      )}

      {/* Android — prompt not yet fired (PWA criteria not met or already dismissed) */}
      {platform === "android" && !deferredPrompt && (
        <p className="w-full text-xs text-white/60 leading-relaxed">
          Open this page in Chrome to install the app.
        </p>
      )}
    </div>
  );
}
