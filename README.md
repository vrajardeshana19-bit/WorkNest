# WorkNest

> **Connected HR operations. Intelligent decisions. Automated consequences.**

WorkNest is a modern, full-stack **Human Resource Management System (HRMS)** designed to connect employee management, attendance, leave, overtime, compliance, salary, and payroll into one intelligent workflow.

Unlike traditional HRMS platforms that mainly record events, WorkNest focuses on understanding the **impact and consequences** of those events.

> **"Most HRMS systems record what happened. WorkNest understands the consequences of what happens."**

---

## 🚀 What is WorkNest?

WorkNest provides a centralized platform for employees, HR teams, and administrators to manage everyday workforce operations.

The system connects:

```text
Employee
   │
   ▼
Attendance
   │
   ▼
Working Hours
   │
   ▼
Overtime
   │
   ▼
Compliance
   │
   ▼
Leave Request
   │
   ▼
Smart Leave Conflict Resolver
   │
   ▼
Team Coverage Analysis
   │
   ▼
HR Recommendation
   │
   ▼
Approve / Reject
   │
   ▼
Payroll Recalculation
   │
   ▼
Net Payable
```

This creates a connected HR ecosystem instead of isolated HR modules.

---

# ✨ Key Features

## 👥 Employee Management

WorkNest provides complete employee lifecycle management.

### Features

* Company registration
* Company logo upload
* Employee creation
* Automatic employee Login ID generation
* First-login temporary password
* Mandatory password change
* Employee profiles
* Employee search
* Employee cards
* Employee status indicators
* Department and job information
* Manager information
* Location information

### Employee Status

```text
🟢 Green
Present / Working

✈️ Airplane
On approved leave

🟡 Yellow
Absent without approved leave
```

---

# 🔐 Authentication & Role-Based Access

WorkNest supports three primary roles:

```text
EMPLOYEE
HR
ADMIN
```

## Employee

Employees can:

* View their dashboard
* Check in/out
* View attendance
* Apply for leave
* View leave balances
* View their profile
* View their payroll
* Change their password

Employees cannot access other employees' sensitive information.

---

## HR

HR can:

* View employees
* View attendance
* Manage leave requests
* Approve/reject leave
* Monitor overtime
* Monitor compliance
* Access authorized HR information

---

## Admin

Admins have elevated permissions.

They can:

* Manage company settings
* Manage employees
* Manage holidays
* Configure salary
* Manage payroll
* Configure compliance rules
* Access authorized sensitive information

### Salary Information

Salary information is **ADMIN-only by default**.

---

# 🏢 Company Registration

Company registration supports:

```text
Company Name
Company Logo
Name
Email
Phone
Password
Confirm Password
```

After company registration, authorized users can create employee accounts.

---

# 🆔 Automatic Employee ID

WorkNest automatically generates employee Login IDs.

The concept is:

```text
Company Identifier
        +
Employee Name Identifier
        +
Joining Year
        +
Serial Number
```

Example:

```text
WO-RA-SH-2026-001
```

The exact format can be configured centrally.

Employee IDs must be:

* Server-generated
* Unique
* Collision-safe
* Consistent
* Immutable after creation

---

# 🔑 First Login Security

When an employee account is created:

```text
Employee Created
      ↓
Temporary Password Generated
      ↓
Password Stored as Hash
      ↓
Employee Logs In
      ↓
Password Change Required
      ↓
Normal Access
```

Passwords are never stored in plain text.

---

# 🕐 Attendance Management

Employees can:

```text
CHECK IN
   ↓
WORK
   ↓
CHECK OUT
```

WorkNest calculates:

* Check-in time
* Check-out time
* Working hours
* Break time
* Extra hours
* Overtime
* Attendance status

### Employee Attendance

Employees can view their own:

```text
Date
Check In
Check Out
Work Hours
Extra Hours
```

### HR/Admin Attendance

HR/Admin can view:

```text
Employee
Check In
Check Out
Work Hours
Extra Hours
```

Filtering can include:

* Date
* Employee
* Department
* Status

---

# 🏖️ Time Off & Leave Management

WorkNest supports:

```text
Paid Time Off
Sick Leave
Unpaid Leave
```

Leave reasons may include:

```text
Personal
Vacation
Medical
Emergency
```

