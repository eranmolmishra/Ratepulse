# RatePulse — Full-Stack Store Rating Web Application

A production-ready, full-stack web application designed for users to browse, search, and submit verified ratings for stores registered on the platform. Built with **React.js**, **Node.js/Express.js**, and **PostgreSQL (Supabase)**, featuring a **Premium Dark SaaS Dashboard** design system and authoritative role-based access control across **System Administrator**, **Normal User**, and **Store Owner**.

---

## 1. Project Overview & Features

RatePulse provides a secure, role-differentiated experience:

- **System Administrator**:
  - Live analytics dashboard: Total Users, Total Stores, Total Ratings count.
  - User Management: Table of all users, search & filter by Name, Email, Address, and Role (`ADMIN`, `USER`, `STORE_OWNER`), sortable columns, and Add User modal with strict validation.
  - User Details Modal: Detailed profile breakdown; for Store Owners, automatically queries and displays the live average rating of the store they own.
  - Store Management: Table of all stores, filter by Name, Email, Address, sortable by Rating/Name, and Add Store modal with duplicate validation.
- **Normal User**:
  - Store Directory: Browse all registered stores with real-time community average rating and submission counts.
  - Dual Search: Independent, debounced search filters by Store Name and Store Address.
  - Rating Submission: Interactive 1–5 star rating submission dialog.
  - Rating Modification: Update existing ratings in real-time with instant average recalculation.
  - Duplicate Prevention: Enforced by PostgreSQL `UNIQUE(user_id, store_id)` constraint and backend validation.
- **Store Owner**:
  - Isolated dashboard showing only their specific store's performance.
  - Average rating display and total customer ratings count.
  - Complete list of customers who rated their store, showing customer name, email, rating value, and date.
- **Account & Security**:
  - Single unified login and registration system.
  - Secure password updates (`PUT /api/auth/password`) accessible across all authenticated roles.
  - Pure Dark SaaS interface strictly adhering to the specified design tokens.

---

## 2. Technology Stack

### Frontend
- **React.js (v19)** with **Vite 8**
- **React Router DOM (v7)** for client routing and role guards (`ProtectedRoute`, `RoleRoute`)
- **Lucide React** for minimal, modern icons
- **Pure Dark SaaS CSS Architecture**:
  - Centralized CSS tokens (`variables.css`, `global.css`, `utilities.css`, `index.css`)
  - Strict compliance with primary button styling: `#6C86FF` background with `#111111` text.
  - Star ratings and rating visualizations highlighted in `#FF7A3D`.

### Backend
- **Node.js** & **Express.js (v5)** REST API
- Layered Architecture: `Routes` → `Controllers` → `Services` → `Repositories` → `PostgreSQL Pool`
- **bcryptjs** for salted password hashing
- **jsonwebtoken (JWT)** for stateless Bearer token authentication
- Strict centralized validation (`constants/validationRules.js`)

### Database
- **PostgreSQL 17 (Supabase)**
- Connection via Supabase session-mode pooler (Port 5432) with SSL encryption.
- Schema constraints:
  - `UNIQUE (user_id, store_id)` on `ratings`
  - `CHECK (rating >= 1 AND rating <= 5)`
  - Foreign key cascades on user and store deletions
  - Case-insensitive unique indexes on user and store emails

---

## 3. Project Structure

```text
root/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Button, Modal, Alert, LoadingSpinner, EmptyState
│   │   │   ├── forms/            # FormInput
│   │   │   ├── ratings/          # Rating (interactive & display stars)
│   │   │   ├── tables/           # DataTable (sortable, desktop table + mobile cards)
│   │   │   ├── dashboard/        # StatCard
│   │   │   └── navigation/       # Sidebar (role-aware navigation)
│   │   ├── pages/
│   │   │   ├── auth/             # LoginPage, SignupPage
│   │   │   ├── admin/            # AdminDashboardPage, AdminUsersPage, AdminStoresPage, Modals
│   │   │   ├── user/             # UserStoresPage, RateStoreModal, ChangePasswordPage
│   │   │   ├── storeOwner/       # OwnerDashboardPage
│   │   │   └── NotFoundPage.jsx
│   │   ├── layouts/              # DashboardLayout, AuthLayout
│   │   ├── routes/               # AppRoutes, ProtectedRoute, RoleRoute
│   │   ├── services/             # api.js, authService, adminService, storeService, ratingService, etc.
│   │   ├── hooks/                # useAuth, useDebounce
│   │   ├── context/              # AuthContext
│   │   ├── utils/                # validators
│   │   ├── constants/            # roles, validationRules
│   │   ├── styles/               # variables.css, global.css, utilities.css, index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── .env
│
├── backend/
│   ├── src/
│   │   ├── config/               # db.js (PostgreSQL pool with SSL), env.js
│   │   ├── controllers/          # authController, adminController, storeController, etc.
│   │   ├── routes/               # authRoutes, adminRoutes, storeRoutes, storeOwnerRoutes
│   │   ├── services/             # authService, adminService, storeService, ratingService, etc.
│   │   ├── repositories/         # userRepository, storeRepository, ratingRepository
│   │   ├── middleware/           # authMiddleware, roleMiddleware, errorHandler
│   │   ├── validators/           # authValidator, userValidator, storeValidator, ratingValidator
│   │   ├── constants/            # roles, validationRules
│   │   ├── utils/                # jwt, password, response
│   │   ├── app.js                # Express app setup & CORS
│   │   └── server.js             # HTTP server entry point
│   ├── package.json
│   └── .env
│
├── database/
│   ├── migrations/
│   │   ├── 001_create_tables.sql # PostgreSQL schema definitions
│   │   └── runMigrations.js      # Migration runner
│   └── seed/
│       └── seedData.js           # Database seed script
│
├── verify_e2e.js                 # 22 automated end-to-end integration tests
├── .env.example
├── package.json
└── README.md
```

