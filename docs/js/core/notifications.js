export function notificationSupport() {
  const hasNotification = "Notification" in window;
  const hasServiceWorker = "serviceWorker" in navigator;
  return {
    supported: hasNotification && hasServiceWorker,
    permission: hasNotification ? Notification.permission : "unsupported"
  };
}

export async function requestReminderPermission() {
  const support = notificationSupport();
  if (!support.supported) {
    return {
      permission: support.permission,
      message: "Notifications need an installed or secure browser version of the app."
    };
  }

  const permission = await Notification.requestPermission();
  return {
    permission,
    message: permission === "granted"
      ? "Reminder notifications are enabled for this device."
      : "Notifications are not enabled. You can change this later in browser or Android app settings."
  };
}

export async function showTestNotification() {
  const support = notificationSupport();
  if (!support.supported || support.permission !== "granted") {
    return "Turn on notification permission first.";
  }

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("Household Assistant", {
    body: "Alpha reminders are ready for bills, chores, calendar events and shopping placeholders.",
    tag: "household-assistant-alpha-test",
    icon: "./icons/icon-192.png",
    badge: "./icons/badge-96.png",
    data: { route: "dashboard" }
  });
  return "Test reminder sent.";
}
