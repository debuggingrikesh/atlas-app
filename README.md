# Atlas SaaS Application (atlas-app)

Welcome to the **Atlas SaaS Application** (`atlas-app`), the core customer-facing platform of the Atlas suite. This repository houses the entire business logic, user interface, database integrations, and customer experience intelligence engine.

---

## 1. Purpose of `atlas-app`

`atlas-app` is the primary SaaS platform designed to transform customer feedback into actionable business intelligence. It serves business owners, branch managers, and staff by offering a complete customer experience management loop:
1. **Feedback Collection:** Customers submit rating and sentiment feedback via QR code landing pages.
2. **AI Analysis:** Feedbacks are automatically parsed using Gemini AI to extract sentiment, categorizations, priority levels, and suggested next actions.
3. **Actionable Insights:** Business dashboards reveal key bottlenecks and track operational performance over time.

This repository focuses strictly on the customer-facing SaaS logic, keeping marketing content (`atlas-web`) and internal platform operations (`atlas-hq`) decoupled.

---

## 2. Architecture

Atlas is built as a **Modular Monolith** using modern web technologies to maximize developer productivity and maintain high architectural standards. 

### Technology Stack
- **Frontend/Backend:** Next.js (v16.2.10) with Turbopack, App Router, TypeScript, Tailwind CSS, and shadcn/ui.
- **Database:** PostgreSQL (Supabase) accessed via Prisma ORM.
- **Authentication:** Supabase Auth for secure sign-up, sign-in, and onboarding flows.
- **Email Delivery:** Resend API for transactional invitations, onboarding alerts, and system emails.
- **AI Engine:** Provider-agnostic AI service layer backed by Google Gemini API.

### Directory Structure
```
├── docs/                 # Architectural plans, QA test suites, and guidelines
├── prisma/               # Prisma Schema definition and database seed scripts
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (Routes, API endpoints, layouts)
│   ├── components/       # Core UI and layout components (shadcn/ui)
│   ├── lib/              # Utility frameworks (database, email, permissions, rate-limits)
│   └── modules/          # Business logic encapsulated into decoupled modules
```

---

## 3. Main Modules

The application is structured into decoupled domain modules located under `src/modules/`:

- **`auth` & `onboarding`:** Handles secure authentication (via Supabase), registration, verification, and multi-step tenant onboarding.
- **`business` & `branches`:** Core models defining Multi-Tenant hierarchy (`Business` -> `Branch` -> `Users`).
- **`reputation` & `feedback`:** QR feedback campaigns, review generation page, and feedback ingestion loop.
- **`ai`:** Provider-agnostic AI service layers analyzing feedback severity, sentiment, categorization, and draft recommendations.
- **`billing`:** Subscription plan management, custom upgrade requests, and feature flag enforcement.
- **`team` & `permissions`:** Role-based access control (RBAC), invitations, and granular permission resolutions.
- **`notifications` & `activity`:** Real-time user event tracking and system alerts.

---

## 4. Development Setup

Follow these steps to set up the development environment locally:

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL database (or a Supabase project instance)
- Resend and Google Gemini API keys

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` (or `.env.local`):
```bash
cp .env.example .env
```
Fill out the required database, auth, Resend, and Gemini keys.

### Step 3: Run Database Migrations & Seeds
Generate the Prisma Client, push schema definitions to your Postgres instance, and run the seed script:
```bash
# Push database schema
npm run db:push

# Run database seeds to setup default industry templates and roles
npm run db:seed
```

### Step 4: Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 5. Environment Requirements

Refer to the table below for keys required in your environment:

| Key | Description | Required In |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Client/Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key | Client/Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin server-only key | Server Only |
| `DATABASE_URL` | PostgreSQL connection string (pooling port 6543) | Server Only |
| `DIRECT_URL` | Direct PostgreSQL connection string (port 5432) | Server Only |
| `NEXT_PUBLIC_APP_URL` | Root URL of the deployed application | Client/Server |
| `RESEND_API_KEY` | Resend API key for transactional emails | Server Only |
| `EMAIL_FROM_ADDRESS` | Sender address for system emails | Server Only |
| `ADMIN_SECRET` | Secret token to authenticate admin requests | Server Only |
| `GEMINI_API_KEY` | Google Gemini API key for feedback analysis | Server Only |
