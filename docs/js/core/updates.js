import { APP_VERSION } from "./constants.js";

export async function checkForUpdates() {
  if (!("serviceWorker" in navigator)) {
    return {
      status: "unavailable",
      message: "Updates are available when the app is opened from a secure browser or installed."
    };
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
  }

  const latest = await fetchLatestVersion();
  if (!latest) {
    return {
      status: "unknown",
      message: "Could not reach the alpha update file. Your household data is still safe on this device."
    };
  }

  if (latest.version === APP_VERSION) {
    return {
      status: "current",
      latest,
      message: `You are running the latest alpha version: ${APP_VERSION}.`
    };
  }

  return {
    status: "available",
    latest,
    message: `Version ${latest.version} is available. Export a backup, then refresh to apply the new app files.`
  };
}

export function applyWaitingUpdate() {
  return navigator.serviceWorker?.getRegistration().then((registration) => {
    if (!registration?.waiting) {
      window.location.reload();
      return;
    }
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  });
}

export function listenForAppUpdate(onWaiting) {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });

  navigator.serviceWorker.ready.then((registration) => {
    if (registration.waiting) onWaiting();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          onWaiting();
        }
      });
    });
  });
}

async function fetchLatestVersion() {
  try {
    const response = await fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
