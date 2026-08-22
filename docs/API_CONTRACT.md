# Dayflow API Contract

> **Status:** Mockup-aligned foundation complete — auth, employees, attendance, holidays.
>
> **Base URL:** `/api/v1`
>
> **Do not change response shapes** after other developers start consuming them without team agreement.

## Database assumptions (Person 2, 3, 4)

These conventions are locked for integration:

| Concept | Type / format | Notes |
|---------|---------------|--------|
| **User ID** | UUID (`string` in JSON) | Primary key on `users.id` — JWT claim `sub` |
| **Employee profile ID** | UUID | Primary key on `employees.id` |
| **Business employee ID (Login ID)** | `string` (max 64) | Auto-generated: `[CompanyInitials][UserInitials][JoinYear][Serial]` e.g. `OIJODO20220001` |
| **Employee display status** | `PRESENT`, `ON_LEAVE`, `ABSENT` | Dashboard card indicator — `ON_LEAVE` wired when Person 2 integrates leave |
| **Attendance ID** | UUID | FK `attendances.employee_id` → `employees.id` |
| **Holiday ID** | UUID | |
| **Timestamps** | ISO 8601 UTC | All `DateTime` columns are timezone-aware (`timestamptz`) |
| **Dates** | `YYYY-MM-DD` | Used for attendance day and holiday date |
| **Roles** | `EMPLOYEE`, `HR`, `ADMIN` | Single enum in `app.core.enums.Role` |
| **Attendance status** | `CHECKED_IN`, `CHECKED_OUT`, `COMPLETE`, `ABSENT` | Enum in `app.core.enums.AttendanceStatus` |

### Relationships

```text
Company (1) ── (*) Employee
User (1) ── (1) Employee
User (1) ── (*) EmailVerificationToken
Employee (1) ── (*) Attendance
```

### Login ID format (mockup)

```text
[CompanyInitials][UserInitials][JoinYear][Serial]
Example: OIJODO20220001
  OI   = company initials
  JODO = first 2 letters of first + last name
  2022 = date_of_joining year
  0001 = join order for that company in that year
```

### Registration policy (mockup)

- **Employees cannot self-register.**
- **HR/Admin** creates employees via `POST /api/v1/employees`.
- System generates **Login ID** and **temporary password**.
- User must **change password** on first login (`must_change_password=true`).

### Constraints teammates should respect

- `users.email` — unique
- `users.employee_id` — unique
- `employees.user_id` — unique (one profile per user)
- `employees.employee_id` — unique
- `attendances` — one record per `(employee_id, date)`
- `holidays.date` — unique (one named holiday entry per calendar date)

### Foreign keys for future modules

When Person 2 (Leave) or Person 4 (Payroll/Overtime) add tables:

- Reference `users.id` (UUID) for user-scoped data
- Reference `employees.id` (UUID) for employee-scoped HR data
- Do **not** duplicate role strings — import `Role` from the backend foundation

---

## Conventions

### Authentication

Protected routes require:

```http
Authorization: Bearer <jwt_token>
```

Obtain a token via `POST /api/v1/auth/login` (form-urlencoded).

**Login `username` field:** Login ID **or** email address.

**JWT claims:**

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | UUID string | `users.id` |
| `role` | string | `EMPLOYEE`, `HR`, or `ADMIN` |
| `exp` | unix timestamp | Token expiration |

**Authorization dependencies (for backend modules):**

| Dependency | Allowed roles |
|------------|---------------|
| `get_current_user` | Any authenticated active user |
| `require_employee` | `EMPLOYEE` only |
| `require_hr` | `HR` only |
| `require_admin` | `ADMIN` only |
| `require_hr_or_admin` | `HR` or `ADMIN` |

### Roles

Locked enum (shared across DB, JWT, and Pydantic):

| Value | Description |
|-------|-------------|
| `EMPLOYEE` | Standard employee |
| `HR` | HR staff |
| `ADMIN` | Administrator |

### Error response shape

All errors follow this structure:

```json
{
  "detail": "Human-readable message"
}
```

Validation errors (422):

```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "error message",
      "type": "value_error"
    }
  ]
}
```

---

## Endpoints

### Health

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| GET | `/api/v1/health` | No | — | Implemented |
| GET | `/api/v1/health/db` | No | — | Implemented |

**GET `/api/v1/health` — Response 200:**

```json
{
  "status": "ok",
  "app": "dayflow",
  "environment": "development"
}
```

**GET `/api/v1/health/db` — Response 200:**

```json
{
  "status": "ok",
  "database": "connected"
}
```

**GET `/api/v1/health/db` — Response 503** (database unavailable):

```json
{
  "status": "error",
  "database": "unavailable"
}
```

---

### Setup (development only)

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| POST | `/api/v1/setup/bootstrap` | No | — | Implemented (dev only) |

Creates first company + admin when no users exist.

---

### Auth

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| POST | `/api/v1/auth/login` | No | — | Implemented |
| POST | `/api/v1/auth/change-password` | Yes | Any | Implemented |
| POST | `/api/v1/auth/verify-email` | No | — | Implemented (legacy) |
| GET | `/api/v1/auth/me` | Yes | Any | Implemented |

**Removed:** `POST /api/v1/auth/register` — use HR employee creation instead.

**POST `/api/v1/auth/login` — Request** (`application/x-www-form-urlencoded`):

