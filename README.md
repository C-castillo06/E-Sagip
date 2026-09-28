# E-Sagip

E-Sagip is a responsive emergency-dispatch interface for organizing Fire, Medical, and Police incidents in one place. It provides a department-focused workflow: dispatchers create an account, sign in to their assigned department, respond to active caller alerts, and retain completed incident records in a searchable history.

> This project is a front-end demonstration. It stores data in the browser and must not be used as a real emergency-response system without secure authentication, a protected backend, operational procedures, and proper validation.

## What it does

- Gives each dispatcher a department-specific experience for Fire, Medical, or Police response.
- Starts with Fire selected by default and updates the color, icon, and messaging when another department is selected.
- Requires newly registered dispatchers to sign in before accessing E-Sagip.
- Keeps the live queue focused on active callers only.
- Supports accepting an incident, dispatching units, and moving a resolved incident into Incident History.
- Shows caller location, contact number, situation report, and response timing.
- Displays active incidents on an interactive OpenStreetMap/Leaflet tactical map.
- Plays an optional sound when a new drill caller alert arrives.
- Saves demo accounts, incidents, session state, and preferences in browser `localStorage`.

## Dispatch workflow

1. Register a dispatcher account and select the department.
2. Sign in with the same email, password, and department.
3. Review active callers in **Live Queue** or on the **Tactical Map**.
4. Select a caller, then choose **Dispatch Units**.
5. When the response is complete, choose **Move to History**.
6. Open **Incident History** to view the complete record, including report and resolution times.

Use **Run Drill Alert** in the top bar to add a sample caller for the signed-in department. It is useful for testing the alert sound and dispatch flow.

## Technology

- Next.js 15
- React 19
- Tailwind CSS
- Leaflet and OpenStreetMap tiles
- Lucide icons
- Browser `localStorage` for demo persistence

## Project structure

```text
public/
└── logo.png                    # E-Sagip logo

src/
├── app/
│   ├── globals.css             # Shared layout and component styling
│   ├── layout.jsx              # Application metadata and root layout
│   ├── page.jsx                # Landing page
│   ├── login/page.jsx          # Sign-in flow
│   ├── register/page.jsx       # Registration flow
│   └── dashboard/page.jsx      # Authenticated dispatch shell
├── components/
│   ├── Sidebar.jsx             # Dispatch navigation
│   ├── QueueList.jsx           # Active caller queue
│   ├── IncidentMap.jsx         # Leaflet map and markers
│   └── dashboard/
│       └── DashboardViews.jsx  # Incident, history, map, and settings views
└── lib/
    ├── alertSound.js           # Generated incoming-alert tone
    ├── mockData.js             # Demo incidents and map station data
    ├── storage.js              # Safe localStorage helpers
    ├── themes.js               # Department colors, labels, and icons
    └── supabase.js             # Optional future Supabase client scaffold
```

## Run locally

### Requirements

- Node.js 18.18 or later
- npm

### Start the app

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Production check

```bash
npm run build
npm start
```

## Data and settings

The current app is intentionally self-contained. Browser storage keeps the demo data after a page refresh:

| Data | Stored locally |
| --- | --- |
| Dispatcher accounts | Yes |
| Sign-in session | Yes |
| Incidents and history | Yes |
| Alert and display preferences | Yes |

Use **Settings → Reset incident records** to restore the initial demo incidents. This only resets incident data; it does not remove registered accounts.

## Optional Supabase setup

The project includes a small client scaffold in `src/lib/supabase.js`, but the current interface does not depend on Supabase. To connect a future backend, create a `.env.local` file based on `.env.local.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Before using a real backend, add protected authentication, database tables, role-based permissions, audit logging, server-side validation, and Row Level Security policies.

## Current limitations

- Accounts and passwords are demo-only and stored in browser storage.
- Incident updates do not synchronize across users or devices.
- Drill alerts are simulated; they do not connect to a phone, SMS, or emergency-call service.
- Map tiles require an internet connection.

## License

No license has been specified for this project.
