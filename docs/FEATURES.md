# BlackFlag HR - Product Features & Functional Requirements

> **Status:** Planning  
> **Doc Version:** 1.0  
> **Last Updated:** December 2025

---

## 1. Overview

This document outlines the functional requirements for the BlackFlag HR web application. Features are organized into phases based on priority and complexity.

**User Roles:**
- **Employee:** Standard user with self-service access
- **Manager:** Can view/approve for direct reports
- **HR Admin:** Full system access

---

## 2. Phase 1: MVP (Core HR)

### 2.1. Employee Directory

| Feature | Description | Access |
|---------|-------------|--------|
| **Search & Filter** | Search employees by name, department, position | All |
| **Employee Cards** | Display photo, name, title, department, contact | All |
| **Profile View** | Full profile with work history and contact info | All |
| **Org Chart** | Visual hierarchy showing reporting structure | All |

**Employee Profile Fields (Public):**
- Name, Photo, Position, Department
- Email, Phone, Office Location
- Manager, Start Date

**Employee Profile Fields (Restricted - HR Admin only):**
- Salary, SSN, Date of Birth
- Emergency Contacts, Home Address
- Performance Notes

### 2.2. Self-Service Portal

| Feature | Description | Access |
|---------|-------------|--------|
| **View Own Profile** | Employee sees their complete profile | Employee |
| **Edit Personal Info** | Update phone, address, emergency contacts | Employee |
| **View Pay Stubs** | Access historical pay statements (PDF) | Employee |
| **View Benefits** | See enrolled benefits and coverage | Employee |

### 2.3. Employee Management (HR Admin)

| Feature | Description | Access |
|---------|-------------|--------|
| **Add Employee** | Create new employee record with all fields | HR Admin |
| **Edit Employee** | Modify any employee information | HR Admin |
| **Deactivate Employee** | Mark employee as inactive (offboarding) | HR Admin |
| **Bulk Import** | CSV upload for multiple employee records | HR Admin |

### 2.4. Authentication & Security

| Feature | Description |
|---------|-------------|
| **Secure Login** | Email/password with session management |
| **SSO Integration** | AWS IAM Identity Center (OIDC) |
| **Role-Based Access** | Enforce permissions based on user role |
| **Session Timeout** | Auto-logout after 30 min inactivity |
| **Audit Logging** | Track who viewed/modified sensitive data |

---

## 3. Phase 2: Leave & Time Management

### 3.1. Leave/PTO Management

| Feature | Description | Access |
|---------|-------------|--------|
| **View Balances** | See available PTO, sick, personal days | Employee |
| **Request Leave** | Submit time-off request with dates & type | Employee |
| **Cancel Request** | Cancel pending leave requests | Employee |
| **Approval Workflow** | Manager approves/denies requests | Manager |
| **Team Calendar** | View team's approved time off | Manager |
| **Leave Policies** | Configure accrual rules and caps | HR Admin |

**Leave Types:**
- Vacation/PTO
- Sick Leave
- Personal Day
- Bereavement
- Jury Duty
- Parental Leave

### 3.2. Time Tracking (Optional)

| Feature | Description | Access |
|---------|-------------|--------|
| **Clock In/Out** | Record work hours | Employee |
| **Timesheet View** | Weekly/biweekly timesheet summary | Employee |
| **Submit Timesheet** | Submit for manager approval | Employee |
| **Approve Timesheet** | Manager approves hours | Manager |
| **Time Reports** | Hours by project, department | HR Admin |

---

## 4. Phase 3: Performance & Documents

### 4.1. Performance Management

| Feature | Description | Access |
|---------|-------------|--------|
| **Set Goals** | Employee/manager set performance goals | Employee/Manager |
| **Goal Progress** | Update goal status and notes | Employee |
| **Review Cycles** | Annual/quarterly review periods | HR Admin |
| **Self-Assessment** | Employee completes self-review | Employee |
| **Manager Review** | Manager provides feedback & ratings | Manager |
| **Review History** | Access past performance reviews | Employee/Manager |

### 4.2. Document Management

| Feature | Description | Access |
|---------|-------------|--------|
| **Personal Documents** | Employee uploads ID, certifications | Employee |
| **Company Documents** | Access handbook, policies | All |
| **Offer Letters** | HR uploads signed offer letters | HR Admin |
| **Tax Forms** | W-4, I-9, state forms | Employee/HR Admin |
| **Document Expiry** | Alerts for expiring certifications | HR Admin |

---

## 5. Phase 4: Reporting & Analytics

### 5.1. HR Dashboard

| Metric | Description |
|--------|-------------|
| **Headcount** | Total employees, by department |
| **New Hires** | Employees added this month/quarter |
| **Turnover Rate** | Departures vs. total headcount |
| **Open Positions** | Unfilled roles (if recruiting enabled) |
| **Leave Overview** | Who's out today/this week |

### 5.2. Reports

| Report | Description | Access |
|--------|-------------|--------|
| **Employee Roster** | Full employee list export (CSV/Excel) | HR Admin |
| **Birthday Report** | Upcoming employee birthdays | HR Admin |
| **Anniversary Report** | Work anniversaries this month | HR Admin |
| **Compensation Report** | Salary by department/role | HR Admin |
| **Leave Utilization** | PTO usage by employee/department | HR Admin |
| **Audit Report** | Who accessed sensitive data | HR Admin |

---

## 6. User Interface Specifications

### 6.1. Key Pages