Employees can:

* View balances
* View leave calendar
* Create leave requests
* Track request status
* Upload supporting documents when required

Leave statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

---

# 🧠 Smart Leave Conflict Resolver

## ⭐ Main Differentiator

The Smart Leave Conflict Resolver is the central intelligent feature of WorkNest.

Traditional HRMS:

```text
Employee
   ↓
Leave Request
   ↓
HR
   ↓
Approve / Reject
```

WorkNest:

```text
Employee
   ↓
Leave Request
   ↓
Team Analysis
   ↓
Existing Leave Analysis
   ↓
Holiday Analysis
   ↓
Team Coverage
   ↓
Recommendation
   ↓
HR Decision
```

---

## 🔍 What the Resolver Checks

For each leave request:

* Team size
* Existing overlapping leaves
* Available employees
* Coverage before leave
* Coverage during leave
* Coverage after leave
* Holiday overlap
* Effective working leave days
* Leave type
* Leave reason

---

## 📊 Example

```text
Employee:
Rahul Sharma

Leave:
25 Aug → 27 Aug

Team Size:
10

Already on Leave:
2

Coverage Before:
90%

Coverage During:
68%

Coverage After:
90%

Holiday Overlap:
1 day

Effective Leave:
2 days
```

Recommendation:

```text
🟡 APPROVE WITH CAUTION
```

Reason:

```text
Team coverage falls to 68%,
while one requested day overlaps
with a company holiday.
```

---

# ⚙️ Smart Leave Recommendation Policy

Default policy:

```text
Coverage >= 80%
        ↓
APPROVE

Coverage 60–79%
        ↓
APPROVE WITH CAUTION

Coverage < 60%
        ↓
REJECT
```

For:

```text
MEDICAL
EMERGENCY
```

the system should not automatically recommend rejection.

Instead:

```text
APPROVE WITH CAUTION
```

> The Smart Leave Resolver provides a recommendation. **HR always makes the final decision.**

The core recommendation engine is deterministic and backend-driven.

AI is optional and must not invent or fabricate HR data.

---

# 🗓️ Holiday Intelligence

WorkNest maintains company holidays.

Holiday information is used by:

* Leave calculations
* Smart Leave Resolver
* Time Off calendar
* Attendance interpretation
* Payroll

Example:

```text
Requested:

25 Aug
26 Aug ← Company Holiday
27 Aug
```

Effective working leave:

```text
2 days
```

The holiday should not consume a normal leave balance.

---

# ⏱️ Overtime Management

Attendance data automatically feeds overtime calculations.

```text
Attendance
    ↓
Working Hours
    ↓
Daily Overtime
    ↓
Weekly Overtime
    ↓
Quarterly Overtime
```

Example:

```text
Check In:
9:00 AM

Check Out:
8:00 PM

Worked:
11 hours

Configured Normal:
10 hours

Overtime:
1 hour
```

---

# ⚖️ Configurable Compliance

WorkNest uses configurable compliance policies.

Example:

```text
Daily Limit:       10 hours
Weekly Limit:      48 hours
Quarterly Limit:   144 hours
OT Multiplier:     2.0x
```

These values are **configuration parameters**, not hardcoded legal claims.

Compliance statuses:

```text
NORMAL

APPROACHING_LIMIT

EXCEEDED_LIMIT
```

HR can identify employees approaching configured overtime limits.

---

# 💰 Salary Management

Salary information is restricted according to role permissions.

Salary configuration can include:

```text
Wage Type
Monthly Wage
Yearly Wage
Working Days / Week
Break Time
```

Salary components:

```text
Basic Salary
House Rent Allowance
Standard Allowance
Performance Bonus
Leave Travel Allowance
Fixed Allowance
```

Each component can be:

```text
FIXED AMOUNT
OR
PERCENTAGE
```

---

# 💳 PF & Professional Tax

WorkNest supports configurable:

```text
Employee PF
Employer PF
Professional Tax
```

These values should be configurable rather than permanently hardcoded.

---

# 💵 Automatic Payroll

Payroll connects:

```text
Salary
   +
Overtime
   -
Unpaid Leave
   -
Applicable Deductions
   =
Net Payable
```

Example:

```text
Base Salary       ₹50,000

Unpaid Leave      -₹2,000

Overtime          +₹3,000

-------------------------

Net Payable       ₹51,000
```

