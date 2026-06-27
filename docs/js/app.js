import { APP_VERSION, moduleCatalog, roles } from "./core/constants.js";
import { createStore, hasHouseholdData, saveData } from "./core/store.js";
import { clearSession, createPasswordRecord, currentUser, setSession, verifyPassword } from "./core/auth.js";
import { el, inputField } from "./core/dom.js";
import { icon } from "./core/icons.js";
import { friendlySyncMessage, syncHouseholdSnapshot, syncStatus } from "./core/sync.js";
import { listenForAppUpdate } from "./core/updates.js";
import { renderDashboard } from "./modules/dashboard.js";
import { renderDebts } from "./modules/debts.js";
import { renderFood, renderMoney, renderTasks } from "./modules/hubs.js";
import { renderSavings } from "./modules/savings.js";
import { renderSettings } from "./modules/settings.js";
import { renderStreaming } from "./modules/streaming.js";

const store = createStore();
const root = document.querySelector("#app");
const routes = {
  dashboard: renderDashboard,
  money: renderMoney,
  tasks: renderTasks,
  food: renderFood,
  debts: renderDebts,
  savings: renderSavings,
  streaming: renderStreaming,
  settings: renderSettings
};
let autoSyncTimer = null;
let lastAutoSyncedUpdate = "";
let autoSyncInFlight = false;

const app = {
  store,
  user: null,
  route: "dashboard",
  navigate(route) {
    this.route = routes[route] ? route : "dashboard";
    history.replaceState(null, "", `#${this.route}`);
    render();
  }
};

store.subscribe((data) => {
  render();
  queueAutoSync(data);
});
window.addEventListener("hashchange", () => {
  app.route = location.hash.replace("#", "") || "dashboard";
  render();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js").then(() => {
    listenForAppUpdate(() => {
      store.update((data) => {
        data.settings.updates.pending = true;
        data.settings.updates.lastStatus = "A safe app update is ready. Your household data will stay on this device.";
        data.settings.updates.checkedAt = new Date().toISOString();
      });
    });
  }).catch(() => {});
}

render();

function render() {
  const data = store.get();
  app.user = currentUser(data);
  document.body.dataset.theme = data.settings.theme;
  document.body.dataset.contrast = data.settings.highContrast ? "high" : "standard";
  document.body.dataset.scale = data.settings.textScale;

  root.innerHTML = "";
  if (!hasHouseholdData() || !data.users.length) {
    root.append(renderSetup());
    return;
  }
  if (!app.user) {
    root.append(renderLogin(data));
    return;
  }

  app.route = routes[location.hash.replace("#", "")] ? location.hash.replace("#", "") : app.route;
  root.append(renderShell(data));
}

function renderShell(data) {
  const view = routes[app.route] || routes.dashboard;
  return el("div", { className: "app-layout" }, [
    el("aside", { className: "sidebar", "aria-label": "Main navigation" }, [
      el("div", { className: "brand-block" }, [
        el("div", { className: "brand-mark", "aria-hidden": "true", text: "HA" }),
        el("div", {}, [el("strong", { text: "Household Assistant" }), el("span", { text: `v${APP_VERSION}` })])
      ]),
      el("nav", { className: "nav-list" }, moduleCatalog.map((module) => navButton(module))),
      el("div", { className: "user-chip" }, [
        el("span", { text: `${app.user.name} - ${app.user.role}` }),
        el("button", { type: "button", className: "secondary compact", onClick: () => { clearSession(); render(); }, text: "Sign out" })
      ])
    ]),
    el("div", { className: "main-column" }, [
      el("header", { className: "topbar" }, [
        el("div", { className: "topbar-left" }, [
          appMenu(data),
          el("div", {}, [
            el("p", { className: "eyebrow", text: data.household.country }),
            el("strong", { text: data.household.name })
          ])
        ]),
        el("div", { className: "topbar-actions" }, [
          el("span", { className: `status-pill sync-${syncStatus(data.settings).toLowerCase().replaceAll(" ", "-")}`, text: syncStatus(data.settings) }),
          el("button", { type: "button", className: "secondary", onClick: toggleTheme, text: data.settings.theme === "dark" ? "Light mode" : "Dark mode" })
        ])
      ]),
      el("main", { id: "mainContent", className: "content", tabindex: "-1" }, [searchPanel(data), view(app)])
    ]),
    floatingActions()
  ]); 
}

function appMenu(data) {
  return el("details", { className: "app-menu" }, [
    el("summary", { className: "menu-button", "aria-label": "Open app menu" }, [icon("menu")]),
    el("div", { className: "app-menu-panel" }, [
      el("div", { className: "app-menu-head" }, [
        el("div", { className: "brand-mark", "aria-hidden": "true", text: "HA" }),
        el("div", {}, [
          el("strong", { text: "Household Assistant" }),
          el("span", { text: `v${APP_VERSION}` })
        ])
      ]),
      el("nav", { className: "app-menu-list", "aria-label": "All app areas" }, moduleCatalog.map((module) => menuButton(module))),
      el("div", { className: "app-menu-foot" }, [
        el("span", { text: `${app.user.name} - ${app.user.role}` }),
        el("button", { type: "button", className: "secondary compact", onClick: () => { clearSession(); render(); }, text: "Sign out" })
      ])
    ])
  ]);
}

