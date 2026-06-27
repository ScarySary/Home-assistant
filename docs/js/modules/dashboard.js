import { localBackups } from "../core/backup.js";
import { el, progressBar } from "../core/dom.js";
import { currency } from "../core/format.js";
import { icon } from "../core/icons.js";
import { syncStatus } from "../core/sync.js";
import { debtSummary, savingsSummary } from "./calculations.js";

export function renderDashboard(app) {
  const data = app.store.get();
  const debts = debtSummary(data.modules.debts.items);
  const savings = savingsSummary(data.modules.savings.goals);
  const subscriptions = subscriptionSummary(data);
  const debtPercent = Math.round((debts.totalPaid / Math.max(1, debts.totalOriginal)) * 100);
  const savingsPercent = Math.round((savings.totalSaved / Math.max(1, savings.totalTarget)) * 100);

  return el("section", { className: "home-dashboard compact-home", "aria-labelledby": "dashboardTitle" }, [
    hero(data, app),
    el("section", { className: "dashboard-summary-grid", "aria-label": "Household dashboard" }, [
      moneyCard(app, debts, savings, debtPercent, savingsPercent),
      subscriptionCard(app, subscriptions),
      householdCard(app),
      syncCard(app, data)
    ]),
    el("section", { className: "glance-section", "aria-label": "Household previews" }, [
      el("div", { className: "glance-strip", tabindex: "0", "aria-label": "Swipe horizontally for shopping, pantry and reminders" }, [
        previewCard("Shopping", "Not started", "Shopping lists will appear here when the Food module is built.", "shopping", () => app.navigate("food")),
        previewCard("Pantry", "Ready later", "Pantry and fridge summaries will connect to meal planning later.", "pantry", () => app.navigate("food")),
        previewCard("Today", "No chores due", "Chores and reminders will appear here when Tasks is built.", "chores", () => app.navigate("tasks")),
        previewCard("Assistant", "Daily insights", "Helpful summaries are ready on the Assistant page.", "assistant", () => app.navigate("assistant"))
      ]),
      el("div", { className: "swipe-dots", "aria-hidden": "true" }, [el("span", { className: "active" }), el("span", {}), el("span", {})])
    ])
  ]);
}

function hero(data, app) {
  const now = new Date();
  return el("div", { className: "dashboard-hero compact-hero" }, [
    el("div", {}, [
      el("p", { className: "eyebrow", text: now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }) }),
      el("h1", { id: "dashboardTitle", text: `Good ${partOfDay(now)}, ${app.user.name}` }),
      el("p", { className: "hero-copy", text: `${data.household.name} is ready for today.` })
    ])
  ]);
}

function moneyCard(app, debts, savings, debtPercent, savingsPercent) {
  return el("article", { className: "home-card dashboard-feature-card" }, [
    cardTop("Money", "money", () => app.navigate("money")),
    el("div", { className: "home-money-grid" }, [
      bigNumber(currency.format(debts.totalDebt), "Debt remaining"),
      bigNumber(currency.format(debts.totalPaid), "Debt paid"),
      bigNumber(`${debtPercent}%`, "Debt complete"),
      bigNumber(currency.format(savings.totalSaved), "Saved")
    ]),
    progressBar(debtPercent, `Debt payoff ${debtPercent}% complete`),
    progressBar(savingsPercent, `Savings goals ${savingsPercent}% funded`)
  ]);
}

function subscriptionCard(app, subscriptions) {
  return el("article", { className: "home-card" }, [
    cardTop("Subscriptions", "streaming", () => app.navigate("streaming")),
    el("div", { className: "home-money-grid" }, [
      bigNumber(currency.format(subscriptions.monthly), "Monthly"),
      bigNumber(currency.format(subscriptions.yearly), "Yearly")
    ]),
    subscriptions.next
      ? el("p", { text: `${subscriptions.next.serviceName} renews ${new Date(`${subscriptions.next.renewalDate}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}.` })
      : el("p", { text: "Add streaming services to track renewal dates and totals." })
  ]);
}

function householdCard(app) {
  return el("article", { className: "home-card" }, [
    cardTop("Household", "household", () => app.navigate("assistant")),
    el("div", { className: "mini-list" }, [
      miniLine("Chores", "No chores due yet", "chores"),
      miniLine("Reminders", "Calendar reminders are ready to build", "calendar"),
      miniLine("Activity", "Sync and backup activity appears in Settings", "notifications")
    ])
  ]);
}

function syncCard(app, data) {
  const status = syncStatus(data.settings);
  const sync = data.settings.sync;
  const lastSynced = sync.lastManualSyncAt || sync.lastPulledAt || sync.lastPushedAt;
  const backups = localBackups();
  return el("article", { className: "home-card" }, [
    cardTop("Sync and Backup", "backup", () => app.navigate("settings")),
    el("div", { className: "home-money-grid" }, [
      bigNumber(status, "Sync status"),
      bigNumber(backups.length ? `${backups.length}` : "0", "Restore points")
    ]),
    el("p", { text: lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString("en-AU")}` : "Run Sync now after setup changes." })
  ]);
}

function previewCard(title, value, copy, iconName, onClick) {
  return el("article", { className: "home-card preview-home-card" }, [
    cardTop(title, iconName, onClick, "View"),
    el("strong", { text: value }),
    el("p", { text: copy })
  ]);
}

function cardTop(title, iconName, onClick, buttonText = "Open") {
  return el("div", { className: "card-topline" }, [
    el("div", { className: "icon-title" }, [el("span", { className: "summary-icon" }, [icon(iconName)]), el("h2", { text: title })]),
    el("button", { type: "button", className: "secondary compact", onClick, text: buttonText })
  ]);
}

function bigNumber(value, label) {
  return el("div", { className: "big-number" }, [el("strong", { text: value }), el("span", { text: label })]);
}

function miniLine(label, value, iconName) {
  return el("div", { className: "mini-line" }, [
    el("span", { className: "summary-icon" }, [icon(iconName)]),
    el("div", {}, [el("strong", { text: label }), el("span", { text: value })])
  ]);
}

function subscriptionSummary(data) {
  const items = data.modules.streaming?.items || [];
  const monthly = items.reduce((sum, item) => sum + (Number(item.monthlyCost) || 0), 0);
  const upcoming = items
    .filter((item) => item.renewalDate)
    .slice()
    .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
  return { monthly, yearly: monthly * 12, next: upcoming[0] || null };
}

function partOfDay(date) {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