| Field | Value |
|-------|-------|
| `username` | Login ID (e.g. `OIJODO20220001`) **or** email |
| `password` | password |

**Response 200:**

```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "must_change_password": true
}
```

**POST `/api/v1/auth/change-password` — Request:**

```json
{
  "current_password": "temporary-or-current",
  "new_password": "newsecure123"
}
```

**GET `/api/v1/auth/me` — Response 200:**

```json
{
  "id": "uuid",
  "employee_id": "OIJODO20220001",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "is_verified": true,
  "is_active": true,
  "must_change_password": false,
  "display_status": "ABSENT",
  "created_at": "...",
  "updated_at": "..."
}
```

`display_status`: `PRESENT` (green), `ON_LEAVE` (airplane), `ABSENT` (yellow).

---

### Employees

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| POST | `/api/v1/employees/companies` | Yes | HR, ADMIN | Implemented |
| POST | `/api/v1/employees` | Yes | HR, ADMIN | Implemented |
| GET | `/api/v1/employees` | Yes | HR, ADMIN | Implemented |
| GET | `/api/v1/employees/me` | Yes | Any (with profile) | Implemented |
| PATCH | `/api/v1/employees/me` | Yes | Any (with profile) | Implemented |
| GET | `/api/v1/employees/{id}` | Yes | HR/ADMIN or self | Implemented |

**POST `/api/v1/employees` — Request:**

```json
{
  "company_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "9999999999",
  "date_of_joining": "2022-01-15",
  "department": "Engineering",
  "designation": "Developer",
  "role": "EMPLOYEE"
}
```

**Response 201:**

```json
{
  "id": "uuid",
  "login_id": "OIJODO20220001",
  "email": "john@example.com",
  "role": "EMPLOYEE",
  "first_name": "John",
  "last_name": "Doe",
  "message": "Employee created. Share Login ID and temporary password securely.",
  "temporary_password": null
}
```

`temporary_password` returned only when `DEBUG=true`.

---

### Auth (legacy verify-email)

**POST `/api/v1/auth/verify-email`**

```json
{ "token": "token-from-email-or-console-log" }
```

---

### Attendance (mockup-aligned)

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| POST | `/api/v1/attendance/check-in` | Yes | EMPLOYEE | Implemented |
| POST | `/api/v1/attendance/check-out` | Yes | EMPLOYEE | Implemented |
| GET | `/api/v1/attendance/me/today` | Yes | Any (with profile) | Implemented — systray |
| GET | `/api/v1/attendance/me` | Yes | Any (with profile) | Implemented — monthly view |
| GET | `/api/v1/attendance?date=YYYY-MM-DD` | Yes | HR, ADMIN | Implemented — daily admin view |

**Systray — GET `/api/v1/attendance/me/today`:**

```json
{
  "date": "2026-08-22",
  "is_checked_in": true,
  "check_in_at": "2026-08-22T09:00:00+00:00",
  "check_out_at": null,
  "since": "09:00",
  "status": "CHECKED_IN"
}
```

**Employee monthly — GET `/api/v1/attendance/me?year=2026&month=8`:**

```json
{
  "year": 2026,
  "month": 8,
  "summary": {
    "days_present": 18,
    "leaves_count": 0,
    "total_working_days": 21
  },
  "records": [
    {
      "id": "uuid",
      "date": "2026-08-22",
      "check_in_time": "10:00",
      "check_out_time": "19:00",
      "work_hours": "9.00",
      "extra_hours": "1.00",
      "status": "COMPLETE"
    }
  ]
}
```

`leaves_count` — placeholder `0` until Person 2 integrates leave module via `leave_integration.py`.

`total_working_days` — weekdays in month minus company holidays.

**Admin daily — GET `/api/v1/attendance?date=2026-10-22`:**

```json
{
  "date": "2026-10-22",
  "records": [
    {
      "employee_id": "uuid",
      "login_id": "OIJODO20220001",
      "employee_name": "John Doe",
      "department": "Engineering",
      "check_in_time": "10:00",
      "check_out_time": "19:00",
      "work_hours": "9.00",
      "extra_hours": "1.00",
      "status": "COMPLETE"
    }
  ]
}
```

**Extra hours:** `max(0, work_hours - STANDARD_WORK_HOURS_PER_DAY)` (default 8h).

---

### Holidays

| Method | Path | Auth | Role | Status |
|--------|------|------|------|--------|
| GET | `/api/v1/holidays` | Yes | Any | Implemented |
| POST | `/api/v1/holidays` | Yes | HR, ADMIN | Implemented |
| PATCH | `/api/v1/holidays/{id}` | Yes | HR, ADMIN | Implemented |
| DELETE | `/api/v1/holidays/{id}` | Yes | HR, ADMIN | Implemented |

---

## Extension slots (other teammates)

| Module | Owner | Prefix | Status |
|--------|-------|--------|--------|
| Leave / Time Off | Person 2 | `/api/v1/leave` | Integrate via `app/services/leave_integration.py` |
| Overtime / Payroll / Salary | Person 4 | `/api/v1/payroll` | Salary tab admin-only in mockup |

Foundation provides: `User` model, JWT auth dependencies (`get_current_user`, `require_hr_or_admin`, etc.), consistent error format, and `/api/v1` prefix pattern.