Payroll is recalculated when relevant approved data changes.

---

# 🔄 Connected Payroll

The key integrations are:

```text
Attendance
     ↓
Overtime
     ↓
Payroll
```

and:

```text
Leave
     ↓
Paid / Unpaid
     ↓
Payroll
```

### Paid Leave

Does not reduce salary.

### Unpaid Leave

Produces a configured salary deduction.

### Overtime

Produces additional pay using the configured overtime multiplier.

---

# 👤 Employee Profile

The profile interface contains:

```text
My Profile
│
├── Resume
├── Private Info
├── Salary Info
└── Security
```

Basic information:

```text
Name
Employee ID
Email
Mobile
Company
Department
Job Position
Manager
Location
Date of Joining
```

Private information may include:

```text
Date of Birth
Residing Address
Nationality
Personal Email
Gender
Marital Status
```

Security information may include:

```text
Bank Account
Bank Name
IFSC
PAN
UAN
Employee Code
```

Sensitive information must be protected and appropriately masked.

---

# 📊 HR Command Center

The HR dashboard is the primary HR operational screen.

Example:

```text
WORKNEST

Good morning, HR 👋

Employees        124
Present Today     98
On Leave           9
Pending Leaves     7
```

### Needs Attention

```text
⚠️ 7 leave requests pending

⚠️ 3 employees approaching overtime limits

⚠️ Payroll increased 6.2%
```

### Leave Request

```text
Rahul
25 Aug → 27 Aug

Coverage:
68%

Recommendation:
🟡 Approve with caution

[View Analysis]
```

All production values must come from real backend/database data.

---

# 🖥️ UI Structure

The main navigation is:

```text
WORKNEST
│
├── Employees
├── Attendance
├── Time Off
└── Profile
```

Authorized HR/Admin users additionally access:

```text
Payroll
Salary
Compliance
Reports
```

---

# 🏗️ Project Structure

```text
WorkNest/
│
├── backend/
│   │
│   ├── app/
│   │   │
│   │   ├── auth/
│   │   │   ├── routes/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   │
│   │   ├── employees/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   │
│   │   ├── attendance/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   └── services/
│   │   │
│   │   ├── leave/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   └── services/
│   │   │
│   │   ├── time_off/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   │
│   │   ├── overtime/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   │
│   │   ├── payroll/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   └── services/
│   │   │
│   │   ├── notifications/
│   │   ├── database/
│   │   └── core/
│   │
│   └── tests/
│
├── frontend/
│   │
│   ├── app/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── docs/
│   ├── WORKNEST_SHARED_CONTEXT.md
│   ├── API_CONTRACT.md
│   ├── ARCHITECTURE.md
│   └── DEMO_FLOW.md
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

> **Important:** This is the target logical structure. If the existing repository already has a working structure, extend it rather than unnecessarily restructuring the project.

---

# 👨‍💻 Team Architecture

WorkNest is being developed by four team members.

| Member   | Branch                       | Main Ownership                        |
| -------- | ---------------------------- | ------------------------------------- |
| Naman Anand    | `feature/backend-foundation` | Auth, Database, Employees, Attendance |
| Naitik Raj     | `feature/smart-leave`        | Leave, Time Off, Smart Leave Resolver |
| Yuktha P       | `feature/frontend`           | Frontend, UX, Dashboards              |
| Vraj Ardeshana | `feature/overtime-payroll`   | Overtime, Compliance, Salary, Payroll |

Each member owns their subsystem and should avoid modifying another member's core implementation.

---

# 🌿 Git Strategy

Never develop directly on `main`.

```text
main
│
├── feature/backend-foundation
├── feature/smart-leave
├── feature/frontend
└── feature/overtime-payroll
```

Recommended workflow:

```bash
git checkout -b feature/<your-feature>

git add .

git commit -m "feat: describe the change"

