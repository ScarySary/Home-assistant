import { el, emptyState, inputField, progressBar } from "../core/dom.js";
import { currency, formatDate, toMoney, todayIso } from "../core/format.js";
import { debtPercent, debtSummary, estimateDebtFreeDate } from "./calculations.js";

export function renderDebts(app) {
  const debts = app.store.get().modules.debts.items;
  const summary = debtSummary(debts);

  return el("section", { className: "view-stack", "aria-labelledby": "debtsTitle" }, [
    header("Debt Tracker", "Manual repayments, instant balances and estimated debt-free dates.", () => addDebt(app)),
    el("section", { className: "metric-grid", "aria-label": "Debt summary" }, [
      metric("Remaining", currency.format(summary.totalDebt)),
      metric("Paid off", currency.format(summary.totalPaid)),
      metric("Debt-free", summary.debtFreeDate)
    ]),
    el("div", { className: "item-list" }, debts.length ? debts.map((debt) => debtCard(app, debt)) : [emptyState("Add your first debt to start tracking progress.")])
  ]);
}

function debtCard(app, debt) {
  const percent = debtPercent(debt);
  const card = el("article", { className: "tracker-card", "aria-label": debt.name });
  const repaymentDate = el("input", { type: "date", value: todayIso() });
  const repaymentAmount = el("input", { type: "number", min: "0", step: "0.01", inputmode: "decimal" });
  const status = el("span", { className: "inline-status", role: "status" });

  card.append(
    el("div", { className: "card-topline" }, [
      editableText(debt.name, "Debt name", (value) => updateDebt(app, debt.id, (item) => (item.name = value || "New debt"))),
      el("button", { type: "button", className: "danger-icon", "aria-label": `Remove ${debt.name}`, onClick: () => removeDebt(app, debt.id), text: "X" })
    ]),
    el("details", { className: "card-details" }, [
      el("summary", { text: "Debt details" }),
      el("div", { className: "field-grid" }, [
        inputField("Original amount", moneyInput(debt.original, (value) => updateDebt(app, debt.id, (item) => (item.original = value)))),
        inputField("Current balance", moneyInput(debt.balance, (value) => updateDebt(app, debt.id, (item) => (item.balance = value))))
      ])
    ]),
    el("div", { className: "field-grid payment-grid" }, [
      inputField("Repayment date", repaymentDate),
      inputField("Repayment amount", repaymentAmount)
    ]),
    el("div", { className: "action-row" }, [
      el("button", {
        type: "button",
        onClick: () => {
          const amount = toMoney(repaymentAmount.value);
          if (!amount) {
            status.textContent = "Enter an amount first.";
            return;
          }
          addRepayment(app, debt.id, repaymentDate.value || todayIso(), amount);
        },
        text: "Add repayment"
      }),
      status
    ]),
    el("div", { className: "split-line" }, [
      el("strong", { text: `${Math.round(percent)}% paid off` }),
      el("span", { text: estimateDebtFreeDate(debt) })
    ]),
    progressBar(percent, `${Math.round(percent)} percent paid off`),
    history(app, debt)
  );

  return card;
}

function history(app, debt) {
  const list = debt.repayments
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((repayment) =>
      el("div", { className: "history-row" }, [
        el("div", { className: "history-edit-grid" }, [
          inputField("Date", el("input", {
            type: "date",
            value: repayment.date,
            "aria-label": `Edit repayment date ${formatDate(repayment.date)}`,
            onChange: (event) => updateRepayment(app, debt.id, repayment.id, (item) => (item.date = event.target.value || todayIso()))
          })),
          inputField("Amount", el("input", {
            type: "number",
            min: "0",
            step: "0.01",
            inputmode: "decimal",
            value: repayment.amount,
            "aria-label": `Edit repayment amount ${currency.format(repayment.amount)}`,
            onChange: (event) => setRepaymentAmount(app, debt.id, repayment.id, toMoney(event.target.value))
          }))
        ]),
        el("button", { type: "button", className: "secondary compact", onClick: () => removeRepayment(app, debt.id, repayment.id), text: "Delete" })
      ])
    );

  return el("details", { className: "history" }, [
    el("summary", { text: "Repayment history" }),
    el("div", { className: "history-list" }, list.length ? list : [emptyState("No repayments added yet.")])
  ]);
}

function addDebt(app) {
  app.store.update((data) => {
    data.modules.debts.items.push({ id: crypto.randomUUID(), name: "New debt", original: 0, balance: 0, repayments: [] });
  });
}

function updateDebt(app, id, mutator) {
  app.store.update((data) => {
    const debt = data.modules.debts.items.find((item) => item.id === id);
    if (debt) mutator(debt);
  });
}

function removeDebt(app, id) {
  const debt = app.store.get().modules.debts.items.find((item) => item.id === id);
  if (!confirm(`Delete ${debt?.name || "this debt"} and its repayment history?`)) return;
  app.store.update((data) => {
    data.modules.debts.items = data.modules.debts.items.filter((debt) => debt.id !== id);
  });
}

function addRepayment(app, id, date, amount) {
  updateDebt(app, id, (debt) => {
    debt.repayments.push({ id: crypto.randomUUID(), date, amount });
    debt.balance = Math.max(0, toMoney(debt.balance - amount));
  });
}

function removeRepayment(app, debtId, repaymentId) {
  if (!confirm("Delete this repayment and add the amount back to the debt balance?")) return;
  updateDebt(app, debtId, (debt) => {
    const repayment = debt.repayments.find((item) => item.id === repaymentId);
    if (!repayment) return;
    debt.balance = toMoney(debt.balance + repayment.amount);
    debt.repayments = debt.repayments.filter((item) => item.id !== repaymentId);
  });
}

function updateRepayment(app, debtId, repaymentId, mutator) {
  updateDebt(app, debtId, (debt) => {
    const repayment = debt.repayments.find((item) => item.id === repaymentId);
    if (repayment) mutator(repayment);
  });
}

function setRepaymentAmount(app, debtId, repaymentId, nextAmount) {
  updateDebt(app, debtId, (debt) => {
    const repayment = debt.repayments.find((item) => item.id === repaymentId);
    if (!repayment) return;
    const difference = toMoney(nextAmount - repayment.amount);
    repayment.amount = nextAmount;
    debt.balance = Math.max(0, toMoney(debt.balance - difference));
  });
}

function header(title, copy, onAdd) {
  return el("div", { className: "section-head" }, [
    el("div", {}, [el("p", { className: "eyebrow", text: "Implemented module" }), el("h1", { id: "debtsTitle", text: title }), el("p", { text: copy })]),
    el("button", { type: "button", onClick: onAdd, text: "Add debt" })
  ]);
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
