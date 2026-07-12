# Backend Architecture Document

## 1. Overview

Project Atlas backend is designed as a scalable multi-tenant SaaS backend built on:

- Next.js App Router server environment
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Authentication
- TypeScript
- Server Actions
- API Routes

The backend architecture focuses on:

- Secure tenant isolation
- Maintainable business logic
- Transaction safety
- Scalability
- Clear separation of responsibilities

---

# 2. Backend Architecture Principles

## 2.1 Separation of Concerns

Backend responsibilities are divided into:


API Layer

↓

Service Layer

↓

Database Layer

↓

PostgreSQL


Each layer has a defined responsibility.

---

# 3. Backend Request Flow

General request lifecycle:


User Request

↓

Middleware

↓

Route Handler / Server Action

↓

Authentication Check

↓

Authorization Check

↓

Business Logic

↓

Database Transaction

↓

Response

↓

Frontend Update


---

# 4. Backend Folder Structure


src/

├── app/
│ ├── api/
│ └── actions/
│
├── modules/
│ ├── auth/
│ ├── onboarding/
│ ├── business/
│ ├── industry/
│ └── users/
│
├── lib/
│ ├── db/
│ ├── supabase/
│ ├── errors/
│ └── utils/
│
├── services/
│
└── types/


---

# 5. API Layer

API routes are responsible for:

- Request handling
- Input parsing
- Authentication verification
- Calling services
- Returning responses

Example:


POST /api/business/create


Flow:


API Route

↓

Validate Request

↓

Business Service

↓

Prisma

↓

Database


---

# 6. Service Layer

Business logic must live outside API routes.

Example:


business-service.ts


Responsibilities:

- Create business
- Update business
- Validate business rules
- Handle transactions

Example:


API Route

↓

BusinessService.create()

↓

Prisma Transaction


---

# 7. Database Layer

Database access is handled through Prisma.

Structure:


lib/db/

└── prisma.ts


Responsibilities:

- Prisma client initialization
- Connection management
- Query execution

---

# 8. Prisma Architecture

Current stack:


Application

↓

Prisma Client

↓

Prisma ORM

↓

PostgreSQL

↓

Supabase Database


---

# 9. Prisma Client Management

Development:


Singleton Prisma Client


Purpose:

- Prevent multiple database connections
- Support Next.js hot reload

Production:


Single managed connection pool


---

# 10. Database Transaction Strategy

Critical operations use Prisma transactions.

Example:

Onboarding completion:


Transaction Start

↓

Create UserProfile

↓

Create Business

↓

Create BusinessMember

↓

Create Branch

↓

Create AuditLog

↓

Transaction Commit


If any step fails:


Rollback Everything


---

# 11. Multi Tenant Architecture

Project Atlas follows tenant isolation.

Hierarchy:


IndustryTemplate

    |

Business

    |

Branch

    |

Users


---

Every tenant-owned resource must include:


businessId


Example:


Customer

Invoice

Appointment

Employee

Settings


All future modules must maintain tenant boundaries.

---

# 12. Authentication Integration

Authentication provider:


Supabase Auth


Flow:


User

↓

Supabase Login

↓

Auth Session

↓

Cookie

↓

Middleware

↓

Backend Verification

↓

Application User


---

# 13. User Identity Mapping

Supabase user:


auth.users


maps to:


UserProfile


Relationship:


Supabase User ID

↓

UserProfile.id

↓

BusinessMember.userId

↓

Business Access


---

# 14. Authorization Architecture

Authentication answers:


Who is the user?


Authorization answers:


What can the user do?


---

Authorization layers:

## Middleware

Handles:

- Route protection

---

## Service Layer

Handles:

- Permission checks

---

## Database Constraints

Handles:

- Data integrity

---

# 15. Role Based Access Control

Current roles:


OWNER

ADMIN

MEMBER


Permission example:


OWNER

Create Business
Manage Users
Delete Tenant

ADMIN

Manage Operations

MEMBER

View Assigned Data


---

# 16. Server Actions

Server Actions are used for:

- Internal mutations
- Form submissions
- Application workflows

Examples:


completeOnboarding()

updateProfile()

createBranch()


Advantages:

- Type safety
- Less boilerplate
- Direct server execution

---

# 17. API Routes

API routes are used for:

- External integrations
- Public endpoints
- Client-heavy operations

Examples:


/api/auth/signup

/api/auth/login

/api/industry/templates


---

# 18. Validation Strategy

All external input must be validated.

Flow:


Request

↓

Zod Schema

↓

Business Logic

↓

Database


Validation happens:

- Frontend
- Backend

Backend validation is always authoritative.

---

# 19. Error Handling

Backend errors follow a standard structure.

Example:


{
success:false,
error:{
code:"BUSINESS_NOT_FOUND",
message:"Business does not exist"
}
}


---

Error categories:


AUTH_ERROR

VALIDATION_ERROR

DATABASE_ERROR

PERMISSION_ERROR

SYSTEM_ERROR


---

# 20. Logging Strategy

Backend logging tracks:

- Authentication events
- Database failures
- Important actions
- Security events

Future:


Structured Logging

↓

Monitoring Platform

↓

Alerts


---

# 21. Audit Logging

Important actions create AuditLog entries.

Example:


User Created Business

↓

AuditLog

{
action:"CREATE",
entityType:"Business",
entityId:"xxx"
}


Tracked:

- Who performed action
- What changed
- When it happened

---

# 22. Background Processing

Future backend workers:

Used for:

- Emails
- Reports
- Notifications
- Data processing

Architecture:


Event

↓

Queue

↓

Worker

↓

Database Update


---

# 23. Caching Strategy

Future caching layers:

## Application Cache

For:

- Frequently used data

---

## Database Optimization

Using:

- Indexes
- Query optimization

---

## Edge Cache

For:

- Public content

---

# 24. Security Rules

Backend must:

- Never expose service role keys
- Validate every request
- Verify tenant ownership
- Sanitize input
- Use transactions for critical operations

---

# 25. Scaling Strategy

Current:


Single Next.js Application

Supabase PostgreSQL


---

Future scaling:


Frontend

↓

API Layer

↓

Service Layer

↓

Database Cluster

↓

Background Workers


---

# 26. Development Guidelines

Rules:

1. Business logic belongs in services.

2. Database access belongs in Prisma layer.

3. API routes should remain thin.

4. Every tenant resource requires ownership checks.

5. Critical workflows require transactions.

6. Every mutation requires validation.

---

# Conclusion

Project Atlas backend architecture provides:

- Secure SaaS foundation
- Multi-tenant readiness
- Transaction-safe operations
- Clear service boundaries
- Future scalability

The architecture is designed to support MVP development while remaining compatible with enterprise-level expansion.