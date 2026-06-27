import { localBackups } from "../core/backup.js";
import { el, emptyState, progressBar } from "../core/dom.js";
import { currency, formatDate, todayIso } from "../core/format.js";
import { icon } from "../core/icons.js";
import { syncStatus } from "../core/sync.js";
import { debtPercent, debtSummary, goalPercent, savingsSummary } from "./calculations.js";

export function renderCalendar(app) {
  const data = app.store.get();
  const events = calendarEvents(data);
  const upcoming = events.filter((event) => event.date >= todayIso()).slice(0, 12);

  return el("section", { className: "view-stack", "aria-labelledby": "calendarTitle" }, [
    pageHero("Calendar", "calendarTitle", "Bills, repayments, savings milestones, subscriptions and household reminders in one shared view.", "calendar", "Shared household"),
    upcoming.length
      ? el("div", { className: "timeline-list" }, upcoming.map((event) => eventRow(event)))
      : emptyPanel("Calendar is ready for household events.", "Subscription renewals, debt payments and app reminders will appear here as you add household data.", "calendar"),
    el("section", { className: "module-grid compact-module-grid" }, [
      placeholderMini("Bills", "Bill due dates will appear here when the Bills module is built.", "bills"),
      placeholderMini("Birthdays", "Birthdays and annual reminders will be added here.", "calendar"),
      placeholderMini("Household events", "Appointments, routines and family events will live here.", "household")
    ])
  ]);
}

export function renderAnalytics(app) {
  const data = app.store.get();
  const debts = debtSummary(data.modules.debts.items);
  const savings = savingsSummary(data.modules.savings.goals);
  const streaming = subscriptionSummary(data);
  const debtComplete = Math.round((debts.totalPaid / Math.max(1, debts.totalOriginal)) * 100);
  const savingsComplete = Math.round((savings.totalSaved / Math.max(1, savings.totalTarget)) * 100);

  return el("section", { className: "view-stack", "aria-labelledby": "analyticsTitle" }, [
    pageHero("Analytics", "analyticsTitle", "Simple household progress views for money, subscriptions and future grocery spending.", "analytics", "Beta insight"),
    el("section", { className: "analytics-grid" }, [
      progressPanel("Debt reduction", currency.format(debts.totalPaid), `${debtComplete}% complete`, debtComplete, "debts"),
      progressPanel("Savings growth", currency.format(savings.totalSaved), `${savingsComplete}% funded`, savingsComplete, "savings"),
      metricPanel("Subscription spending", currency.format(streaming.monthly), `${currency.format(streaming.yearly)} per year`, "streaming"),
      metricPanel("Monthly spending", "Not tracked yet", "Budget and grocery spending will appear here.", "money")
    ]),
    el("section", { className: "chart-card panel" }, [
      el("div", { className: "card-topline" }, [
        el("div", {}, [el("p", { className: "eyebrow", text: "Progress chart" }), el("h2", { text: "Household progress" })]),
        el("span", { className: "status-pill", text: "Live" })
      ]),
      barChart([
        ["Debt paid", debtComplete],
        ["Savings", savingsComplete],
        ["Subscriptions reviewed", streaming.count ? 100 : 0],
        ["Backups", localBackups().length ? 100 : 0]
      ])
    ]),
    emptyPanel("Grocery analytics are waiting for shopping data.", "Once shopping and pantry modules are built, grocery spending and pantry completion will appear here.", "shopping")
  ]);
}

export function renderAssistant(app) {
  const data = app.store.get();
  const insights = assistantInsights(data);
  return el("section", { className: "view-stack", "aria-labelledby": "assistantTitle" }, [
    pageHero("Household Assistant", "assistantTitle", "Useful household summaries without adding chat complexity.", "assistant", "Daily briefing"),
    el("section", { className: "insight-list" }, insights.map((item) => insightCard(item))),
    el("section", { className: "module-grid compact-module-grid" }, [
      placeholderMini("Chores", "Chore completion insights will appear when Tasks is built.", "chores"),
      placeholderMini("Shopping", "Shopping and pantry reminders will appear when Food modules are built.", "shopping"),
      placeholderMini("Smart home", "Smart home suggestions will stay planned until the core household tools are stable.", "home")
    ])
  ]);
}

function pageHero(title, titleId, copy, iconName, eyebrow) {
  return el("div", { className: "hub-hero polished-hero" }, [
    el("span", { className: "summary-icon" }, [icon(iconName)]),
    el("div", {}, [
      el("p", { className: "eyebrow", text: eyebrow }),
      el("h1", { id: titleId, text: title }),
      el("p", { text: copy })
    ])
  ]);
}

function eventRow(event) {
  return el("article", { className: "timeline-row" }, [
    el("span", { className: "summary-icon" }, [icon(event.iconName)]),
    el("div", {}, [
      el("strong", { text: event.title }),
      el("span", { text: `${formatDate(event.date)} - ${event.type}` })
    ]),
    el("span", { className: "status-pill", text: event.meta })
  ]);
}

function progressPanel(title, value, label, percent, iconName) {
  return el("article", { className: "panel analytics-card" }, [
    el("div", { className: "card-topline" }, [el("span", { className: "summary-icon" }, [icon(iconName)]), el("span", { className: "status-pill", text: label })]),
    el("h2", { text: title }),
    el("div", { className: "big-number" }, [el("strong", { text: value }), el("span", { text: label })]),
    progressBar(percent, `${title} ${percent}%`)
  ]);
}

