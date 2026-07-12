# Project Atlas Folder Structure

## 1. Overview

Project Atlas follows a modular Next.js App Router architecture designed for scalability, maintainability, and enterprise SaaS growth.

The folder structure separates:

- Application routing
- Business modules
- Database layer
- Authentication
- Shared components
- Utilities
- Configuration
- Documentation

---

# 2. Root Structure

```text
project-atlas/
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
│
├── public/
│   ├── images/
│   └── assets/
│
├── src/
│   ├── app/
│   ├── modules/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── types/
│   ├── validations/
│   └── constants/
│
├── docs/
│
├── .env
├── .env.local
├── package.json
├── prisma.config.ts
├── next.config.ts
├── tsconfig.json
└── README.md
3. Application Layer

Location:

src/app/

Responsible for:

Routes
Pages
API endpoints
Layouts
Loading states
Error boundaries

Structure:

app/
│
├── (auth)/
│   ├── login/
│   └── signup/
│
├── (onboarding)/
│   └── onboarding/
│       └── step/
│           ├── 1/
│           ├── 2/
│           ├── 3/
│           └── 4/
│
├── (dashboard)/
│   └── dashboard/
│
├── api/
│   ├── auth/
│   ├── onboarding/
│   └── industry/
│
├── layout.tsx
├── page.tsx
└── globals.css
4. Route Groups
Authentication Routes
(app)/(auth)

Purpose:

Login
Signup
Password recovery
Authentication flows
Onboarding Routes
(app)/(onboarding)

Purpose:

New user setup
Business creation
Industry selection
Initial configuration
Dashboard Routes
(app)/(dashboard)

Purpose:

Authenticated application interface
Business operations
Tenant-specific views
5. Modules Architecture

Location:

src/modules/

Business features are organized as independent modules.

Example:

modules/
│
├── auth/
│   ├── components/
│   ├── actions/
│   ├── services/
│   ├── lib/
│   └── types.ts
│
├── onboarding/
│   ├── components/
│   ├── actions/
│   ├── services/
│   └── types.ts
│
├── business/
│   ├── components/
│   ├── services/
│   └── types.ts
│
├── branch/
│   ├── components/
│   └── services/
│
└── industry/
    ├── components/
    └── services/
6. Module Responsibilities

Each module owns:

Components

UI specific to that feature.

Example:

auth/components/LoginForm.tsx
Services

Business logic.

Example:

business/services/create-business.ts
Actions

Server actions.

Example:

onboarding/actions/complete-onboarding.ts
Types

Feature-specific TypeScript definitions.

Example:

business/types.ts
7. Shared Components

Location:

src/components/

Contains reusable UI.

Example:

components/
│
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
│
├── forms/
│
├── layouts/
│
└── shared/

Rules:

No business logic
Reusable everywhere
Independent from modules
8. Database Layer

Location:

src/lib/db/

Contains:

db/
├── prisma.ts
└── queries/

Responsibilities:

Prisma client
Database helpers
Reusable queries
9. Authentication Layer

Location:

src/lib/auth/

Contains:

auth/
├── supabase.ts
├── session.ts
└── permissions.ts

Responsibilities:

Supabase client setup
Session handling
Permission checks
10. Utility Layer

Location:

src/lib/

Contains:

lib/
│
├── db/
├── auth/
├── utils/
├── constants/
└── validations/
11. Validation Layer

Location:

src/validations/

Contains:

Zod schemas
API validation
Form validation

Example:

validations/
├── auth.ts
├── business.ts
└── onboarding.ts
12. Hooks

Location:

src/hooks/

Reusable React hooks.

Example:

hooks/
├── use-user.ts
├── use-business.ts
└── use-permission.ts
13. Types

Location:

src/types/

Global TypeScript definitions.

Example:

types/
├── auth.ts
├── database.ts
└── api.ts
14. Documentation

Location:

docs/

Contains architecture documentation:

docs/
│
├── ARCHITECTURE.md
├── DATABASE_DESIGN.md
├── API_DESIGN.md
├── AUTHENTICATION_AND_AUTHORIZATION.md
├── SECURITY_DESIGN.md
└── FOLDER_STRUCTURE.md
15. Import Rules

Preferred import order:

External libraries

↓

@/components

↓

@/modules

↓

@/lib

↓

@/types
16. Architecture Rules
Rule 1

Modules cannot directly access other module internals.

Bad:

auth imports onboarding/service

Good:

auth → shared service
Rule 2

Database access only through server-side code.

Forbidden:

Client Component
      |
      Prisma

Allowed:

Client
 |
API / Server Action
 |
Prisma
 |
Database
Rule 3

UI and business logic remain separated.

Components:

Render UI

Services:

Execute logic

Actions:

Handle mutations
17. Future Scaling Structure

When Project Atlas grows:

modules/

├── crm/
├── inventory/
├── billing/
├── analytics/
├── notifications/
├── reporting/
└── integrations/

Each feature becomes an isolated domain.

Conclusion

This folder structure provides:

Clear ownership boundaries
Easier debugging
Faster development
Better team collaboration
Enterprise scalability

The architecture is designed to support Project Atlas from MVP stage to a large multi-tenant SaaS platform.