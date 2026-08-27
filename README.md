# CareFlow — Patient-Centric Healthcare Journey & Hospital Care Coordination Platform

CareFlow is a modern, full-stack healthcare platform designed to coordinate care across patients, physicians, hospital administrators, and family caregivers. Built with React 19, TypeScript, Tailwind CSS, an Express.js backend, and a SQL database engine (`sql.js`), CareFlow enforces strict **server-side role-based access control (RBAC)** and multi-tenant data isolation at the database query level.

---

## 🌟 Core Modules & Multi-Role Architecture

| Role | Primary Persona | Key Capabilities & Scoping Boundaries |
| :--- | :--- | :--- |
| **Patient** | Alex Rivera | 6-stage care journey, continuous 14-day vitals logging, medication adherence tracker, appointment scheduler, care tasks checklist, medical reports, emergency card, caregiver access manager. |
| **Doctor** | Dr. Sarah Chen, MD (Cardiology) | Assigned patient roster, clinical milestone management, diagnostic report reviews, clinical task assignments, adherence metrics, prescription updates. Scoped to assigned patients and affiliated hospital. |
| **Hospital Admin** | Elena Rostova (St. Jude Medical Center) | Facility-wide operations: doctor directory, patient registry with stage tracking (no private clinical logs), hospital appointment calendar, department configuration, hospital settings. Scoped to `hospital_id` with 403 server-enforced multi-tenant isolation. |
| **Caregiver** | Maria Rivera | Supportive family role: linked to patient via email with granular 5-category permission toggles (Journey, Appointments, Tasks, Reports, Daily Health). Server-enforced category scoping. |

---

## 🔐 1-Click Demo Accounts

All demo accounts are pre-seeded and use password: `password123`. Quick 1-click login buttons are also available on the sign-in modal and navigation bar:

| Role | Name | Email | Password | Affiliation / Access |
| :--- | :--- | :--- | :--- | :--- |
| **Patient** | Alex Rivera | `alex.rivera@example.com` | `password123` | St. Jude Medical Center • Stage 6 (Recovery) |
| **Doctor** | Dr. Sarah Chen, MD | `dr.chen@stjude.org` | `password123` | St. Jude Medical Center • Cardiology |
| **Hospital Admin** | Elena Rostova | `admin@stjude.org` | `password123` | St. Jude Medical Center (Admin) |
| **Caregiver** | Maria Rivera | `caregiver@careflow.org` | `password123` | Linked to Alex Rivera (Custom Permissions) |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React icons, Recharts for data visualization, Motion for smooth UI transitions.
- **Backend**: Node.js, Express.js (`express`), Cookie Parser, CORS, JSON middleware.
- **Authentication**: JWT-based session tokens with `bcryptjs` password hashing and HTTP-only cookie support.
- **Database Engine**: `sql.js` (WebAssembly/Node SQLite engine) with atomic disk serialization (`careflow.sqlite`).
- **Build System**: Vite 6, `esbuild` for CommonJS server bundling (`dist/server.cjs`), TypeScript compiler.

---

## 🚀 Getting Started & Local Setup

### 1. Installation
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
The application will boot at `http://localhost:3000` with hot reload and Vite middleware integrated.

### 3. Production Build & Execution
```bash
# Build frontend assets and bundle backend server
npm run build

# Launch compiled production server
npm start
```

---

## 🛡️ Server-Side Data Isolation & Security Architecture

1. **Patient Scoping**: Every patient endpoint validates the authenticated `patient_id` from the session token. Cross-patient tampering is rejected with `403 Forbidden`.
2. **Doctor Scoping**: Doctors can only inspect and modify patients assigned to their care roster within their affiliated hospital.
3. **Hospital Admin Isolation**: All `/api/hospitals/*` endpoints enforce strict `hospital_id` tenancy. Admins cannot query or modify doctors, patients, or appointments belonging to other hospital facilities.
4. **Caregiver Granular Permissions**: The `caregiver_links` table enforces individual booleans for:
   - `can_view_journey`
   - `can_view_appointments`
   - `can_view_tasks`
   - `can_view_reports`
   - `can_view_daily_health`
   When a category is toggled off by the patient, the server omits that data from the API response payload.

---

## 📦 Deployment Platform & Storage Considerations

- **Stateless Containers (e.g. Cloud Run, Render, Railway)**: The app persists state to a local `careflow.sqlite` file. If deployed on ephemeral storage containers without a persistent disk volume mount, the database will initialize from the default seed data upon cold restart. For permanent cloud storage in production, consider mounting a persistent volume or configuring Cloud SQL / PostgreSQL.
- **Port Ingress**: The backend binds to host `0.0.0.0` and port `3000`, complying with standard container ingress proxies.
