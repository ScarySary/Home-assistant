import { APP_BUILD_DATE, APP_RELEASE_CHANNEL, APP_VERSION, roles } from "../core/constants.js";
import { canManageUsers, createPasswordRecord, normaliseRole } from "../core/auth.js";
import { el, inputField } from "../core/dom.js";
import { notificationSupport, requestReminderPermission, showTestNotification } from "../core/notifications.js";
import { cloudSignedIn, createCloudHousehold, friendlySyncMessage, loadCloudMembers, loadCloudMembership, pullHouseholdFromCloud, pushHouseholdToCloud, sanitizedSync, signInSupabaseAccount, signUpSupabaseAccount, syncConfigured, syncStatus } from "../core/sync.js";
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
    settingsSection("accessibility", "Accessibility", "Theme, text size and contrast.", preferences(app, data), true),
    settingsSection("sync", "Sync", "Connect phones and move household data.", syncPanel(app, data)),
    settingsSection("version", "App version", "Updates, alpha build and changelog.", appStatusPanel(app, data)),
    settingsSection("notifications", "Notifications", "Reminder permission and reminder types.", notificationPanel(app, data)),
    settingsSection("users", "Household users", "Members, roles and new users.", accountPanel(app, data, user)),
    settingsSection("backup", "Backup", "Export and import household data.", backupPanel(app, data, fileInput))
  ]);
}

function settingsSection(id, title, copy, content, defaultOpen = false) {
  const openSections = JSON.parse(sessionStorage.getItem("householdAssistant.openSettings.v1") || "{}");
  const isOpen = openSections[id] ?? defaultOpen;
  return el("details", {
    className: "settings-section",
    open: isOpen ? "open" : null,
    onToggle: (event) => {
      const next = JSON.parse(sessionStorage.getItem("householdAssistant.openSettings.v1") || "{}");
      next[id] = event.currentTarget.open;
      sessionStorage.setItem("householdAssistant.openSettings.v1", JSON.stringify(next));
    }
  }, [
    el("summary", {}, [
      el("span", { text: title }),
      el("small", { text: copy })
    ]),
    content
  ]);
}

