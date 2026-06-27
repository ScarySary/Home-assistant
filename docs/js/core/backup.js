const BACKUP_KEY = "householdAssistant.localBackups.v1";
const MAX_BACKUPS = 12;

export function createLocalBackup(data, reason = "Manual backup") {
  const backup = {
    id: crypto.randomUUID(),
    reason,
    createdAt: new Date().toISOString(),
    data: sanitizeBackupData(data)
  };
  const backups = [backup, ...localBackups()].slice(0, MAX_BACKUPS);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
  return backup;
}

export function localBackups() {
  try {
    const saved = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function findLocalBackup(id) {
  return localBackups().find((backup) => backup.id === id) || null;
}

export function clearLocalBackups() {
  localStorage.removeItem(BACKUP_KEY);
}

function sanitizeBackupData(data) {
  return {
    ...data,
    settings: {
      ...data.settings,
      sync: {
        ...data.settings.sync,
        syncSecret: "",
        auth: {
          userId: data.settings.sync.auth?.userId || "",
          email: data.settings.sync.auth?.email || "",
          accessToken: "",
          refreshToken: "",
          expiresAt: 0,
          signedInAt: data.settings.sync.auth?.signedInAt || null
        }
      }
    }
  };
}
