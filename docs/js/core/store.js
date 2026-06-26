import { DATA_KEY, LEGACY_DEBT_KEY } from "./constants.js";
import { todayIso, toMoney } from "./format.js";

export function createStore() {
  let data = loadData();
  const listeners = new Set();

  function get() {
    return data;
  }

  function update(mutator) {
    mutator(data);
    data.meta.updatedAt = new Date().toISOString();
    saveData(data);
    listeners.forEach((listener) => listener(data));
  }

  function replace(nextData) {
    data = normalizeData(nextData);
    saveData(data);
    listeners.forEach((listener) => listener(data));
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { get, update, replace, subscribe };
}

export function hasHouseholdData() {
  return Boolean(localStorage.getItem(DATA_KEY));
}

export function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function loadData() {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) {
    try {
      return normalizeData(JSON.parse(saved));
    } catch {
      return createDefaultData();
    }
  }

  const legacy = loadLegacyDebtData();
  const fresh = createDefaultData();
  if (legacy) {
    fresh.modules.debts.items = legacy.debts;
    fresh.modules.savings.goals = legacy.goals;
    fresh.settings.theme = legacy.theme;
  }
  return fresh;
}

export function createDefaultData() {
  return {
    version: 1,
    meta: {
      appName: "Household Assistant",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    household: {
      id: crypto.randomUUID(),
      name: "Our Household",
      country: "Australia"
    },
    settings: {
      theme: "light",
      highContrast: true,
      textScale: "comfortable",
      dashboard: defaultDashboardSettings(),
      updates: {
        installableAppReady: true,
        userDataStoredSeparately: true,
        pending: false,
        lastStatus: "Not checked yet.",
        checkedAt: null
      },
      notifications: {
        enabled: false,
        permission: "default",
        bills: true,
        chores: true,
        calendar: true,
        shopping: true,
        lastStatus: "Notifications are not configured yet."
      }
    },
    users: [],
    modules: {
      debts: { items: sampleDebts() },
      savings: { goals: sampleGoals() }
    }
  };
}

export function normalizeData(raw) {
  const base = createDefaultData();
  return {
    ...base,
    ...raw,
    meta: { ...base.meta, ...(raw.meta || {}) },
    household: { ...base.household, ...(raw.household || {}) },
    settings: normalizeSettings(base.settings, raw.settings || {}),
    users: Array.isArray(raw.users) ? raw.users : [],
    modules: {
      debts: { items: Array.isArray(raw.modules?.debts?.items) ? raw.modules.debts.items.map(normalizeDebt) : [] },
      savings: { goals: Array.isArray(raw.modules?.savings?.goals) ? raw.modules.savings.goals.map(normalizeGoal) : [] }
    }
  };
}

function normalizeSettings(baseSettings, rawSettings) {
  return {
    ...baseSettings,
    ...rawSettings,
    dashboard: normalizeDashboardSettings(rawSettings.dashboard, baseSettings.dashboard),
    updates: { ...baseSettings.updates, ...(rawSettings.updates || {}) },
    notifications: { ...baseSettings.notifications, ...(rawSettings.notifications || {}) }
  };
}

function normalizeDashboardSettings(rawDashboard, defaultDashboard) {
  const rawWidgets = Array.isArray(rawDashboard?.widgets) ? rawDashboard.widgets : [];
  const widgetsById = new Map(rawWidgets.map((widget) => [widget.id, widget]));
  return {
    widgets: defaultDashboard.widgets.map((widget) => ({
      ...widget,
      ...(widgetsById.get(widget.id) || {}),
      id: widget.id,
      title: widget.title
    }))
  };
}

function loadLegacyDebtData() {
  const saved = localStorage.getItem(LEGACY_DEBT_KEY);
  if (!saved) return null;
  try {
    const legacy = JSON.parse(saved);
    return {
      theme: legacy.theme === "dark" ? "dark" : "light",
      debts: Array.isArray(legacy.debts) ? legacy.debts.map(normalizeDebt) : [],
      goals: Array.isArray(legacy.goals) ? legacy.goals.map(normalizeGoal) : []
    };
  } catch {
    return null;
  }
}

function normalizeDebt(debt) {
  return {
    id: debt.id || crypto.randomUUID(),
    name: debt.name || "New debt",
    original: toMoney(debt.original),
    balance: toMoney(debt.balance),
    repayments: Array.isArray(debt.repayments)
      ? debt.repayments.map((repayment) => ({
          id: repayment.id || crypto.randomUUID(),
          date: repayment.date || todayIso(),
          amount: toMoney(repayment.amount)
        }))
      : []
  };
}

function normalizeGoal(goal) {
  return {
    id: goal.id || crypto.randomUUID(),
    name: goal.name || "New savings goal",
    target: toMoney(goal.target),
    saved: toMoney(goal.saved)
  };
}

function sampleDebts() {
  return [
    {
      id: crypto.randomUUID(),
      name: "Credit card",
      original: 6200,
      balance: 4100,
      repayments: [
        { id: crypto.randomUUID(), date: "2026-05-15", amount: 350 },
        { id: crypto.randomUUID(), date: "2026-06-15", amount: 350 }
      ]
    },
    {
      id: crypto.randomUUID(),
      name: "Car loan",
      original: 18500,
      balance: 14250,
      repayments: [
        { id: crypto.randomUUID(), date: "2026-05-01", amount: 620 },
        { id: crypto.randomUUID(), date: "2026-06-01", amount: 620 }
      ]
    }
  ];
}

function sampleGoals() {
  return [
    { id: crypto.randomUUID(), name: "Emergency fund", target: 10000, saved: 2750 },
    { id: crypto.randomUUID(), name: "Holiday", target: 4500, saved: 900 }
  ];
}

function defaultDashboardSettings() {
  return {
    widgets: [
      { id: "quick-actions", title: "Quick Actions", visible: true, size: "wide" },
      { id: "today-schedule", title: "Today's Schedule", visible: true, size: "medium" },
      { id: "chores-due", title: "Chores Due", visible: true, size: "medium" },
      { id: "shopping-list", title: "Shopping List", visible: true, size: "medium" },
      { id: "upcoming-bills", title: "Upcoming Bills", visible: true, size: "medium" },
      { id: "debt-progress", title: "Debt Progress", visible: true, size: "wide" },
      { id: "savings-goals", title: "Savings Goals", visible: true, size: "wide" },
      { id: "calendar-events", title: "Calendar Events", visible: true, size: "medium" },
      { id: "meal-plan", title: "Meal Plan", visible: true, size: "medium" },
      { id: "weather", title: "Weather", visible: true, size: "small" },
      { id: "build-order", title: "Build Order", visible: true, size: "wide" }
    ]
  };
}
