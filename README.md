# Dayflow

Human Resource Management System (HRMS) — hackathon project.

## Repository layout

```text
DAYFlow/
├── backend/     # FastAPI + PostgreSQL (Person 1 — Backend Foundation)
├── frontend/    # Web UI (Person 3)
└── docs/        # API contracts and shared documentation
```

## Requirements

- **Python 3.10+**
- **PostgreSQL** via [Neon](https://neon.tech) (SQLite is not used)

## Backend setup

### 1. Virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `backend/.env` and set at minimum:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DATABASE?sslmode=require
JWT_SECRET=your-long-random-secret
```

Optional for isolated pytest runs:

```env
TEST_DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST/DATABASE_test?sslmode=require
```

**Neon notes:**

- Use the **psycopg2** driver prefix: `postgresql+psycopg2://`
- Always include `?sslmode=require`
- Never commit `.env` — it is gitignored

### 3. Database migrations

From `backend/` with your virtual environment active:

```bash
alembic upgrade head
```

This creates all foundation tables on a fresh Neon database.

### 4. Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- OpenAPI docs: http://localhost:8000/docs
- App health: http://localhost:8000/api/v1/health
- Database health: http://localhost:8000/api/v1/health/db

### 5. Run tests

Database and auth tests require PostgreSQL (Neon). Migrations must be applied first.

```bash
pytest -v
```

### 6. Mockup-aligned auth flow

```bash
# First-time setup (development, empty database)
curl -X POST http://localhost:8000/api/v1/setup/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Odoo India","company_initials":"OI","admin_email":"admin@example.com","admin_first_name":"Admin","admin_last_name":"User","password":"adminpass123"}'

# HR/Admin login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=adminpass123"

# HR creates employee (auto Login ID + temp password)
curl -X POST http://localhost:8000/api/v1/employees \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"company_id":"COMPANY_UUID","first_name":"John","last_name":"Doe","email":"john@example.com","date_of_joining":"2022-01-15"}'

# Employee login with Login ID or email, then change password
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=OIJODO20220001&password=TEMP_PASSWORD"
```

**Note:** Public self-registration is removed. Only HR/Admin creates employees (mockup requirement).

## Branch discipline

Do **not** commit feature work directly to `main`. Use feature branches:

- `feature/backend-foundation` — auth, employees, attendance, holidays
- Other teammates use their own branches and open PRs into `main`

## API contract

See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for stable endpoint contracts and database assumptions consumed by frontend and other backend modules.
