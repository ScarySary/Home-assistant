export const APP_VERSION = "1.0.0-alpha.11";
export const APP_BUILD_DATE = "2026-06-27";
export const APP_RELEASE_CHANNEL = "alpha";
export const DATA_KEY = "householdAssistant.userData.v1";
export const LEGACY_DEBT_KEY = "auDebtSavingsTracker.v1";
export const SESSION_KEY = "householdAssistant.session.v1";

export const roles = ["Administrator", "Adult", "Teen", "Child"];

export const moduleCatalog = [
  { id: "dashboard", name: "Dashboard", status: "active", phase: 2, summary: "Your household overview and future command centre." },
  { id: "debts", name: "Debt Tracker", status: "active", phase: 3, group: "Finances", summary: "Balances, repayments and debt-free estimates." },
  { id: "savings", name: "Savings Goals", status: "active", phase: 3, group: "Finances", summary: "Goals, progress and balances." },
  { id: "streaming", name: "Streaming Services", status: "active", phase: 3, group: "Finances", summary: "Subscriptions, renewal dates and shared access notes without storing passwords." },
  { id: "budget", name: "Budget", status: "planned", phase: 3, group: "Finances", summary: "Income, expenses and household categories." },
  { id: "bills", name: "Bills", status: "planned", phase: 3, group: "Finances", summary: "Upcoming bills, due dates and payment reminders." },
  { id: "shopping", name: "Shopping List", status: "planned", phase: 4, summary: "Shared groceries, household supplies and role-based permissions." },
  { id: "calendar", name: "Calendar", status: "planned", phase: 5, summary: "Shared events, reminders and routines." },
  { id: "chores", name: "Chores", status: "planned", phase: 6, summary: "Assigned tasks, rotations and personal dashboards." },
  { id: "meals", name: "Meal Planning", status: "planned", phase: 7, summary: "Weekly meals connected to shopping and inventory." },
  { id: "pantry", name: "Pantry Inventory", status: "planned", phase: 8, summary: "Shelf-stable items, stock levels and low-stock planning." },
  { id: "fridge", name: "Fridge Inventory", status: "planned", phase: 8, summary: "Fresh food tracking and use-by dates." },
  { id: "notifications", name: "Notifications", status: "planned", phase: 9, summary: "Reminders for bills, chores, shopping and routines." },
  { id: "smart-home", name: "Smart Home", status: "planned", phase: 10, summary: "Future device and automation controls." },
  { id: "rewards", name: "Family Rewards", status: "planned", phase: 10, summary: "Points, goals and family motivation." },
  { id: "ai-assistant", name: "AI Household Assistant", status: "planned", phase: 11, summary: "A future helper that connects household context across modules." },
  { id: "settings", name: "Settings", status: "active", phase: 1, summary: "Household users, access, accessibility and data controls." }
];

export const developmentOrder = [
  "Stable installable application",
  "Dashboard",
  "Finances",
  "Shopping",
  "Calendar",
  "Chores",
  "Meal planning",
  "Pantry and fridge inventory",
  "Notifications",
  "Smart home",
  "AI assistant"
];
