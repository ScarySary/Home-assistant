import { el, emptyState, inputField, progressBar } from "../core/dom.js";
import { currency, toMoney } from "../core/format.js";
import { goalPercent, savingsSummary } from "./calculations.js";

export function renderSavings(app) {
  const goals = app.store.get().modules.savings.goals;
  const summary = savingsSummary(goals);

  return el("section", { className: "view-stack", "aria-labelledby": "savingsTitle" }, [
    el("div", { className: "section-head" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Implemented module" }),
        el("h1", { id: "savingsTitle", text: "Savings Goals" }),
        el("p", { text: "Track goal balances alongside debt so the whole household picture stays visible." })
      ])
    ]),
    el("section", { className: "metric-grid", "aria-label": "Savings summary" }, [
      metric("Saved", currency.format(summary.totalSaved)),
      metric("Target", currency.format(summary.totalTarget)),
      metric("Still planned", currency.format(Math.max(0, summary.totalTarget - summary.totalSaved)))
    ]),
    el("section", { className: "finance-action-bar", "aria-label": "Savings actions" }, [
      el("div", {}, [
        el("strong", { text: `${goals.length} ${goals.length === 1 ? "goal" : "goals"}` }),
        el("span", { text: `${currency.format(summary.totalSaved)} saved` })
      ]),
      el("button", { type: "button", onClick: () => addGoal(app), text: "Add goal" })
    ]),
    el("div", { className: "item-list" }, goals.length ? goals.map((goal) => goalCard(app, goal)) : [emptyState("Add a savings goal to track progress beside your debts.")])
  ]);
}

function goalCard(app, goal) {
  const percent = goalPercent(goal);
  const addAmount = el("input", { type: "number", min: "0", step: "0.01", inputmode: "decimal" });
  const status = el("span", { className: "inline-status", role: "status" });

  return el("article", { className: "tracker-card", "aria-label": goal.name }, [
    el("div", { className: "card-topline compact-card-topline" }, [
      el("div", { className: "compact-card-title" }, [
        el("strong", { text: goal.name }),
        el("span", { text: `${currency.format(goal.saved)} of ${currency.format(goal.target)} - ${Math.round(percent)}% saved` })
      ]),
      el("button", { type: "button", className: "danger-icon", "aria-label": `Remove ${goal.name}`, onClick: () => removeGoal(app, goal.id), text: "X" })
    ]),
    progressBar(percent, `${Math.round(percent)} percent saved`),
    el("details", { className: "card-details" }, [
      el("summary", { text: "Edit and add savings" }),
      inputField("Savings goal name", editableText(goal.name, "Savings goal name", (value) => updateGoal(app, goal.id, (item) => (item.name = value || "New savings goal")))),
      el("div", { className: "field-grid" }, [
        inputField("Target amount", moneyInput(goal.target, (value) => updateGoal(app, goal.id, (item) => (item.target = value)))),
        inputField("Saved so far", moneyInput(goal.saved, (value) => updateGoal(app, goal.id, (item) => (item.saved = value))))
      ]),
      el("div", { className: "field-grid payment-grid" }, [
        inputField("Add savings", addAmount),
        el("div", { className: "field action-field" }, [
          el("span", { text: "Action" }),
          el("button", {
            type: "button",
            onClick: () => {
              const amount = toMoney(addAmount.value);
              if (!amount) {
                status.textContent = "Enter an amount first.";
                return;
              }
              updateGoal(app, goal.id, (item) => (item.saved = toMoney(item.saved + amount)));
            },
            text: "Add to goal"
          })
        ])
      ]),
      status
    ]),
    el("div", { className: "split-line" }, [
      el("strong", { text: `${Math.round(percent)}% saved` }),
      el("span", { text: `${currency.format(Math.max(0, goal.target - goal.saved))} to go` })
    ])
  ]);
}

function addGoal(app) {
  app.store.update((data) => {
    data.modules.savings.goals.push({ id: crypto.randomUUID(), name: "New savings goal", target: 0, saved: 0 });
  });
}

function updateGoal(app, id, mutator) {
  app.store.update((data) => {
    const goal = data.modules.savings.goals.find((item) => item.id === id);
    if (goal) mutator(goal);
  });
}

function removeGoal(app, id) {
  const goal = app.store.get().modules.savings.goals.find((item) => item.id === id);
  if (!confirm(`Delete ${goal?.name || "this savings goal"}?`)) return;
  app.store.update((data) => {
    data.modules.savings.goals = data.modules.savings.goals.filter((goal) => goal.id !== id);
  });
}

function metric(label, value) {
  return el("article", { className: "metric-card" }, [el("span", { text: label }), el("strong", { text: value })]);
}

function moneyInput(value, onInput) {
  return el("input", {
    type: "number",
    min: "0",
    step: "0.01",
    inputmode: "decimal",
    value,
    onChange: (event) => onInput(toMoney(event.target.value)),
    onBlur: (event) => onInput(toMoney(event.target.value))
  });
}

function editableText(value, label, onInput) {
  return el("input", {
    className: "name-input",
    "aria-label": label,
    value,
    onChange: (event) => onInput(event.target.value),
    onBlur: (event) => onInput(event.target.value)
  });
}
