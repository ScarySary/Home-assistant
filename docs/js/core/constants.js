export const APP_VERSION = "1.0.0-alpha.14";
export const APP_BUILD_DATE = "2026-06-27";
export const APP_RELEASE_CHANNEL = "alpha";
export const DATA_KEY = "householdAssistant.userData.v1";
export const LEGACY_DEBT_KEY = "auDebtSavingsTracker.v1";
export const SESSION_KEY = "householdAssistant.session.v1";

export const roles = ["Administrator", "Adult", "Teen", "Child"];

export const moduleCatalog = [
  { id: "dashboard", name: "Dashboard", icon: "home", status: "active", phase: 2, summary: "Your household overview and future command centre." },
  { id: "money", name: "Money", icon: "money", status: "active", phase: 3, summary: "Debts, savings, subscriptions, budget and bills." },
  { id: "debts", name: "Debt Tracker", icon: "debts", status: "active", phase: 3, group: "Money", summary: "Balances, repayments and debt-free estimates." },
  { id: "savings", name: "Savings Goals", icon: "savings", status: "active", phase: 3, group: "Money", summary: "Goals, progress and balances." },
  { id: "streaming", name: "Streaming Services", icon: "streaming", status: "active", phase: 3, group: "Money", summary: "Subscriptions, renewal dates and shared access notes without storing passwords." },
  { id: "calendar", name: "Calendar", icon: "calendar", status: "active", phase: 5, summary: "Shared events, reminders, bills, milestones and renewals." },
  { id: "analytics", name: "Analytics", icon: "analytics", status: "active", phase: 3, summary: "Household progress charts and spending summaries." },
  { id: "assistant", name: "Assistant", icon: "assistant", status: "active", phase: 11, summary: "Useful household insights without chat complexity." },
  { id: "tasks", name: "Tasks", icon: "tasks", status: "active", phase: 6, summary: "Chores, calendar and reminders for the household." },
  { id: "food", name: "Food", icon: "food", status: "active", phase: 4, summary: "Shopping, pantry, fridge and meal planning." },
  { id: "budget", name: "Budget", icon: "bills", status: "planned", phase: 3, group: "Money", summary: "Income, expenses and household categories." },
  { id: "bills", name: "Bills", icon: "bills", status: "planned", phase: 3, group: "Money", summary: "Upcoming bills, due dates and payment reminders." },
  { id: "shopping", name: "Shopping List", icon: "shopping", status: "planned", phase: 4, group: "Food", summary: "Shared groceries, household supplies and role-based permissions." },
  { id: "chores", name: "Chores", icon: "chores", status: "planned", phase: 6, group: "Tasks", summary: "Assigned tasks, rotations and personal dashboards." },
  { id: "meals", name: "Meal Planning", icon: "meals", status: "planned", phase: 7, group: "Food", summary: "Weekly meals connected to shopping and inventory." },
  { id: "pantry", name: "Pantry Inventory", icon: "pantry", status: "planned", phase: 8, group: "Food", summary: "Shelf-stable items, stock levels and low-stock planning." },
  { id: "fridge", name: "Fridge Inventory", icon: "fridge", status: "planned", phase: 8, group: "Food", summary: "Fresh food tracking and use-by dates." },
  { id: "notifications", name: "Notifications", icon: "notifications", status: "planned", phase: 9, summary: "Reminders for bills, chores, shopping and routines." },
  { id: "smart-home", name: "Smart Home", icon: "home", status: "planned", phase: 10, summary: "Future device and automation controls." },
  { id: "rewards", name: "Family Rewards", icon: "savings", status: "planned", phase: 10, summary: "Points, goals and family motivation." },
  { id: "settings", name: "Settings", icon: "settings", status: "active", phase: 1, summary: "Household users, access, accessibility and data controls." }
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
