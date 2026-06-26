import { el, progressBar } from "../core/dom.js";
import { currency } from "../core/format.js";
import { icon } from "../core/icons.js";
import { debtSummary, savingsSummary } from "./calculations.js";

export function renderDashboard(app) {
  const data = app.store.get();
  const debts = debtSummary(data.modules.debts.items);
  const savings = savingsSummary(data.modules.savings.goals);
  const debtPercent = Math.round((debts.totalPaid / Math.max(1, debts.totalOriginal)) * 100);
  const savingsPercent = Math.round((savings.totalSaved / Math.max(1, savings.totalTarget)) * 100);

  return el("section", { className: "home-dashboard compact-home", "aria-labelledby": "dashboardTitle" }, [
    hero(data, app),
    el("section", { className: "home-card-grid", "aria-label": "Home overview" }, [
      todayCard(),
      moneyCard(app, debts, savings, debtPercent, savingsPercent),
      el("div", { className: "glance-section", "aria-label": "Swipeable home previews" }, [
        el("div", { className: "glance-strip", tabindex: "0", "aria-label": "Swipe horizontally for reminders, shopping and chores" }, [
          previewCard("Next Reminders", "No reminders yet", "Bills, chores and calendar reminders will appear here.", "calendar", () => app.navigate("tasks")),
          previewCard("Shopping", "List not started", "Shopping items will appear here.", "shopping", () => app.navigate("food")),
          previewCard("Chores", "No chores due", "Assigned chores will appear here.", "chores", () => app.navigate("tasks"))
        ]),
        el("div", { className: "swipe-dots", "aria-hidden": "true" }, [
          el("span", { className: "active" }),
          el("span", {}),
          el("span", {})
        ])
      ])
    ])
  ]);
}

function hero(data, app) {
  const now = new Date();
  return el("div", { className: "dashboard-hero compact-hero" }, [
    el("div", {}, [
      el("p", { className: "eyebrow", text: "Home" }),
      el("h1", { id: "dashboardTitle", text: `Good ${partOfDay(now)}, ${app.user.name}` }),
      el("p", { className: "hero-copy", text: `${data.household.name} is ready for today.` })
    ])
  ]);
}

function todayCard() {
  const now = new Date();
  return el("article", { className: "home-card today-home-card" }, [
    el("span", { className: "summary-icon" }, [icon("calendar")]),
    el("div", {}, [
      el("p", { className: "eyebrow", text: "Today" }),
      el("h2", { text: now.toLocaleDateString("en-AU", { weekday: "long" }) }),
      el("p", { text: now.toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) })
    ])
  ]);
}

function moneyCard(app, debts, savings, debtPercent, savingsPercent) {
  return el("article", { className: "home-card money-home-card" }, [
    el("div", { className: "card-topline" }, [
      el("span", { className: "summary-icon" }, [icon("money")]),
      el("button", { type: "button", className: "secondary compact", onClick: () => app.navigate("money"), text: "Open" })
    ]),
    el("h2", { text: "Debt and Savings" }),
    el("div", { className: "home-money-grid" }, [
      el("div", { className: "big-number" }, [el("strong", { text: currency.format(debts.totalDebt) }), el("span", { text: "Debt remaining" })]),
      el("div", { className: "big-number" }, [el("strong", { text: currency.format(savings.totalSaved) }), el("span", { text: "Saved" })])
    ]),
    progressBar(debtPercent, `Debt ${debtPercent}% paid off`),
    progressBar(savingsPercent, `Savings ${savingsPercent}% funded`)
  ]);
}

function previewCard(title, value, copy, iconName, onClick) {
  return el("article", { className: "home-card preview-home-card" }, [
    el("div", { className: "card-topline" }, [
      el("span", { className: "summary-icon" }, [icon(iconName)]),
      el("button", { type: "button", className: "secondary compact", onClick, text: "View" })
    ]),
    el("h2", { text: title }),
    el("strong", { text: value }),
    el("p", { text: copy })
  ]);
}

function partOfDay(date) {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}
