import { APP_BUILD_DATE, APP_RELEASE_CHANNEL, APP_VERSION, roles } from "../core/constants.js";
import { canManageUsers, createPasswordRecord, normaliseRole } from "../core/auth.js";
import { el, inputField } from "../core/dom.js";
import { notificationSupport, requestReminderPermission, showTestNotification } from "../core/notifications.js";
import { pullHouseholdFromCloud, pushHouseholdToCloud, syncConfigured } from "../core/sync.js";
import { applyWaitingUpdate, checkForUpdates } from "../core/updates.js";

export function renderSettings(app) {
  const data = app.store.get();
  const user = app.user;
  const fileInput = el("input", { id: "backupImport", type: "file", accept: "application/json", className: "hidden-file", onChange: (event) => importBackup(app, event.target.files[0]) });

  return el("section", { className: "view-stack", "aria-labelledby": "settingsTitle" }, [
    el("div", { className: "section-head" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Household foundations" }),
        el("h1", { id: "settingsTitle", text: "Settings" }),
        el("p", { text: "Users, roles, accessibility and backup are separated from the app shell so updates can keep your information." })
      ])
    ]),
    preferences(app, data),
    syncPanel(app, data),
    appStatusPanel(app, data),
    notificationPanel(app, data),
    accountPanel(app, data, user),
    backupPanel(data, fileInput)
  ]);
}

function syncPanel(app, data) {
  const sync = data.settings.sync;
  const urlInput = el("input", { type: "url", value: sync.supabaseUrl, placeholder: "https://your-project.supabase.co", autocomplete: "off" });
  const anonInput = el("input", { type: "password", value: sync.anonKey, placeholder: "Supabase publishable or anon key", autocomplete: "off" });
  const householdInput = el("input", { type: "text", value: sync.householdKey || data.household.id, autocomplete: "off" });
  const secretInput = el("input", { type: "password", value: sync.syncSecret, placeholder: "Shared sync password", autocomplete: "new-password" });
  const status = el("p", { className: "inline-status", role: "status", text: sync.lastStatus || "Sync is not configured yet." });

  const saveSettings = () => {
    app.store.update((next) => {
      next.settings.sync.enabled = true;
      next.settings.sync.supabaseUrl = urlInput.value.trim();
      next.settings.sync.anonKey = anonInput.value.trim();
      next.settings.sync.householdKey = householdInput.value.trim();
      next.settings.sync.syncSecret = secretInput.value;
      next.settings.sync.lastStatus = syncConfigured(next.settings) ? "Sync settings saved. Push this phone first, then pull on the other phone." : "Sync settings saved, but some details are still missing.";
    });
  };

  return el("section", { className: "panel" }, [
    el("div", { className: "card-topline" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Household sync alpha" }),
        el("h2", { text: "Sync between phones" })
      ]),
      el("span", { className: "status-pill", text: syncConfigured(data.settings) ? "Ready" : "Setup needed" })
    ]),
    el("p", { text: "GitHub Pages can install the app, but shared phone data needs a small Supabase database. Sync is manual in this alpha so you stay in control of which phone pushes or pulls." }),
    el("div", { className: "field-grid" }, [
      inputField("Supabase URL", urlInput),
      inputField("Supabase publishable key", anonInput),
      inputField("Household key", householdInput),
      inputField("Shared sync password", secretInput)
    ]),
    el("div", { className: "action-row" }, [
      el("button", {
        type: "button",
        onClick: () => {
          saveSettings();
          status.textContent = "Sync settings saved.";
        },
        text: "Save sync settings"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Pushing this phone to the cloud...";
          try {
            const result = await pushHouseholdToCloud(app.store.get());
            app.store.update((next) => {
              next.settings.sync.lastPushedAt = result.updatedAt;
              next.settings.sync.lastStatus = result.message;
            });
            status.textContent = result.message;
          } catch (error) {
            app.store.update((next) => (next.settings.sync.lastStatus = error.message));
            status.textContent = error.message;
          }
        },
        text: "Push this phone"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Pulling the cloud copy...";
          try {
            const currentSync = app.store.get().settings.sync;
            const cloudData = await pullHouseholdFromCloud(app.store.get().settings);
            app.store.replace({
              ...cloudData,
              settings: {
                ...cloudData.settings,
                sync: {
                  ...currentSync,
                  lastPulledAt: new Date().toISOString(),
                  lastStatus: "Cloud copy imported onto this phone."
                }
              }
            });
          } catch (error) {
            app.store.update((next) => (next.settings.sync.lastStatus = error.message));
            status.textContent = error.message;
          }
        },
        text: "Pull cloud copy"
      })
    ]),
    status,
    el("small", { text: "Before pulling onto a phone with important data, export a backup first." })
  ]);
}

