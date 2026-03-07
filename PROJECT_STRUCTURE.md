# Retro Project Structure

## Directory Layout

```
src/
├── api/                      # API client & config
│   ├── apiClient.js
│   └── index.js
├── routes/                   # Route guards & route config
│   ├── ProtectedRoute.jsx
│   └── index.js
├── utils/                    # Shared utilities
│   ├── getInitials.js
│   ├── formatDate.js
│   ├── constants.js
│   └── index.js
├── components/               # Feature & shared UI (lowercase convention)
│   ├── Common/               # Reusable components + barrel export
│   │   ├── index.js
│   │   ├── ProfileDropdown.jsx
│   │   ├── CreateTeamModal.jsx
│   │   ├── TeamCard.jsx
│   │   └── DashboardLayout.jsx
│   ├── Analytics/
│   ├── Board/
│   ├── Dashboard/
│   ├── Integrations/
│   ├── Join/
│   ├── Landing/
│   ├── MagicLogin/
│   ├── Register/
│   ├── Teams/
│   └── Templates/
│       ├── TemplateSelector.jsx
│       └── CreateTemplateModal.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Conventions

- **components/** – lowercase; one folder per feature/screen; shared UI in `Common/`.
- **Barrel exports** – `api/index.js`, `routes/index.js`, `components/Common/index.js` for cleaner imports.
- **Routes** – `ProtectedRoute` lives in `routes/`; no route logic in `App.jsx` beyond composition.

## Reusable Components (Common)

| Component          | Used By                                      |
|-------------------|----------------------------------------------|
| CreateTeamModal   | Dashboard, Teams                             |
| TeamCard          | Dashboard (TeamsTab), Teams                  |
| DashboardLayout   | Analytics, Teams, Integrations               |
| CreateTemplateModal | Dashboard                                  |
| TemplateSelector  | Landing, Dashboard                           |
| ProfileDropdown   | Analytics, Teams, Integrations, Dashboard   |

## Shared Utilities (`utils/`)

- `getInitials(name)`
- `formatDate(str)`
- `PALETTE` (card/avatar colors)

## Imports

- App: `import { ProtectedRoute } from "./routes";` and `from "./components/..."`
- Common usage: `import { DashboardLayout, TeamCard } from "../Common";` or full path.
