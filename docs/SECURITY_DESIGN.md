# Security Design Document

## 1. Overview

Project Atlas follows a security-first multi-tenant SaaS architecture.

Security responsibilities are divided across:

- Authentication security
- Authorization enforcement
- Tenant isolation
- Database security
- API protection
- Session management
- Data validation
- Audit tracking

The goal is to ensure each business tenant can only access its own resources while maintaining a scalable SaaS foundation.

---

# 2. Security Principles

## 2.1 Least Privilege

Every user receives only the permissions required for their assigned role.

Example:

OWNER:
- Full business access
- User management
- Business configuration

ADMIN:
- Operational management
- Cannot transfer ownership

MEMBER:
- Limited operational access

---

## 2.2 Tenant Isolation

Project Atlas uses a multi-tenant database architecture.

Every tenant-owned resource must be connected through:


User
|
BusinessMember
|
Business
|
Tenant Resources


Example:


Business
├── Branches
├── Members
├── Records
└── Audit Logs


A user must never access resources without verifying business membership.

---

# 3. Authentication Security

Authentication is handled through Supabase Auth.

Responsibilities:

Supabase:
- Password management
- Session generation
- Token handling
- Authentication lifecycle

Application:
- User profile management
- Business membership
- Authorization rules

---

# 4. Session Security

## 4.1 Session Storage

Authentication sessions are handled through secure cookies.

Requirements:

- HTTP-only cookies
- Secure flag in production
- SameSite protection
- Automatic token refresh

---

## 4.2 Session Validation

Every protected request should verify:


Request
|
Session Check
|
Authenticated User
|
Authorization Check
|
Resource Access


---

# 5. Authorization Model

Project Atlas uses Role Based Access Control (RBAC).

## Roles


OWNER
ADMIN
MEMBER


---

## Permission Matrix

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| View Business | Yes | Yes | Yes |
| Update Business | Yes | Yes | No |
| Manage Members | Yes | Yes | No |
| Delete Business | Yes | No | No |
| View Operational Data | Yes | Yes | Yes |
| Modify Operational Data | Yes | Yes | Limited |

---

# 6. API Security

All API routes must follow:


Request
↓
Authentication Check
↓
Authorization Check
↓
Input Validation
↓
Business Logic
↓
Database Transaction
↓
Response


---

# 7. Input Validation

All user input must be validated before database operations.

Validation layers:

## Client Side

Purpose:

- Better UX
- Immediate feedback


## Server Side

Purpose:

- Security enforcement
- Prevent malicious requests


Recommended:

- Zod schemas
- Type-safe validation

Example:

```ts
const schema = z.object({
  name: z.string().min(2),
});
8. Database Security
8.1 Prisma Access

Database access happens only through Prisma.

Direct database queries from frontend are prohibited.

Flow:

Frontend
 |
API Route
 |
Prisma Client
 |
PostgreSQL
8.2 Sensitive Fields

Never expose:

Password hashes
Service role keys
Internal IDs unnecessarily
Database URLs
9. Environment Security

Environment variables are separated into:

Public Variables

Allowed:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Accessible in browser.

Private Variables

Server only:

SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL

Never expose through client components.

10. Supabase Security Rules

Service role key usage:

Allowed:

Server actions
API routes
Admin operations

Forbidden:

Client components
Browser requests
Public APIs
11. Audit Logging

Sensitive operations must create audit records.

Tracked actions:

User creation
Business creation
Member changes
Permission changes
Data deletion
Administrative actions

Example:

AuditLog

{
 action: "BUSINESS_CREATED",
 entityType: "Business",
 actorId: userId,
 businessId: businessId
}
12. Error Handling Security

Never expose internal errors.

Bad:

Database connection failed:
postgres://username:password@host

Good:

Something went wrong. Please try again.

Detailed errors:

Logged internally
Not returned to users
13. Rate Limiting

Future API protection:

Protected endpoints:

Authentication
File uploads
Search
Heavy queries

Possible strategies:

IP based limiting
User based limiting
API token limiting
14. Data Protection

Sensitive data handling:

Encrypt sensitive information
Validate all uploads
Restrict access by tenant
Maintain deletion policies
15. Middleware Security

Middleware responsibilities:

Session refresh
Route protection
Authentication redirects

Middleware should not:

Perform heavy database operations
Execute business logic
Modify application state
16. Security Checklist
Authentication

[x] Supabase authentication integrated
[x] Secure session handling
[x] Protected routes

Authorization

[x] RBAC implemented
[x] Tenant isolation enforced
[x] Membership verification

Database

[x] Prisma-only access
[x] Transaction based operations
[x] Audit logging foundation

Environment

[x] Secrets separated
[x] Client exposure prevented

17. Future Security Enhancements

Planned improvements:

Row Level Security policies
Two-factor authentication
Security event monitoring
Advanced audit dashboard
API rate limiting
File scanning
Enterprise SSO support
Conclusion

Project Atlas security architecture is designed around:

Strong authentication
Role based authorization
Multi-tenant isolation
Secure API boundaries
Controlled database access

This foundation allows the platform to scale from MVP to enterprise SaaS securely.