function appStatusPanel(app, data) {
  const status = el("p", { className: "inline-status", role: "status", text: data.settings.updates.lastStatus || "Not checked yet." });
  const checked = data.settings.updates.checkedAt ? `Last checked ${new Date(data.settings.updates.checkedAt).toLocaleString("en-AU")}` : "Manual checks only in this alpha.";

  return el("section", { className: "panel" }, [
    el("div", { className: "card-topline" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Alpha build" }),
        el("h2", { text: "App version and updates" })
      ]),
      el("span", { className: "status-pill", text: APP_RELEASE_CHANNEL })
    ]),
    el("div", { className: "settings-grid" }, [
      settingStat("Installed version", APP_VERSION),
      settingStat("Build date", APP_BUILD_DATE),
      settingStat("Data storage", "Separate browser storage")
    ]),
    el("p", { text: "Updates replace app files only. Household data, users, debts, savings and settings remain in browser storage unless you intentionally clear site data." }),
    el("div", { className: "action-row" }, [
      el("button", {
        type: "button",
        onClick: async () => {
          status.textContent = "Checking for alpha updates...";
          const result = await checkForUpdates();
          app.store.update((next) => {
            next.settings.updates.pending = result.status === "available" || next.settings.updates.pending;
            next.settings.updates.lastStatus = result.message;
            next.settings.updates.checkedAt = new Date().toISOString();
          });
          status.textContent = result.message;
        },
        text: "Check for updates"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        disabled: data.settings.updates.pending ? null : "disabled",
        onClick: () => applyWaitingUpdate(),
        text: "Apply safe update"
      })
    ]),
    status,
    el("small", { text: checked }),
    changelog()
  ]);
}

function notificationPanel(app, data) {
  const support = notificationSupport();
  const status = el("p", { className: "inline-status", role: "status", text: data.settings.notifications.lastStatus || `Permission: ${support.permission}` });
  const notificationTypes = [
    ["bills", "Bill reminders"],
    ["chores", "Chore reminders"],
    ["calendar", "Calendar reminders"],
    ["shopping", "Shopping reminders"]
  ];

  return el("section", { className: "panel" }, [
    el("div", { className: "card-topline" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Android reminders" }),
        el("h2", { text: "Notifications" })
      ]),
      el("span", { className: "status-pill", text: support.permission })
    ]),
    el("p", { text: "Alpha notifications can ask for permission and send local test reminders. Scheduled bill, chore, calendar and shopping reminders are prepared as placeholders for future modules." }),
    el("div", { className: "action-row" }, [
      el("button", {
        type: "button",
        onClick: async () => {
          const result = await requestReminderPermission();
          app.store.update((next) => {
            next.settings.notifications.enabled = result.permission === "granted";
            next.settings.notifications.permission = result.permission;
            next.settings.notifications.lastStatus = result.message;
          });
          status.textContent = result.message;
        },
        text: "Turn on reminders"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          const message = await showTestNotification();
          app.store.update((next) => {
            next.settings.notifications.lastStatus = message;
          });
          status.textContent = message;
        },
        text: "Send test reminder"
      })
    ]),
    el("div", { className: "toggle-list" }, notificationTypes.map(([key, label]) =>
      el("label", { className: "toggle-row" }, [
        el("input", {
          type: "checkbox",
          checked: data.settings.notifications[key] ? "checked" : null,
          onChange: (event) => app.store.update((next) => (next.settings.notifications[key] = event.target.checked))
        }),
        el("span", { text: label })
      ])
    )),
    status
  ]);
}

