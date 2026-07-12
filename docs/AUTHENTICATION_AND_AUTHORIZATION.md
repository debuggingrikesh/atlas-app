# AUTHENTICATION_AND_AUTHORIZATION.md

# Authentication and Authorization Design

## 1. Overview

Project Atlas uses a hybrid authentication architecture:

- Supabase Auth handles identity management.
- Prisma manages application-level user profiles and business relationships.
- Role-Based Access Control (RBAC) manages permissions inside businesses.

Authentication answers:

> Who is this user?

Authorization answers:

> What can this user do?

---

# 2. Authentication Architecture

## Identity Provider

Provider:


Supabase Auth


Supabase Auth responsibilities:

- User registration
- Login
- Password management
- Session management
- Token generation
- Identity lifecycle management

The application database never stores user passwords.

---

# 3. User Lifecycle

## Signup Flow


User
|
| Signup
|
v
Supabase Auth
|
| Create Auth User
|
v
Application API
|
| Create UserProfile
|
v
Onboarding Flow
|
| Create Business Context
|
v
Dashboard Access


---

# 4. User Data Separation

Project Atlas separates authentication identity from application data.

## Supabase Auth User

Managed by Supabase:


auth.users


Contains:

- User ID
- Email
- Authentication credentials
- Provider metadata
- Session information


## Prisma UserProfile

Managed by Project Atlas:


UserProfile


Contains:

- User ID
- Email
- Full name
- Avatar URL
- Onboarding status
- Application metadata


Relationship:


Supabase auth.users
|
|
v
UserProfile


The `UserProfile.id` must always match the Supabase Auth user ID.

---

# 5. Session Management

Authentication sessions are managed through:

- Supabase session cookies
- Middleware validation
- Server-side session checks


Request lifecycle:


Browser Request
|
v
Middleware
|
v
Validate Supabase Session
|
|
+----+----+
| |
Valid Invalid
| |
Continue Redirect Login


---

# 6. Route Protection

## Public Routes

No authentication required:


/
/login
/signup
/auth/*


---

## Protected Routes

Authentication required:


/dashboard/*
/onboarding/*
/settings/*


---

# 7. Middleware Responsibilities

Middleware responsibilities:

- Refresh authentication session
- Validate authenticated user
- Protect restricted routes
- Redirect unauthorized users


Middleware should not:

- Execute business logic
- Query complex application data
- Perform database mutations
- Handle role permissions

---

# 8. Authorization Architecture

Project Atlas uses:

## Multi-Tenant RBAC Model

Roles:


OWNER
ADMIN
MEMBER


Stored in:


BusinessMember.role


Authorization is evaluated at business level.

---

# 9. Role Permission Model

## OWNER

Highest permission level.

Capabilities:

- Manage business settings
- Manage members
- Access all modules
- Delete business
- Transfer ownership


---

## ADMIN

Operational administrator.

Capabilities:

- Manage operational data
- Manage users
- Configure modules


Restrictions:

- Cannot delete business
- Cannot transfer ownership


---

## MEMBER

Standard business user.

Capabilities:

- Access assigned modules
- Perform allowed operations


Restrictions:

- Cannot manage members
- Cannot change business configuration

---

# 10. Multi-Tenant Authorization

Every business-related request must validate:


User
|
v
BusinessMember
|
v
Business


Example:

Request:


GET /api/business/customers


Validation sequence:

1. Confirm user authentication
2. Confirm business membership
3. Confirm role permission
4. Execute operation

---

# 11. Authorization Flow


Request
|
v
Authenticate User
|
v
Find Business Membership
|
v
Check Permission
|
+--------------+
| |
Allowed Denied
| |
Execute 403


---

# 12. Permission Checking

Authorization logic should use reusable permission helpers.

Examples:


requireAuth()

requireBusinessMembership()

requireRole()

checkPermission()


Avoid duplicate authorization rules across modules.

---

# 13. Onboarding Authorization

New user onboarding flow:


Authenticated User
|
v
Start Onboarding
|
v
Create Business
|
v
Create OWNER Membership
|
v
Create Initial Branch
|
v
Dashboard Access


The onboarding transaction creates:

1. UserProfile
2. Business
3. BusinessMember
4. Branch
5. AuditLog

All operations execute atomically.

---

# 14. Logout Flow


User Logout
|
v
Supabase Sign Out
|
v
Clear Session
|
v
Redirect Login


---

# 15. Future Authentication Extensions

Future capabilities:

- Google OAuth
- Microsoft OAuth
- Magic link authentication
- Two-factor authentication
- Organization invitations
- Enterprise SSO
- Advanced permission policies


---

# 16. Security Principles

Core rules:

- Never expose Supabase service role keys
- Never trust client-side permissions
- Always validate authorization server-side
- Always verify tenant ownership
- Keep authentication separate from authorization
- Apply least privilege access

---

# 17. Current MVP Authentication Decisions

Current implementation:

- Supabase Auth enabled
- Email verification disabled during development
- Prisma UserProfile connected
- Session middleware active
- RBAC foundation implemented
- Multi-tenant structure implemented


Production requirements:

- Re-enable email verification
- Add authentication rate limiting
- Add audit monitoring
- Add invitation workflows
- Add advanced permission management