---

## 4. Visual Design System

The application strictly implements the requested **Premium Dark SaaS Dashboard** design system:

| Token | Hex / Value | Usage |
| :--- | :--- | :--- |
| `--color-background` | `#000000` | Main application & page backgrounds |
| `--color-surface` | `#0F0F0F` | Cards, tables, forms, modals, sidebars |
| `--color-text` | `#FFFFFF` | Headings, primary labels, main text |
| `--color-muted` | `#9A9A9A` | Secondary descriptions, timestamps, placeholders |
| `--color-accent` | `#6C86FF` | Primary button backgrounds, active nav items, links |
| `--color-accent-text` | `#111111` | **Text on primary accent buttons** (never white) |
| `--color-highlight` | `#FF7A3D` | Rating stars and rating visual indicators |
| `--color-border` | `#262626` | Card borders, table dividers, input borders |
| `--color-category` | `rgba(108, 134, 255, 0.18)` | Role badges and category tags |

---

## 5. Getting Started & Installation

### Prerequisites
- **Node.js** (v20 or higher)
- **npm** (v10 or higher)

### Setup Instructions

1. **Clone & Install Dependencies**:
   ```bash
   cd Anmol
   npm --prefix backend install
   npm --prefix frontend install
   ```

2. **Configure Database Connection**:
   The backend connects to the live Supabase PostgreSQL database configured in `backend/.env`:
   ```ini
   # Connect to Postgres via the shared transaction-mode pooler (IPv4-only)
   DATABASE_URL="postgresql://postgres.ggjxmikydwaqhrpzdsuf:zsbQn9q4yL3GZADf@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Connect to Postgres via the shared session-mode pooler (used for migrations)
   DIRECT_URL="postgresql://postgres.ggjxmikydwaqhrpzdsuf:zsbQn9q4yL3GZADf@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"

   PORT=5000
   JWT_SECRET=kuamrskjdhdfbehffkjjhvvihea
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Run Migrations & Seed Data**:
   ```bash
   npm run migrate
   npm run seed
   ```

4. **Start Backend & Frontend**:
   In two separate terminal windows (or concurrently):
   ```bash
   # Terminal 1: Backend Server (runs on http://localhost:5000)
   npm run start:backend

   # Terminal 2: Frontend Client (runs on http://localhost:5173)
   npm run start:frontend
   ```

5. **Run Automated End-to-End Tests**:
   ```bash
   npm test
   ```

---

## 6. Seed Accounts & Credentials

The seed script creates the following default accounts:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **System Administrator** | System Administrator Account | `admin@storeratings.com` | `AdminPass@123` |
| **Store Owner** | Charlie Brown Cafe Proprietor | `charlie@storeratings.com` | `OwnerPass@123` |
| **Store Owner** | Diana Prince Market Manager | `diana@storeratings.com` | `OwnerPass@123` |
| **Normal User** | Alice Johnson Verified Reviewer | `alice@storeratings.com` | `UserPass@123` |
| **Normal User** | Bob Smith Senior Shopper Member | `bob@storeratings.com` | `UserPass@123` |

---

## 7. Strict Form & Data Validation Rules

Both frontend and backend independently enforce these validation requirements:

- **Name**: 20 to 60 characters in length.
- **Email**: Standard RFC email format, case-insensitive, globally unique.
- **Address**: Up to 400 characters in length.
- **Password**: 8 to 16 characters, at least 1 uppercase letter (`[A-Z]`), and at least 1 special character (`[!@#$%^&*...]`).
- **Rating**: Integer between 1 and 5 (inclusive).
- **User Role**: Strictly `ADMIN`, `USER`, or `STORE_OWNER`.
