import { addMonths, formatMonth, monthsBetween } from "../core/format.js";

export function debtSummary(debts) {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalOriginal = debts.reduce((sum, debt) => sum + Math.max(debt.original, debt.balance), 0);
  const totalPaid = Math.max(0, totalOriginal - totalDebt);
  return { totalDebt, totalOriginal, totalPaid, debtFreeDate: estimateAllDebtsDebtFreeDate(debts, totalDebt) };
}

export function savingsSummary(goals) {
  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
  return { totalSaved, totalTarget };
}

export function debtPercent(debt) {
  const original = Math.max(debt.original, debt.balance);
  if (!original) return 0;
  return Math.min(100, Math.max(0, ((original - debt.balance) / original) * 100));
}

export function goalPercent(goal) {
  if (!goal.target) return 0;
  return Math.min(100, Math.max(0, (goal.saved / goal.target) * 100));
}

export function estimateDebtFreeDate(debt) {
  const monthlyAverage = averageMonthlyRepayment(debt.repayments);
  if (!debt.balance) return "Paid off";
  if (!monthlyAverage) return "Add repayments";
  return `Debt-free ${formatMonth(addMonths(new Date(), Math.ceil(debt.balance / monthlyAverage)))}`;
}

function estimateAllDebtsDebtFreeDate(debts, totalDebt) {
  const monthlyAverage = debts.reduce((sum, debt) => sum + averageMonthlyRepayment(debt.repayments), 0);
  if (!totalDebt) return "All paid off";
  if (!monthlyAverage) return "Add repayments";
  return formatMonth(addMonths(new Date(), Math.ceil(totalDebt / monthlyAverage)));
}

function averageMonthlyRepayment(repayments) {
  if (!repayments.length) return 0;
  const total = repayments.reduce((sum, repayment) => sum + repayment.amount, 0);
  const dates = repayments.map((repayment) => new Date(repayment.date)).filter((date) => !Number.isNaN(date.valueOf()));
  if (dates.length < 2) return total;
  const first = new Date(Math.min(...dates));
  const last = new Date(Math.max(...dates));
  return total / Math.max(1, monthsBetween(first, last) + 1);
}