function syncPanel(app, data) {
  const sync = data.settings.sync;
  const urlInput = el("input", { type: "url", value: sync.supabaseUrl, placeholder: "https://your-project.supabase.co", autocomplete: "off" });
  const anonInput = el("input", { type: "password", value: sync.anonKey, placeholder: "Supabase publishable or anon key", autocomplete: "off" });
  const householdInput = el("input", { type: "text", value: sync.householdKey || "", placeholder: "Cloud household ID appears here", autocomplete: "off" });
  const deviceInput = el("input", { type: "text", value: sync.deviceName || "This phone", placeholder: "Sara's phone", autocomplete: "off" });
  const emailInput = el("input", { type: "email", value: sync.auth?.email || "", placeholder: "you@example.com", autocomplete: "email" });
  const passwordInput = el("input", { type: "password", placeholder: "Supabase account password", autocomplete: "current-password" });
  const status = el("p", { className: "inline-status", role: "status", text: friendlySyncMessage(sync.lastStatus) || "Sync is not configured yet." });
  const statusText = syncStatus(data.settings);
  const canUseAutoSync = Boolean(sync.backupExportedAt && cloudSignedIn(data.settings) && sync.lastManualSyncAt);

  const saveSettings = () => {
    app.store.update((next) => {
      next.settings.sync.enabled = true;
      next.settings.sync.supabaseUrl = urlInput.value.trim();
      next.settings.sync.anonKey = anonInput.value.trim();
      next.settings.sync.householdKey = householdInput.value.trim();
      next.settings.sync.deviceName = deviceInput.value.trim() || "This phone";
      next.settings.sync.mode = "supabase-auth";
      next.settings.sync.status = syncConfigured(next.settings) ? "Local only" : "Local only";
      next.settings.sync.lastStatus = syncConfigured(next.settings) ? "Supabase details saved. Export a backup before signing in and syncing." : "Sync settings saved, but the Supabase URL or publishable key is missing.";
    });
  };

  const saveAuth = (auth) => {
    app.store.update((next) => {
      next.settings.sync.auth = auth;
      next.settings.sync.status = auth.accessToken ? "Synced" : "Local only";
      next.settings.sync.lastStatus = auth.message || "Supabase account updated.";
      if (auth.email) next.settings.sync.auth.email = auth.email;
    });
  };

  const syncNow = async () => {
    saveSettings();
    if (!app.store.get().settings.sync.backupExportedAt) {
      status.textContent = "Export a backup first, then press Sync now.";
      app.store.update((next) => {
        next.settings.sync.status = "Sync error";
        next.settings.sync.lastStatus = "Backup needed before sync.";
      });
      return;
    }
    status.textContent = "Syncing...";
    app.store.update((next) => {
      next.settings.sync.status = "Syncing";
      next.settings.sync.lastStatus = "Syncing...";
    });
    try {
      const result = await pushHouseholdToCloud(app.store.get());
      app.store.replace({
        ...result.data,
        settings: {
          ...result.data.settings,
          sync: {
            ...app.store.get().settings.sync,
            status: "Synced",
            lastManualSyncAt: result.updatedAt,
            lastPushedAt: result.updatedAt,
            lastPulledAt: result.updatedAt,
            lastConflictWarning: result.conflictWarning,
            lastConflictAt: result.conflictWarning ? result.updatedAt : null,
            lastStatus: result.conflictWarning || `Synced just now from ${app.store.get().settings.sync.deviceName || "this phone"}.`
          }
        }
      });
    } catch (error) {
      const message = friendlySyncMessage(error.message);
      app.store.update((next) => {
        next.settings.sync.status = "Sync error";
        next.settings.sync.lastError = error.message;
        next.settings.sync.lastStatus = message;
      });
      status.textContent = message;
    }
  };

  return el("section", { className: "panel" }, [
    el("div", { className: "card-topline" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Private household sync alpha" }),
        el("h2", { text: "Supabase Auth sync" })
      ]),
      el("span", { className: `status-pill sync-${statusText.toLowerCase().replaceAll(" ", "-")}`, text: statusText })
    ]),
    el("p", { text: "Shared phone data now uses Supabase Auth and household-level database rules. Only use the public publishable/anon key here. Never paste a service_role or secret key into this app." }),
    syncOverview(sync, statusText),
    syncSetupChecklist(data),
    el("div", { className: "warning-card" }, [
      el("strong", { text: "Before enabling sync, export a backup first." }),
      el("span", { text: sync.backupExportedAt ? `Last backup exported ${new Date(sync.backupExportedAt).toLocaleString("en-AU")}` : "This protects your local phone data before any cloud copy is created." })
    ]),
    el("div", { className: "field-grid" }, [
      inputField("Supabase URL", urlInput),
      inputField("Supabase publishable key", anonInput),
      inputField("Cloud household ID", householdInput),
      inputField("This device name", deviceInput)
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
      el("button", { type: "button", className: "secondary", onClick: () => exportBackup(app.store.get(), app), text: "Export backup first" })
    ]),
    el("div", { className: "subform" }, [
      el("h3", { text: "Supabase account" }),
      el("p", { text: cloudSignedIn(data.settings) ? `Signed in as ${sync.auth.email}` : "Sign in or create a Supabase Auth user before syncing. Your app password and household data are not put into GitHub." }),
      el("div", { className: "field-grid" }, [
        inputField("Email", emailInput),
        inputField("Password", passwordInput)
      ]),
      el("div", { className: "action-row" }, [
        el("button", {
          type: "button",
          onClick: async () => {
            saveSettings();
            status.textContent = "Signing in...";
            try {
              saveAuth(await signInSupabaseAccount(app.store.get().settings, emailInput.value, passwordInput.value));
            } catch (error) {
              const message = friendlySyncMessage(error.message);
              app.store.update((next) => {
                next.settings.sync.status = "Sync error";
                next.settings.sync.lastStatus = message;
              });
              status.textContent = message;
            }
          },
          text: "Sign in"
        }),
        el("button", {
          type: "button",
          className: "secondary",
          onClick: async () => {
            saveSettings();
            status.textContent = "Creating Supabase account...";
            try {
              saveAuth(await signUpSupabaseAccount(app.store.get().settings, emailInput.value, passwordInput.value));
            } catch (error) {
              const message = friendlySyncMessage(error.message);
              app.store.update((next) => {
                next.settings.sync.status = "Sync error";
                next.settings.sync.lastStatus = message;
              });
              status.textContent = message;
            }
          },
          text: "Create account"
        })
      ])
    ]),
    el("div", { className: "action-row" }, [
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Creating private household...";
          try {
            const cloud = await createCloudHousehold(app.store.get(), data.household.name);
            app.store.update((next) => {
              next.household.id = cloud.householdId || next.household.id;
              next.settings.sync.householdKey = cloud.householdId || next.settings.sync.householdKey;
              next.settings.sync.lastStatus = "Household connected. Press Sync now.";
              next.settings.sync.status = "Synced";
            });
          } catch (error) {
            const message = friendlySyncMessage(error.message);
            app.store.update((next) => {
              next.settings.sync.status = "Sync error";
              next.settings.sync.lastStatus = message;
            });
            status.textContent = message;
          }
        },
        text: "Create cloud household"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Checking your household access...";
          try {
            const membership = await loadCloudMembership(app.store.get().settings);
            if (!membership) throw new Error("No household membership was found for this Supabase user.");
            app.store.update((next) => {
              next.household.id = membership.household_id;
              next.settings.sync.householdKey = membership.household_id;
              next.settings.sync.lastStatus = `Joined household as ${membership.role}. Press Sync now.`;
              next.settings.sync.status = "Synced";
            });
          } catch (error) {
            const message = friendlySyncMessage(error.message);
            app.store.update((next) => {
              next.settings.sync.status = "Sync error";
              next.settings.sync.lastStatus = message;
            });
            status.textContent = message;
          }
        },
        text: "Join existing household"
      }),
      el("button", {
        type: "button",
        onClick: syncNow,
        text: "Sync now"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Pulling the cloud copy safely...";
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
                  status: "Synced",
                  lastConflictWarning: "",
                  lastConflictAt: null,
                  lastStatus: "Cloud copy imported onto this phone."
                }
              }
            });
          } catch (error) {
            const message = friendlySyncMessage(error.message);
            app.store.update((next) => {
              next.settings.sync.status = "Sync error";
              next.settings.sync.lastStatus = message;
            });
            status.textContent = message;
          }
        },
        text: "Pull cloud copy only"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: async () => {
          saveSettings();
          status.textContent = "Refreshing household members...";
          try {
            const members = await loadCloudMembers(app.store.get().settings);
            app.store.update((next) => {
              next.settings.sync.cloudMembers = members;
              next.settings.sync.lastStatus = `${members.length} household member${members.length === 1 ? "" : "s"} connected.`;
              next.settings.sync.status = "Synced";
            });
          } catch (error) {
            const message = friendlySyncMessage(error.message);
            app.store.update((next) => {
              next.settings.sync.status = "Sync error";
              next.settings.sync.lastStatus = message;
            });
            status.textContent = message;
          }
        },
        text: "Refresh members"
      }),
      el("button", {
        type: "button",
        className: "secondary",
        onClick: () => {
          app.store.update((next) => {
            next.settings.sync.lastConflictWarning = "";
            next.settings.sync.lastConflictAt = null;
            next.settings.sync.lastStatus = "Sync message cleared. Run Sync now when ready.";
            next.settings.sync.status = syncConfigured(next.settings) ? "Synced" : "Local only";
          });
        },
        text: "Clear sync message"
      })
    ]),
    el("label", { className: "toggle-row" }, [
      el("input", {
        type: "checkbox",
        checked: sync.autoSync ? "checked" : null,
        disabled: canUseAutoSync ? null : "disabled",
        onChange: (event) => app.store.update((next) => {
          next.settings.sync.autoSync = event.target.checked;
          next.settings.sync.lastStatus = event.target.checked ? "Auto-sync is on after manual sync." : "Auto-sync is off.";
        })
      }),
      el("span", { text: canUseAutoSync ? "Auto-sync after local changes" : "Auto-sync unlocks after backup, sign-in and one manual sync" })
    ]),
    status,
    householdMembers(sync),
    sync.lastConflictWarning ? el("small", { className: "warning-text", text: `${sync.lastConflictWarning} This was handled; clear the message after you have checked both phones.` }) : el("small", { text: "If two devices edit the same item, the newest updatedAt timestamp wins and a warning appears here." })
  ]);
}

