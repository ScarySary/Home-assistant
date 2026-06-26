export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(options).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on") && typeof value === "function") node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value);
  });
  children.forEach((child) => node.append(child));
  return node;
}

export function inputField(label, input) {
  return el("label", { className: "field" }, [el("span", { text: label }), input]);
}

export function emptyState(text) {
  return el("div", { className: "empty-state", text });
}

export function progressBar(percent, label) {
  return el("div", { className: "progress-wrap" }, [
    el("div", { className: "progress-meta", text: label }),
    el("div", { className: "progress-track", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": "100", "aria-valuenow": String(Math.round(percent)) }, [
      el("div", { className: "progress-fill", style: `width:${percent}%` })
    ])
  ]);
}