function preferences(app, data) {
  return el("section", { className: "panel" }, [
    el("h2", { text: "Accessibility" }),
    el("div", { className: "field-grid" }, [
      inputField("Theme", select(data.settings.theme, ["light", "dark"], (value) => app.store.update((next) => (next.settings.theme = value)))),
      inputField("Text size", select(data.settings.textScale, ["comfortable", "large", "extra-large"], (value) => app.store.update((next) => (next.settings.textScale = value))))
    ]),
    el("label", { className: "toggle-row" }, [
      el("input", { type: "checkbox", checked: data.settings.highContrast ? "checked" : null, onChange: (event) => app.store.update((next) => (next.settings.highContrast = event.target.checked)) }),
      el("span", { text: "Use stronger contrast throughout the app" })
    ])
  ]);
}

function accountPanel(app, data, user) {
  const addArea = canManageUsers(user) ? addUserForm(app) : el("p", { className: "planned-note", text: "Only Administrators can add household users." });
  return el("section", { className: "panel" }, [
    el("h2", { text: "Household users" }),
    el("div", { className: "user-list" }, data.users.map((member) => userRow(member))),
    addArea
  ]);
}

function backupPanel(data, fileInput) {
  return el("section", { className: "panel" }, [
    el("h2", { text: "Backup, export and import" }),
    el("p", { text: "Backups contain household data only. Keep one before testing on a new phone or applying an alpha update." }),
    el("div", { className: "action-row" }, [
      el("button", { type: "button", onClick: () => exportBackup(data), text: "Export data backup" }),
      el("label", { className: "file-button", for: "backupImport", text: "Import backup" }),
      fileInput
    ])
  ]);
}

function settingStat(label, value) {
  return el("article", { className: "setting-stat" }, [
    el("span", { text: label }),
    el("strong", { text: value })
  ]);
}

function changelog() {
  return el("details", { className: "changelog-card" }, [
    el("summary", { text: "View alpha changelog" }),
    el("ul", {}, [
      el("li", { text: "Packaged as an installable PWA alpha for Android and Windows browser testing." }),
      el("li", { text: "Added manual update checks, safe update status and offline cache refresh support." }),
      el("li", { text: "Added notification permission flow and local test reminders." }),
      el("li", { text: "Kept household data separate from app files so updates do not erase user data." })
    ])
  ]);
}

function userRow(member) {
  return el("article", { className: "user-row" }, [
    el("div", {}, [el("strong", { text: member.name }), el("span", { text: member.role })]),
    el("span", { className: "status-pill", text: member.role === "Administrator" ? "Full access" : "Role ready" })
  ]);
}

function addUserForm(app) {
  const name = el("input", { type: "text", autocomplete: "name" });
  const role = select("Adult", roles, () => {});
  const password = el("input", { type: "password", autocomplete: "new-password" });
  const status = el("p", { className: "inline-status", role: "status" });

  return el("form", {
    className: "subform",
    onSubmit: async (event) => {
      event.preventDefault();
      if (!name.value.trim() || password.value.length < 8) {
        status.textContent = "Use a name and a password of at least 8 characters.";
        return;
      }
      const passwordRecord = await createPasswordRecord(password.value);
      app.store.update((data) => {
        data.users.push({
          id: crypto.randomUUID(),
          name: name.value.trim(),
          role: normaliseRole(role.value),
          password: passwordRecord,
          createdAt: new Date().toISOString()
        });
      });
    }
  }, [
    el("h3", { text: "Add household user" }),
    el("div", { className: "field-grid" }, [
      inputField("Name", name),
      inputField("Role", role),
      inputField("Password", password)
    ]),
    el("button", { type: "submit", text: "Add user" }),
    status
  ]);
}

function select(value, options, onChange) {
  const node = el("select", { onChange: (event) => onChange(event.target.value) });
  options.forEach((option) => {
    const optionNode = el("option", { value: option, text: option });
    if (option === value) optionNode.selected = true;
    node.append(optionNode);
  });
  return node;
}

function exportBackup(data) {
  const blob = new Blob([JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `household-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importBackup(app, file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      app.store.replace(JSON.parse(reader.result));
    } catch {
      alert("That backup file could not be read.");
    }
  });
  reader.readAsText(file);
}
