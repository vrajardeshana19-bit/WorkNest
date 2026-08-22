# WorkNest Frontend

React + TypeScript + Vite UI for the WorkNest HRMS.

## Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173 with a light purple & white theme.

Start the backend first:

```bash
cd ../backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Auth flow

1. **Login** — choose Employee, HR Officer, or Admin tab, then sign in.
2. **Sign up** — creates the first company admin (development bootstrap).
3. **Dashboard** — full HRMS navigation after authentication.

## P0 features (sellable demo)

- **Add Employee** (HR/Admin) — Employees page → Add Employee; credentials emailed (console in dev).
- **Holidays** (HR/Admin) — Holidays tab to manage company calendar.
- **Process Payroll** (HR/Admin) — Payroll page → Process current month; emails employees.
- **Payslip PDF** — Download/Print payslip from Payroll page (Save as PDF via browser).
- **Demo seed** — HR dashboard → "Load demo data" or `POST /api/v1/setup/seed-demo` (dev only).

## Docker (optional)

```bash
docker compose up --build
```

API contract: [../docs/API_CONTRACT.md](../docs/API_CONTRACT.md)