function menuButton(module) {
  const active = app.route === module.id;
  const enabled = routes[module.id];
  return el("button", {
    type: "button",
    className: `app-menu-item ${active ? "active" : ""}`,
    disabled: enabled ? null : "disabled",
    "aria-current": active ? "page" : null,
    onClick: enabled ? () => app.navigate(module.id) : null
  }, [
    el("span", { text: module.name }),
    el("small", { text: module.status === "active" ? "Ready" : "Planned" })
  ]);
}

function navButton(module) {
  const active = app.route === module.id;
  const enabled = routes[module.id];
  return el("button", {
    type: "button",
    className: `nav-button ${active ? "active" : ""}`,
    disabled: enabled ? null : "disabled",
    "aria-current": active ? "page" : null,
    onClick: enabled ? () => app.navigate(module.id) : null
  }, [
    el("span", { text: module.name }),
    el("small", { text: module.status === "active" ? "Ready" : `Phase ${module.phase}` })
  ]);
}

function searchPanel(data) {
  const results = el("div", { className: "search-results", role: "status" });
  const input = el("input", {
    type: "search",
    placeholder: "Search household",
    "aria-label": "Search household",
    onInput: (event) => updateSearchResults(results, data, event.target.value)
  });

  return el("section", { className: "app-search", "aria-label": "Search" }, [
    el("div", { className: "search-box" }, [icon("search"), input]),
    results
  ]);
}

function updateSearchResults(container, data, query) {
  const text = query.trim().toLowerCase();
  container.innerHTML = "";
  if (!text) {
    return;
  }

  const results = searchItems(data).filter((item) => item.search.includes(text)).slice(0, 6);
  if (!results.length) {
    container.textContent = "No matching household items yet.";
    return;
  }

  results.forEach((item) => {
    container.append(el("button", {
      type: "button",
      className: "search-result",
      onClick: () => app.navigate(item.route)
    }, [
      icon(item.iconName),
      el("span", { text: item.label }),
      el("small", { text: item.area })
    ]));
  });
}

function searchItems(data) {
  const debts = data.modules.debts.items.map((debt) => ({
    label: debt.name,
    area: "Debt Tracker",
    route: "debts",
    iconName: "debts"
  }));
  const savings = data.modules.savings.goals.map((goal) => ({
    label: goal.name,
    area: "Savings Goals",
    route: "savings",
    iconName: "savings"
  }));
  const streaming = (data.modules.streaming?.items || []).map((service) => ({
    label: service.serviceName,
    area: "Streaming Services",
    route: "streaming",
    iconName: "bills"
  }));
  const builtIns = [
    ["Budget", "Money", "money", "money"],
    ["Bills", "Money", "money", "bills"],
    ["Streaming services", "Money", "streaming", "bills"],
    ["Shopping list", "Food", "food", "shopping"],
    ["Pantry", "Food", "food", "shopping"],
    ["Fridge", "Food", "food", "shopping"],
    ["Meal planning", "Food", "food", "meals"],
    ["Chores", "Tasks", "tasks", "chores"],
    ["Calendar", "Tasks", "tasks", "calendar"],
    ["Reminders", "Tasks", "tasks", "calendar"],
    ["Users", "Settings", "settings", "settings"],
    ["Backups", "Settings", "settings", "settings"],
    ["Accessibility", "Settings", "settings", "settings"]
  ].map(([label, area, route, iconName]) => ({ label, area, route, iconName }));

  return [...debts, ...savings, ...streaming, ...builtIns].map((item) => ({
    ...item,
    search: `${item.label} ${item.area}`.toLowerCase()
  }));
}

function floatingActions() {
  const note = el("p", { className: "fab-note", role: "status", text: "Choose a quick add action." });
  const placeholder = (label) => {
    note.textContent = `${label} will be available when that module is implemented.`;
  };

  return el("details", { className: "fab-menu" }, [
    el("summary", { className: "fab-button", "aria-label": "Add item" }, [icon("plus")]),
    el("div", { className: "fab-actions" }, [
      el("button", { type: "button", onClick: () => app.navigate("debts") }, [icon("debts"), el("span", { text: "Debt payment" })]),
      el("button", { type: "button", onClick: () => app.navigate("savings") }, [icon("savings"), el("span", { text: "Savings" })]),
      el("button", { type: "button", className: "secondary", onClick: () => placeholder("Shopping") }, [icon("shopping"), el("span", { text: "Shopping item" })]),
      el("button", { type: "button", className: "secondary", onClick: () => placeholder("Calendar") }, [icon("calendar"), el("span", { text: "Calendar event" })]),
      note
    ])
  ]);
}