git push origin feature/<your-feature>
```

Then create a Pull Request into `main`.

---

# 📝 Commit Convention

Good:

```text
feat: implement employee management
feat: add attendance APIs
feat: implement smart leave resolver
feat: build HR dashboard
feat: implement overtime calculation
feat: integrate payroll with leave
test: add payroll integration tests
fix: validate duplicate employee IDs
```

Avoid:

```text
update
changes
stuff
final
done
```

---

# 🔌 API Architecture

The major API areas are:

```text
/auth
/employees
/attendance
/holidays
/leaves
/time-off
/overtime
/salary
/payroll
```

Core endpoints:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
POST /auth/change-password

GET  /employees
POST /employees
GET  /employees/me
GET  /employees/{id}
PUT  /employees/me
PUT  /employees/{id}

POST /attendance/check-in
POST /attendance/check-out
GET  /attendance/me
GET  /attendance
GET  /attendance/{employee_id}

GET  /holidays
POST /holidays

POST /leaves
GET  /leaves
GET  /leaves/me
GET  /leaves/{id}
GET  /leaves/{id}/recommendation
PATCH /leaves/{id}/approve
PATCH /leaves/{id}/reject
PATCH /leaves/{id}/cancel

GET /time-off/balances/me
GET /time-off/calendar
GET /time-off/calendar/me

GET /overtime/me
GET /overtime
GET /overtime/{employee_id}

GET /payroll/me
GET /payroll
GET /payroll/{employee_id}
POST /payroll/calculate/{employee_id}

GET /salary/{employee_id}
PUT /salary/{employee_id}
```

The exact implementation should follow the project's existing API conventions.

All API changes should be documented in:

```text
docs/API_CONTRACT.md
```

---

# 🗄️ Data Model

Logical relationships:

```text
Company
   │
   ├── Users
   │
   ├── Employees
   │      │
   │      ├── Attendance
   │      ├── Leave Requests
   │      ├── Time-Off Balances
   │      ├── Overtime
   │      ├── Salary
   │      └── Payroll
   │
   └── Holidays
```

Additional entities:

```text
Notifications
Audit Logs
Compliance Configuration
```

Database should use:

* Foreign keys
* Unique constraints
* Indexes
* Timestamps
* Status fields
* Migrations

---

# 🔒 Security

Never commit:

```text
Passwords
API Keys
JWT Secrets
Database Credentials
Private Certificates
```

Never log:

```text
Passwords
Password Hashes
Sensitive Financial Data
Unnecessary Personal Data
```

Backend RBAC is the final security boundary.

Frontend hiding/showing UI elements is **not** a security mechanism.

---

# 🧪 Testing

Major features must have tests.

Minimum areas:

```text
Authentication
RBAC
Employee ID generation
Employee management
Attendance
Check-in / Check-out
Leave
Holiday overlap
Smart Leave Resolver
Team coverage
Overtime
Compliance
Salary components
Payroll
Leave → Payroll integration
Overtime → Payroll integration
```

Before merging:

```text
✓ Backend tests
✓ Frontend tests
✓ Lint
✓ Type checking
✓ Build
✓ Database migrations
✓ API integration
```

---

# 🧩 Development Principles

### 1. Inspect Before Editing

Always understand the existing code before changing it.

### 2. Extend, Don't Duplicate

If functionality already exists, extend it.

### 3. Backend Owns Business Logic

The frontend must not independently calculate:

* Payroll
* Overtime
* Team coverage
* Smart Leave recommendations
* Salary components

### 4. Use Real Data

Do not build the application around hardcoded employee, attendance, leave or payroll data.

Demo data should be seeded into the actual database.

### 5. Follow the API Contract

Frontend and backend communicate through documented APIs.

### 6. Small Focused Changes

Avoid unrelated refactoring.

### 7. Test Before Merge

Broken features should not be merged into `main`.

---

# 🤖 HR Assistant — Stretch Feature

The HR Assistant is optional and should only be built after the core system works.

Example queries:

```text
"How many employees are on leave?"

"Show pending leave requests."

"What is Rahul's attendance this month?"

"Who has overtime?"

"When is the next holiday?"
```

Architecture:

```text
User
 ↓
LLM
 ↓
Tool
 ↓
Live Database
 ↓
Verified Result
 ↓
LLM
 ↓
Answer
```

The assistant must query live data.

It must never invent HR information.

---

# 🎬 Final Demo Flow

The final hackathon demonstration should follow one connected employee journey.

## Step 1 — Employee Login

```text
Login
 ↓
Employee Dashboard
```

## Step 2 — Attendance

```text
Check In
 ↓
Work
 ↓
Check Out
```

