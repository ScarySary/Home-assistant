import { el, progressBar } from "../core/dom.js";
import { currency } from "../core/format.js";
import { icon } from "../core/icons.js";
import { debtSummary, savingsSummary } from "./calculations.js";

export function renderMoney(app) {
  const data = app.store.get();
  const debts = debtSummary(data.modules.debts.items);
  const savings = savingsSummary(data.modules.savings.goals);
  const debtPercent = Math.round((debts.totalPaid / Math.max(1, debts.totalOriginal)) * 100);
  const savingsPercent = Math.round((savings.totalSaved / Math.max(1, savings.totalTarget)) * 100);

  return hub("Money", "Debts, savings, budget and bills in one place.", "money", [
    actionCard("Debt Tracker", "Manage balances, repayments and debt-free estimates.", currency.format(debts.totalDebt), "Remaining", "debts", () => app.navigate("debts"), progressBar(debtPercent, "Debt progress")),
    actionCard("Savings Goals", "Track savings progress beside your debt plan.", currency.format(savings.totalSaved), "Saved", "savings", () => app.navigate("savings"), progressBar(savingsPercent, "Savings progress")),
    actionCard("Streaming Services", "Track subscriptions, renewal dates and shared login usernames without saving passwords.", `${data.modules.streaming?.items?.length || 0}`, "Services", "bills", () => app.navigate("streaming")),
    placeholderCard("Budget", "Income, expenses and categories will live here.", "bills"),
    placeholderCard("Bills", "Due dates and payment reminders will live here.", "bills")
  ]);
}

export function renderTasks() {
  return hub("Tasks", "Chores, calendar and reminders for the household.", "tasks", [
    placeholderCard("Chores", "Assigned chores, due times and overdue items will appear here.", "chores"),
    placeholderCard("Calendar", "Shared events, appointments and routines will appear here.", "calendar"),
    placeholderCard("Reminders", "Notifications for chores, bills and routines will appear here.", "calendar")
  ]);
}

export function renderFood() {
  return hub("Food", "Shopping, pantry, fridge and meal planning.", "food", [
    placeholderCard("Shopping List", "Shared grocery and household items will appear here.", "shopping"),
    placeholderCard("Pantry", "Shelf-stable inventory and low stock will appear here.", "shopping"),
    placeholderCard("Fridge", "Fresh food and use-by dates will appear here.", "shopping"),
    placeholderCard("Meal Planning", "Weekly meal plans linked to shopping will appear here.", "meals")
  ]);
}

function hub(title, copy, iconName, cards) {
  return el("section", { className: "hub-screen view-stack", "aria-labelledby": `${title.toLowerCase()}Title` }, [
    el("div", { className: "hub-hero" }, [
      el("span", { className: "summary-icon" }, [icon(iconName)]),
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Main tab" }),
        el("h1", { id: `${title.toLowerCase()}Title`, text: title }),
        el("p", { text: copy })
      ])
    ]),
    el("div", { className: "hub-card-grid" }, cards)
  ]);
}

function actionCard(title, copy, value, label, iconName, onClick, extra) {
  const children = [
    el("div", { className: "card-topline" }, [
      el("span", { className: "summary-icon" }, [icon(iconName)]),
      el("button", { type: "button", className: "secondary compact", onClick, text: "Open" })
    ]),
    el("h2", { text: title }),
    el("p", { text: copy }),
    el("div", { className: "big-number" }, [el("strong", { text: value }), el("span", { text: label })])
  ];
  if (extra) children.push(extra);
  return el("article", { className: "hub-card" }, children);
}

function placeholderCard(title, copy, iconName) {
  return el("article", { className: "hub-card placeholder-hub-card" }, [
    el("span", { className: "summary-icon" }, [icon(iconName)]),
    el("h2", { text: title }),
    el("p", { text: copy }),
    el("span", { className: "status-pill", text: "Planned" })
  ]);
}