function renderSetup() {
  const householdName = el("input", { type: "text", value: "Our Household", autocomplete: "organization" });
  const adminName = el("input", { type: "text", autocomplete: "name" });
  const password = el("input", { type: "password", autocomplete: "new-password" });
  const status = el("p", { className: "inline-status", role: "status" });

  return authPanel("Create your household", "Set up the first Administrator account. Passwords are hashed before they are saved in browser storage.", [
    el("form", {
      className: "auth-form",
      onSubmit: async (event) => {
        event.preventDefault();
        if (!adminName.value.trim() || password.value.length < 8) {
          status.textContent = "Use your name and a password of at least 8 characters.";
          return;
        }
        const passwordRecord = await createPasswordRecord(password.value);
        store.update((data) => {
          data.household.name = householdName.value.trim() || "Our Household";
          data.users = [{
            id: crypto.randomUUID(),
            name: adminName.value.trim(),
            role: "Administrator",
            password: passwordRecord,
            createdAt: new Date().toISOString()
          }];
        });
        setSession(store.get().users[0].id);
        saveData(store.get());
        render();
      }
    }, [
      inputField("Household name", householdName),
      inputField("Administrator name", adminName),
      inputField("Password", password),
      el("button", { type: "submit", text: "Create household" }),
      status
    ])
  ]);
}

function renderLogin(data) {
  const userSelect = el("select", {});
  data.users.forEach((user) => userSelect.append(el("option", { value: user.id, text: `${user.name} - ${user.role}` })));
  const password = el("input", { type: "password", autocomplete: "current-password" });
  const status = el("p", { className: "inline-status", role: "status" });

  return authPanel("Welcome back", "Sign in to your private household workspace.", [
    el("form", {
      className: "auth-form",
      onSubmit: async (event) => {
        event.preventDefault();
        const user = data.users.find((member) => member.id === userSelect.value);
        if (!user || !(await verifyPassword(password.value, user.password))) {
          status.textContent = "The password did not match this household user.";
          return;
        }
        setSession(user.id);
        render();
      }
    }, [
      inputField("User", userSelect),
      inputField("Password", password),
      el("button", { type: "submit", text: "Sign in" }),
      status
    ])
  ]);
}

function authPanel(title, copy, children) {
  return el("main", { className: "auth-screen" }, [
    el("section", { className: "auth-card", "aria-labelledby": "authTitle" }, [
      el("div", { className: "brand-mark large", "aria-hidden": "true", text: "HA" }),
      el("p", { className: "eyebrow", text: "Household Assistant" }),
      el("h1", { id: "authTitle", text: title }),
      el("p", { text: copy }),
      ...children,
      el("p", { className: "security-note", text: `Roles supported now: ${roles.join(", ")}.` })
    ])
  ]);
}

function toggleTheme() {
  store.update((data) => {
    data.settings.theme = data.settings.theme === "dark" ? "light" : "dark";
  });
}

function queueAutoSync(data) {
  const sync = data.settings.sync;
  if (autoSyncInFlight) return;
  if (!sync.autoSync || sync.status === "Syncing" || !sync.auth?.accessToken || !sync.householdKey) return;
  if (!sync.backupExportedAt || !sync.lastManualSyncAt) return;
  if (data.meta.updatedAt === lastAutoSyncedUpdate) return;
  clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(async () => {
    const latest = store.get();
    if (autoSyncInFlight) return;
    if (!latest.settings.sync.autoSync || latest.settings.sync.status === "Syncing") return;
    autoSyncInFlight = true;
    lastAutoSyncedUpdate = latest.meta.updatedAt;
    store.update((next) => {
      next.settings.sync.status = "Syncing";
      next.settings.sync.lastStatus = "Auto-syncing latest changes...";
    });
    try {
      const result = await syncHouseholdSnapshot(store.get());
      store.replace({
        ...result.data,
        settings: {
          ...result.data.settings,
          sync: {
            ...store.get().settings.sync,
            status: "Synced",
            lastPushedAt: result.updatedAt,
            lastPulledAt: result.updatedAt,
            lastConflictWarning: result.conflictWarning,
            lastConflictAt: result.conflictWarning ? result.updatedAt : null,
            lastStatus: result.conflictWarning || `Synced just now from ${store.get().settings.sync.deviceName || "this phone"}.`
          }
        }
      });
      lastAutoSyncedUpdate = store.get().meta.updatedAt;
    } catch (error) {
      store.update((next) => {
        next.settings.sync.status = "Sync error";
        next.settings.sync.lastError = error.message;
        next.settings.sync.lastStatus = friendlySyncMessage(error.message);
      });
    } finally {
      autoSyncInFlight = false;
    }
  }, 4500);
}
