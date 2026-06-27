import { el, emptyState, inputField } from "../core/dom.js";
import { currency, formatDate, toMoney, todayIso } from "../core/format.js";

export function renderStreaming(app) {
  const items = app.store.get().modules.streaming.items;
  const total = items.reduce((sum, item) => sum + toMoney(item.monthlyCost), 0);

  return el("section", { className: "view-stack", "aria-labelledby": "streamingTitle" }, [
    el("div", { className: "section-head" }, [
      el("div", {}, [
        el("p", { className: "eyebrow", text: "Money" }),
        el("h1", { id: "streamingTitle", text: "Streaming Services" }),
        el("p", { text: "Track subscriptions, renewal dates and who uses each service without storing passwords." })
      ])
    ]),
    el("div", { className: "warning-card" }, [
      el("strong", { text: "Do not store passwords here." }),
      el("span", { text: "Use a password manager for actual passwords. This tab is only for service details, costs and login usernames." })
    ]),
    el("section", { className: "finance-action-bar", "aria-label": "Streaming actions" }, [
      el("div", {}, [
        el("strong", { text: `${items.length} ${items.length === 1 ? "service" : "services"}` }),
        el("span", { text: `${currency.format(total)} per month` })
      ]),
      el("button", { type: "button", onClick: () => addStreaming(app), text: "Add service" })
    ]),
    el("div", { className: "item-list" }, items.length ? items.map((item) => streamingCard(app, item)) : [emptyState("Add streaming services to track renewal dates and costs.")])
  ]);
}

function streamingCard(app, item) {
  return el("article", { className: "tracker-card", "aria-label": item.serviceName }, [
    el("div", { className: "card-topline compact-card-topline" }, [
      el("div", { className: "compact-card-title" }, [
        el("strong", { text: item.serviceName }),
        el("span", { text: `${currency.format(item.monthlyCost)} monthly - renews ${formatDate(item.renewalDate)}` })
      ]),
      el("button", { type: "button", className: "danger-icon", "aria-label": `Remove ${item.serviceName}`, onClick: () => removeStreaming(app, item.id), text: "X" })
    ]),
    el("details", { className: "card-details" }, [
      el("summary", { text: "Edit subscription details" }),
      el("div", { className: "field-grid" }, [
        inputField("Service name", textInput(item.serviceName, "Service name", (value) => updateStreaming(app, item.id, (next) => (next.serviceName = value || "Streaming service")))),
        inputField("Login email or username", textInput(item.loginEmail, "Login email or username", (value) => updateStreaming(app, item.id, (next) => (next.loginEmail = value))))
      ]),
      el("div", { className: "field-grid" }, [
        inputField("Payer", textInput(item.payer, "Payer", (value) => updateStreaming(app, item.id, (next) => (next.payer = value)))),
        inputField("Monthly cost", moneyInput(item.monthlyCost, (value) => updateStreaming(app, item.id, (next) => (next.monthlyCost = value))))
      ]),
      el("div", { className: "field-grid" }, [
        inputField("Renewal date", dateInput(item.renewalDate, (value) => updateStreaming(app, item.id, (next) => (next.renewalDate = value || todayIso())))),
        inputField("Shared with", textInput(item.sharedWith, "Shared with", (value) => updateStreaming(app, item.id, (next) => (next.sharedWith = value))))
      ]),
      inputField("Link", textInput(item.link, "Link", (value) => updateStreaming(app, item.id, (next) => (next.link = value)))),
      inputField("Notes", el("textarea", {
        rows: "3",
        value: item.notes,
        "aria-label": "Notes",
        onChange: (event) => updateStreaming(app, item.id, (next) => (next.notes = event.target.value)),
        onBlur: (event) => updateStreaming(app, item.id, (next) => (next.notes = event.target.value))
      }))
    ]),
    el("div", { className: "split-line" }, [
      el("strong", { text: item.payer || "Payer not set" }),
      item.link ? el("a", { href: item.link, target: "_blank", rel: "noopener", text: "Open service" }) : el("span", { text: "No link saved" })
    ])
  ]);
}

function addStreaming(app) {
  app.store.update((data) => {
    const now = new Date().toISOString();
    data.modules.streaming.items.push({
      id: crypto.randomUUID(),
      serviceName: "New streaming service",
      loginEmail: "",
      payer: "",
      monthlyCost: 0,
      renewalDate: todayIso(),
      sharedWith: "",
      notes: "",
      link: "",
      createdAt: now,
      updatedAt: now
    });
  });
}

function updateStreaming(app, id, mutator) {
  app.store.update((data) => {
    const item = data.modules.streaming.items.find((service) => service.id === id);
    if (item) {
      mutator(item);
      item.updatedAt = new Date().toISOString();
    }
  });
}

function removeStreaming(app, id) {
  const item = app.store.get().modules.streaming.items.find((service) => service.id === id);
  if (!confirm(`Delete ${item?.serviceName || "this streaming service"}?`)) return;
  app.store.update((data) => {
    data.modules.streaming.items = data.modules.streaming.items.filter((service) => service.id !== id);
  });
}

function textInput(value, label, onInput) {
  return el("input", {
    value,
    "aria-label": label,
    onChange: (event) => onInput(event.target.value),
    onBlur: (event) => onInput(event.target.value)
  });
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

function dateInput(value, onInput) {
  return el("input", {
    type: "date",
    value,
    onChange: (event) => onInput(event.target.value),
    onBlur: (event) => onInput(event.target.value)
  });
}
