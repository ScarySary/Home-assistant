export const todayIso = () => new Date().toISOString().slice(0, 10);

export const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0
});

export function toMoney(value) {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatMonth(date) {
  return date.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

export function addMonths(date, months) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
}

export function monthsBetween(first, last) {
  return (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth();
}