| Page | Description | Primary User |
|------|-------------|--------------|
| **Dashboard** | Overview cards, quick actions, notifications | All |
| **Directory** | Searchable employee list with filters | All |
| **My Profile** | View/edit own information | Employee |
| **Employee Detail** | Full profile view (varies by role) | All |
| **Leave Calendar** | Visual calendar with time-off | All |
| **Leave Request** | Form to submit new request | Employee |
| **Admin Panel** | Employee management, reports | HR Admin |
| **Settings** | User preferences, notifications | All |

### 6.2. Navigation Structure

```
┌────────────────────────────────────────────────────┐
│  BlackFlag HR                    [Search] [Profile]│
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────┐  ┌────────────────────────────────┐  │
│  │ Dashboard│  │                                │  │
│  │ Directory│  │        Main Content Area       │  │
│  │ My Info  │  │                                │  │
│  │ Leave    │  │                                │  │
│  │ Documents│  │                                │  │
│  │ ──────── │  │                                │  │
│  │ Admin    │  │                                │  │
│  │ Reports  │  │                                │  │
│  └──────────┘  └────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 6.3. Mobile Responsiveness

- All pages must work on tablet/phone
- Directory uses card layout on mobile
- Forms stack vertically on small screens
- Touch-friendly buttons (min 44px tap targets)

---

## 7. Data Model Extensions

### 7.1. Leave Request Entity

```
┌─────────────────────────────────────────┐
│            LeaveRequest                 │
├─────────────────────────────────────────┤
│ id              : UUID (PK)             │
│ employee_id     : UUID (FK → Employee)  │
│ leave_type      : ENUM                  │
│ start_date      : DATE                  │
│ end_date        : DATE                  │
│ hours           : DECIMAL               │
│ status          : ENUM (pending/approved/denied) │
│ notes           : TEXT                  │
│ approved_by     : UUID (FK → Employee)  │
│ created_at      : TIMESTAMP             │
│ updated_at      : TIMESTAMP             │
└─────────────────────────────────────────┘
```

### 7.2. Document Entity

```
┌─────────────────────────────────────────┐
│              Document                   │
├─────────────────────────────────────────┤
│ id              : UUID (PK)             │
│ employee_id     : UUID (FK → Employee)  │
│ document_type   : ENUM                  │
│ filename        : VARCHAR(255)          │
│ s3_key          : VARCHAR(500)          │
│ uploaded_by     : UUID (FK → Employee)  │
│ expiry_date     : DATE (nullable)       │
│ created_at      : TIMESTAMP             │
└─────────────────────────────────────────┘
```

### 7.3. Leave Balance Entity

```
┌─────────────────────────────────────────┐
│            LeaveBalance                 │
├─────────────────────────────────────────┤
│ id              : UUID (PK)             │
│ employee_id     : UUID (FK → Employee)  │
│ leave_type      : ENUM                  │
│ year            : INTEGER               │
│ accrued         : DECIMAL               │
│ used            : DECIMAL               │
│ carried_over    : DECIMAL               │
│ updated_at      : TIMESTAMP             │
└─────────────────────────────────────────┘
```

---

## 8. API Endpoints (Extended)

### 8.1. Leave Management APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/leave/balance` | Employee | Get own leave balances |
| `GET` | `/api/v1/leave/requests` | Employee | List own leave requests |
| `POST` | `/api/v1/leave/requests` | Employee | Submit new leave request |
| `DELETE` | `/api/v1/leave/requests/:id` | Employee | Cancel pending request |
| `GET` | `/api/v1/leave/team` | Manager | List team's leave requests |
| `PUT` | `/api/v1/leave/requests/:id/approve` | Manager | Approve request |
| `PUT` | `/api/v1/leave/requests/:id/deny` | Manager | Deny request |
| `GET` | `/api/v1/leave/calendar` | All | Team leave calendar |

### 8.2. Document APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/documents` | Employee | List own documents |
| `POST` | `/api/v1/documents/upload` | Employee | Get presigned upload URL |
| `GET` | `/api/v1/documents/:id` | Owner/Admin | Get presigned download URL |
| `DELETE` | `/api/v1/documents/:id` | Owner/Admin | Delete document |

### 8.3. Reports APIs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/reports/headcount` | HR Admin | Headcount summary |
| `GET` | `/api/v1/reports/turnover` | HR Admin | Turnover statistics |
| `GET` | `/api/v1/reports/leave-utilization` | HR Admin | Leave usage report |
| `GET` | `/api/v1/reports/export/employees` | HR Admin | Export employees CSV |

---

## 9. Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| **P0** | Employee Directory & Search | Medium | High |
| **P0** | Employee CRUD (HR Admin) | Medium | High |
| **P0** | Authentication & RBAC | High | Critical |
| **P1** | Self-Service Profile Edit | Low | Medium |
| **P1** | Leave Request & Approval | High | High |
| **P1** | Leave Balances | Medium | High |
| **P2** | Document Upload/Download | Medium | Medium |
| **P2** | Org Chart Visualization | Medium | Medium |
| **P2** | HR Dashboard & Metrics | Medium | Medium |
| **P3** | Performance Reviews | High | Medium |
| **P3** | Advanced Reporting | Medium | Low |

---

## 10. Out of Scope (V1)

The following features are explicitly **not** included in the initial release:

- Recruiting / Applicant Tracking
- Payroll Processing (integration-ready only)
- Benefits Enrollment
- Learning Management / Training
- Expense Reimbursement
- Asset Management
- Complex Workflow Builder
- Multi-company / Multi-tenant

---

## References

- [DESIGN.md](./DESIGN.md) - Architecture & Security Design
- [ARCHITECTURE.md](./ARCHITECTURE.md) - AWS Infrastructure Details
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment Guide