## Step 3 — Overtime

```text
Working Hours
 ↓
Overtime
 ↓
Compliance
```

## Step 4 — Leave

```text
Employee applies for leave
 ↓
HR receives request
```

## Step 5 — Smart Leave Analysis

```text
Team Size
 ↓
Existing Leave
 ↓
Holiday Overlap
 ↓
Coverage
 ↓
Recommendation
```

## Step 6 — HR Decision

```text
Approve / Reject
```

## Step 7 — Payroll

```text
Approved Leave
+
Overtime
+
Salary
 ↓
Payroll Recalculation
 ↓
Net Payable
```

## Step 8 — Optional HR Assistant

```text
"Who has overtime this month?"
        ↓
Live Database
        ↓
Verified Answer
```

---

# 🏆 The WOW Moment

The judge should see a leave request transform into an actionable HR recommendation.

```text
LEAVE REQUEST

Rahul Sharma
25 Aug → 27 Aug

Team Size: 10
Already on Leave: 2

Coverage Before: 90%
Coverage During: 68%
Coverage After: 90%

Holiday Overlap: 1 day

Effective Leave: 2 days

────────────────────────

RECOMMENDATION

🟡 APPROVE WITH CAUTION

Team coverage falls to 68%.

[Approve] [Reject]
```

Then:

```text
HR APPROVES
     ↓
Leave Balance Updates
     ↓
Payroll Recalculates
     ↓
Net Payable Updates
```

This demonstrates that WorkNest is not just recording information — it understands the consequences of HR decisions.

---

# 🛣️ Feature Priority

## P0 — MUST WORK

* Authentication
* Employee Management
* Attendance
* Check-in / Check-out
* Leave
* Time Off
* Smart Leave Resolver
* Overtime
* Payroll
* RBAC
* Database
* Responsive UI

## P1 — IMPORTANT

* Employee Profiles
* Salary Configuration
* Security Information
* Holiday Calendar
* Notifications
* Audit Logs
* Compliance Alerts

## P2 — STRETCH

* HR Assistant
* Natural Language HR Queries
* Advanced Analytics
* Predictive Insights

> **Never sacrifice P0 functionality for P2 features.**

---

# 📋 Final Integration Checklist

```text
[ ] Authentication works
[ ] Company registration works
[ ] Company logo works
[ ] Employee creation works
[ ] Employee IDs generate automatically
[ ] First-login password change works
[ ] Employee cards work
[ ] Employee status indicators work
[ ] Employee profile works
[ ] Attendance works
[ ] Check-in works
[ ] Check-out works
[ ] Overtime works
[ ] Compliance alerts work
[ ] Leave request works
[ ] Leave calendar works
[ ] Holiday overlap works
[ ] Smart Leave Resolver works
[ ] HR approval/rejection works
[ ] Leave balances update
[ ] Payroll recalculates
[ ] Salary information is protected
[ ] RBAC works
[ ] Real database data is used
[ ] API contracts match
[ ] Backend tests pass
[ ] Frontend tests pass
[ ] Build passes
[ ] Migrations work
[ ] No secrets are committed
[ ] No critical console/API errors
[ ] Responsive UI works
```

---

# 📚 Project Documentation

Keep the following documents synchronized:

```text
docs/
│
├── WORKNEST_SHARED_CONTEXT.md
│   └── Complete shared context for all 4 developers and AI agents
│
├── API_CONTRACT.md
│   └── Frontend/backend API definitions
│
├── ARCHITECTURE.md
│   └── Technical architecture and decisions
│
└── DEMO_FLOW.md
    └── Final hackathon demonstration
```

Every team member and every AI coding agent should refer to these documents before making architectural decisions.

---

# 📄 License

Add the project's chosen license before public release.

---

## WorkNest

**Connected HR operations. Intelligent decisions. Automated consequences.**

---

# 🚀 Backend foundation (implemented)

The `backend/` folder contains the FastAPI foundation (auth, employees, attendance, holidays).

## Quick start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DATABASE_URL and JWT_SECRET locally — never commit .env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest -v
```

- API docs: http://localhost:8000/docs
- API contract: [docs/API_CONTRACT.md](docs/API_CONTRACT.md)

Implemented on `main` from branch `backend` (Person 1 — Naman Anand).
