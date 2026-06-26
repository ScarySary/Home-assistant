const paths = {
  home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"/>',
  debts: '<path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-2-1.35V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6"/><path d="M9 12h6"/><path d="M9 16h4"/>',
  savings: '<path d="M5 11a7 7 0 0 1 7-7h3a4 4 0 0 1 4 4v2h1a2 2 0 0 1 0 4h-1a7 7 0 0 1-7 6H8v-3.5A6.98 6.98 0 0 1 5 11Z"/><path d="M10 8h.01"/><path d="M15 4l2-2"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V20h-3v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 5.08 15a1.7 1.7 0 0 0-1.55-1H3.4v-3h.13a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34h.01a1.7 1.7 0 0 0 1-1.55V4h3v.09a1.7 1.7 0 0 0 1 1.55h.01a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 18.92 10a1.7 1.7 0 0 0 1.55 1h.13v3h-.13a1.7 1.7 0 0 0-1.07 1Z"/>',
  money: '<path d="M12 3v18"/><path d="M17 7.5A4 4 0 0 0 12 6c-2.2 0-4 1.1-4 2.8s1.8 2.5 4 3.2 4 1.5 4 3.2S14.2 18 12 18a5 5 0 0 1-5-2.5"/>',
  tasks: '<path d="m9 11 2 2 4-5"/><path d="M4 6h2"/><path d="M4 12h2"/><path d="M4 18h2"/><path d="M8 6h12"/><path d="M8 12h12"/><path d="M8 18h12"/>',
  food: '<path d="M4 10h16"/><path d="M6 10l1.2 9h9.6L18 10"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M9 14h6"/>',
  search: '<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="m21 21-4.35-4.35"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  calendar: '<path d="M7 3v4"/><path d="M17 3v4"/><path d="M4 8h16"/><path d="M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>',
  chores: '<path d="m9 11 2 2 4-5"/><path d="M5 5h14v14H5z"/>',
  shopping: '<path d="M6 8h15l-2 8H8L6 4H3"/><path d="M9 20h.01"/><path d="M18 20h.01"/>',
  bills: '<path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z"/><path d="M9 8h6"/><path d="M9 12h6"/>',
  meals: '<path d="M6 3v18"/><path d="M10 3v7a4 4 0 0 1-8 0V3"/><path d="M16 3v18"/><path d="M16 3a5 5 0 0 1 5 5v4h-5"/>',
  weather: '<path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.65 1.8A3.5 3.5 0 0 0 7 18Z"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>'
};

export function icon(name, label = "") {
  const span = document.createElement("span");
  span.className = "app-icon";
  if (label) span.setAttribute("aria-label", label);
  else span.setAttribute("aria-hidden", "true");
  span.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${paths[name] || paths.list}</svg>`;
  return span;
}