function metricPanel(title, value, label, iconName) {
  return el("article", { className: "panel analytics-card" }, [
    el("div", { className: "card-topline" }, [el("span", { className: "summary-icon" }, [icon(iconName)]), el("span", { className: "status-pill", text: "Summary" })]),
    el("h2", { text: title }),
    el("div", { className: "big-number" }, [el("strong", { text: value }), el("span", { text: label })])
  ]);
}

function barChart(items) {
  return el("div", { className: "bar-chart" }, items.map(([label, value]) =>
    el("div", { className: "bar-row" }, [
      el("span", { text: label }),
      el("div", { className: "bar-track" }, [el("div", { className: "bar-fill", style: `width:${Math.max(0, Math.min(100, value))}%` })]),
      el("strong", { text: `${Math.round(value)}%` })
    ])
  ));
}

function insightCard(item) {
  return el("article", { className: `insight-card ${item.priority || ""}` }, [
    el("span", { className: "summary-icon" }, [icon(item.iconName)]),
    el("div", {}, [el("strong", { text: item.title }), el("p", { text: item.copy })])
  ]);
}

function placeholderMini(title, copy, iconName) {
  return el("article", { className: "module-placeholder-card mini-placeholder" }, [
    el("span", { className: "summary-icon" }, [icon(iconName)]),
    el("h2", { text: title }),
    el("p", { text: copy }),
    el("span", { className: "status-pill", text: "Planned" })
  ]);
}

function emptyPanel(title, copy, iconName) {
  return el("article", { className: "panel empty-panel" }, [
    el("span", { className: "summary-icon" }, [icon(iconName)]),
    el("h2", { text: title }),
    el("p", { text: copy })
  ]);
}

function calendarEvents(data) {
  const events = [];
  data.modules.debts.items.forEach((debt) => {
    debt.repayments.slice(-2).forEach((repayment) => events.push({
      title: `${debt.name} repayment`,
      date: repayment.date,
      type: "Debt payment",
      meta: currency.format(repayment.amount),
      iconName: "debts"
    }));
  });
  data.modules.savings.goals.forEach((goal) => {
    if (goal.target && goal.saved >= goal.target) {
      events.push({ title: `${goal.name} completed`, date: goal.updatedAt?.slice(0, 10) || todayIso(), type: "Savings milestone", meta: "Complete", iconName: "savings" });
    }
  });
  (data.modules.streaming?.items || []).forEach((service) => events.push({
    title: `${service.serviceName} renewal`,
    date: service.renewalDate || todayIso(),
    type: "Subscription renewal",
    meta: currency.format(service.monthlyCost),
    iconName: "streaming"
  }));
  events.push({ title: "Backup check", date: todayIso(), type: "App reminder", meta: "Today", iconName: "backup" });
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function subscriptionSummary(data) {
  const items = data.modules.streaming?.items || [];
  const monthly = items.reduce((sum, item) => sum + (Number(item.monthlyCost) || 0), 0);
  return { count: items.length, monthly, yearly: monthly * 12 };
}

function assistantInsights(data) {
  const debts = debtSummary(data.modules.debts.items);
  const savings = savingsSummary(data.modules.savings.goals);
  const streaming = subscriptionSummary(data);
  const backups = localBackups();
  const renewals = (data.modules.streaming?.items || []).filter((item) => daysUntil(item.renewalDate) <= 7 && daysUntil(item.renewalDate) >= 0);
  const debtPercentComplete = Math.round((debts.totalPaid / Math.max(1, debts.totalOriginal)) * 100);
  return [
    {
      title: renewals.length ? `${renewals.length} subscription renewal${renewals.length === 1 ? "" : "s"} this week.` : "No subscription renewals due this week.",
      copy: renewals.length ? "Open Streaming Services to review upcoming payments." : "Streaming renewals look calm for the next few days.",
      iconName: "streaming",
      priority: renewals.length ? "attention" : "good"
    },
    {
      title: backups.length ? "A local restore point is available." : "You have not created a local restore point yet.",
      copy: backups.length ? `Latest restore point: ${new Date(backups[0].createdAt).toLocaleString("en-AU")}.` : "Run Sync now or export a backup before major changes.",
      iconName: "backup",
      priority: backups.length ? "good" : "attention"
    },
    {
      title: `Debt progress is ${debtPercentComplete}% complete.`,
      copy: `${currency.format(debts.totalDebt)} remains across tracked debts.`,
      iconName: "debts"
    },
    {
      title: `${currency.format(savings.totalSaved)} saved toward household goals.`,
      copy: savings.totalTarget ? `${currency.format(Math.max(0, savings.totalTarget - savings.totalSaved))} left to reach all current goals.` : "Add a savings target to unlock more insights.",
      iconName: "savings"
    },
    {
      title: `Sync is ${syncStatus(data.settings).toLowerCase()}.`,
      copy: data.settings.sync.lastManualSyncAt ? `Last manual sync: ${new Date(data.settings.sync.lastManualSyncAt).toLocaleString("en-AU")}.` : "Run a manual sync after setup changes.",
      iconName: "settings"
    },
    {
      title: streaming.count ? `${currency.format(streaming.monthly)} per month in subscriptions.` : "No streaming subscriptions tracked yet.",
      copy: streaming.count ? `${currency.format(streaming.yearly)} estimated per year.` : "Add services without storing passwords.",
      iconName: "streaming"
    }
  ];
}

function daysUntil(dateString) {
  if (!dateString) return 999;
  const today = new Date(`${todayIso()}T00:00:00`);
  const target = new Date(`${dateString}T00:00:00`);
  return Math.ceil((target - today) / 86400000);
}
