# Project Atlas Architecture Document

Version: 1.0
Status: Active Development
Last Updated: YYYY-MM-DD

---

# 1. Product Overview

## Vision

Project Atlas is a multi-tenant SaaS platform designed to allow businesses from different industries to create, manage, and operate their digital workflows through industry-specific modules.

## Core Principles

- Multi-tenant by design
- Secure data isolation
- Modular industry architecture
- API-first backend
- Scalable SaaS foundation
- Configuration over customization

---

# 2. Technology Stack

## Frontend

Framework:
- Next.js 16 (App Router)

Language:
- TypeScript

UI:
- Base UI
- Tailwind CSS
- Shadcn components

Rendering:
- Server Components by default
- Client Components only where interaction is required


## Backend

Architecture:
- Next.js Route Handlers

Database ORM:
- Prisma ORM v7

Database:
- PostgreSQL (Supabase)


## Authentication

Provider:
- Supabase Auth

Current MVP:
- Email verification disabled

Production:
- Email verification enforcement enabled


## Deployment

Hosting:
- TBD

Database:
- Supabase PostgreSQL

---

# 3. High Level Architecture


                    User
                     |
                     |
              Next.js Application
                     |
        -----------------------------
        |                           |
    Frontend                   API Routes
        |                           |
        |                     Business Logic
        |                           |
        -----------------------------
                     |
                 Prisma ORM
                     |
             PostgreSQL Database


---

# 4. Application Structure


src/
|
├── app/
│   ├── api/
│   ├── auth/
│   ├── onboarding/
│   ├── dashboard/
│
├── modules/
│   ├── auth/
│   ├── onboarding/
│   ├── business/
│
├── lib/
│   ├── db/
│   ├── supabase/
│
├── components/
│
└── middleware.ts


---

# 5. Multi Tenant Architecture


## Tenant Model

Business represents a tenant.


Hierarchy:

IndustryTemplate

        |
        |

Business

        |
        |

Branch

        |
        |

Users


Example:


Healthcare Template

        |
        |

ABC Hospital

        |
        |

Kathmandu Branch


## Tenant Isolation

Every business-owned record must contain:

businessId


All queries must enforce tenant scope.


---

# 6. Database Architecture


## Core Entities


## IndustryTemplate

Purpose:
Defines reusable industry configurations.


Fields:

- id
- name
- slug
- description
- isActive


---

## Business

Purpose:
Tenant organization.


Fields:

- id
- name
- slug
- industryTemplateId


Relations:

Business
 |
 ├── Branches
 └── Members


---

## Branch

Purpose:
Supports multi-location businesses.


---

## UserProfile

Purpose:
Application user profile linked with Supabase Auth.


Auth relationship:

Supabase User

        |

UserProfile


---

## BusinessMember

Purpose:
Maps users to businesses.


Roles:

OWNER

ADMIN

MEMBER


---

## AuditLog

Purpose:

Tracks important system actions.


---

# 7. Authentication Flow


## Signup Flow


User Signup

↓

Supabase Auth User Created

↓

User redirected to onboarding

↓

UserProfile created during onboarding completion


---

## Login Flow


Login

↓

Supabase Session

↓

Fetch UserProfile

↓

Load Business Membership

↓

Dashboard


---

# 8. Onboarding Architecture


## Goal

Create initial tenant setup atomically.


Flow:


Step 1

User Profile


↓

Step 2

Business Information


↓

Step 3

Industry Selection


↓

Step 4

Branch Setup


↓

Complete Transaction


Creates:

- UserProfile
- Business
- BusinessMember
- Branch
- AuditLog


Transaction:

Prisma.$transaction()


---

# 9. State Management


## Current MVP


Onboarding wizard state:

sessionStorage


Reason:

Prevent state loss during Next.js navigation.


Flow:


Step Submit

↓

Persist Partial State

↓

Navigate


Completion:

Database Transaction Success

↓

Clear sessionStorage


---

# 10. Security Architecture


## Server Only

Never expose:

- SUPABASE_SERVICE_ROLE_KEY
- DATABASE credentials


## Client

Allowed:

- Supabase anon key


## API Protection

Protected routes require:

- Valid Supabase session
- UserProfile existence
- Business membership validation


---

# 11. Prisma Architecture


Database access:


src/lib/db/prisma.ts


Rules:

- Single Prisma client instance
- Global caching in development
- Prisma transactions for multi-table writes


---

# 12. Future Module Architecture


Each industry module follows:


modules/

industry-name/

├── components/

├── services/

├── schemas/

├── types/

└── permissions/


Example:


modules/

hospital/

modules/

education/

modules/

restaurant/


---

# 13. Permission System


Future:


Role Based Access Control


Example:


OWNER

Full access


ADMIN

Management access


MEMBER

Operational access


---

# 14. Logging


Audit events:

- User created
- Business created
- Settings changed
- Records modified


Stored:

AuditLog table


---

# 15. Development Rules


## Code Rules

- TypeScript strict mode
- No duplicated business logic
- Server actions/API routes validate input
- Zod validation for external input


## Database Rules

- Every tenant table requires businessId
- Never query tenant data without scope filtering


---

# 16. Current Development Phase


Phase 1:
Foundation

Status:
Completed


Includes:

✅ Next.js setup

✅ Supabase Auth

✅ Prisma setup

✅ Database schema

✅ Signup/Login

✅ Onboarding workflow


---

# 17. Next Development Phases


## Phase 2

Dashboard Foundation


## Phase 3

Business Management


## Phase 4

Industry Modules


## Phase 5

Permissions


## Phase 6

Production Hardening