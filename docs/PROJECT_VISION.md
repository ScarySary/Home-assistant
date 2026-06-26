# Household Assistant Vision

This app is a long-term personal household assistant for reducing the mental load of running a family home. It should grow carefully, with stability, accessibility and data safety treated as core features.

## Core Goal

Keep household information in one private place:

- Dashboard
- Finances: debt, savings, budget and bills
- Calendar
- Chores
- Shopping lists
- Pantry inventory
- Fridge inventory
- Meal planning
- Notifications
- Smart home integration
- Family rewards
- AI household assistant

## Product Principles

- Prioritize stability before adding new features.
- Improve usability, performance and accessibility before expanding scope.
- Keep the interface clean, modern and calm.
- Use large scalable text, high contrast, visible focus states and large touch targets.
- Store household data separately from application files and caches.
- Make updates additive and migratable so user data is not deleted.
- Add new features as modules with narrow ownership boundaries.
- Prefer fast, simple interfaces over animations.
- Design for years of household data by keeping calculations scoped and avoiding global rewrites.
- Make modules integrate naturally through shared household users, dates, permissions and notifications.

## Users And Roles

The app supports one household with multiple users.

Roles:

- Administrator: household setup, users, settings, backup and full access.
- Adult: shared household access for daily management.
- Teen: future personal dashboard, assigned chores and limited permissions.
- Child: future rewards, chores and simplified views.

Future modules should use these roles for reminders, chore assignment, shopping permissions and personal dashboards.

## Development Order

1. Stable installable application
2. Dashboard
3. Finances
4. Shopping
5. Calendar
6. Chores
7. Meal planning
8. Pantry and fridge inventory
9. Notifications
10. Smart home
11. AI assistant

## Architecture Commitments

- `js/core` owns cross-cutting services such as storage, authentication, formatting and DOM helpers.
- `js/modules` owns individual feature modules.
- `moduleCatalog` is the registry for navigation, dashboard cards, status and roadmap phase.
- Household data lives under `householdAssistant.userData.v1`; app shell files and service-worker cache are separate.
- Future data changes should be handled with versioned migration functions before rendering.
- Implemented modules should expose small render/update functions and avoid reaching into unrelated modules.
- Shared integrations should flow through stable core services instead of direct module-to-module coupling.
