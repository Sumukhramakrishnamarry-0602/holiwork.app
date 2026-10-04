"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Holiwork service worker registration failed:", error);
      });
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setMessage("Holiwork has been installed on this device.");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (!installEvent) {
      setMessage("To install, open your browser menu and choose Install app or Add to Home Screen.");
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setMessage(choice.outcome === "accepted" ? "Holiwork is being installed." : "Installation was cancelled. You can install it later from your browser menu.");
    setInstallEvent(null);
  }

  if (installed) {
    return <div className="pwa-install-note" role="status">{message}</div>;
  }

  return (
    <div className="pwa-install-bar">
      <div>
        <strong>Take Holiwork with you</strong>
        <p>Install the app for quick access from your home screen.</p>
        {message && <p className="pwa-install-message" role="status">{message}</p>}
      </div>
      <button className="primary-btn" type="button" onClick={installApp}>Install app</button>
    </div>
  );
}