function syncOverview(sync, statusText) {
  const lastSynced = sync.lastManualSyncAt || sync.lastPulledAt || sync.lastPushedAt;
  const conflictText = sync.lastConflictWarning
    ? `Resolved ${sync.lastConflictWarning.replace(" resolved. The newest edit was kept.", "").toLowerCase()}`
    : "No active conflicts";
  return el("div", { className: "sync-overview-grid", "aria-label": "Sync overview" }, [
    settingStat("Sync status", statusText),
    settingStat("Last synced", lastSynced ? new Date(lastSynced).toLocaleString("en-AU") : "Not yet"),
    settingStat("This device", sync.deviceName || "This phone"),
    settingStat("Conflicts", conflictText)
  ]);
}

function syncSetupChecklist(data) {
  const sync = data.settings.sync;
  const steps = [
    ["Supabase details saved", syncConfigured(data.settings)],
    ["Backup exported", Boolean(sync.backupExportedAt)],
    ["Signed in", cloudSignedIn(data.settings)],
    ["Household connected", Boolean(sync.householdKey)],
    ["Manual sync completed", Boolean(sync.lastManualSyncAt)]
  ];
  return el("div", { className: "sync-checklist", "aria-label": "Sync setup checklist" }, [
    el("strong", { text: "Sync setup checklist" }),
    el("div", {}, steps.map(([label, done]) =>
      el("span", { className: done ? "check-item done" : "check-item" }, [
        el("span", { "aria-hidden": "true", text: done ? "Done" : "Next" }),
        el("span", { text: label })
      ])
    ))
  ]);
}

function householdMembers(sync) {
  const members = Array.isArray(sync.cloudMembers) ? sync.cloudMembers : [];
  return el("div", { className: "sync-members" }, [
    el("strong", { text: "Connected household members" }),
    members.length
      ? el("div", { className: "user-list compact-user-list" }, members.map((member) =>
          el("article", { className: "user-row" }, [
            el("div", {}, [
              el("strong", { text: member.role || "Member" }),
              el("span", { text: shortId(member.user_id) })
            ]),
            el("span", { className: "status-pill", text: "Connected" })
          ])
        ))
      : el("p", { className: "planned-note", text: "Press Refresh members after Sara and Zac are both added in Supabase." })
  ]);
}

function shortId(value = "") {
  return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value || "Unknown user";
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
    el("div", { className: "field-grid" }, [
      inputField("Theme", select(data.settings.theme, ["light", "dark"], (value) => app.store.update((next) => (next.settings.theme = value)))),
      inputField("Text size", select(data.settings.textScale, ["small", "comfortable", "large", "extra-large"], (value) => app.store.update((next) => (next.settings.textScale = value))))
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

function backupPanel(app, data, fileInput) {
  return el("section", { className: "panel" }, [
    el("h2", { text: "Backup, export and import" }),
    el("p", { text: "Backups contain household data only. Cloud access tokens and old sync passwords are removed from exported backup files." }),
    el("div", { className: "action-row" }, [
      el("button", { type: "button", onClick: () => exportBackup(data, app), text: "Export data backup" }),
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

function exportBackup(data, app = null) {
  const exportedAt = new Date().toISOString();
  const backup = {
    ...data,
    settings: {
      ...data.settings,
      sync: sanitizedSync(data.settings.sync)
    },
    exportedAt
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `household-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  if (app) {
    app.store.update((next) => {
      next.settings.sync.backupExportedAt = exportedAt;
      next.settings.sync.lastStatus = "Backup exported. You can now continue sync setup.";
    });
  }
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
