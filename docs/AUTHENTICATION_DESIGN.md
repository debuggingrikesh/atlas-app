# AUTHENTICATION_DESIGN.md

# Atlas Authentication Design

## 1. Purpose

This document defines the authentication architecture for Atlas.

Atlas uses a secure, scalable authentication model designed for a multi-tenant SaaS platform where users can belong to one or multiple businesses with different permission levels.

The authentication system handles:

- User identity management
- Signup and login flows
- Session lifecycle
- User profile synchronization
- Business membership association
- Authorization foundation
- Protected route handling

---

# 2. Authentication Architecture Overview

Atlas separates authentication from application identity.

## Authentication Layer

Handled by:

- Supabase Auth
- JWT sessions
- Secure cookies
- PKCE authentication flow

Responsibilities:

- User registration
- User login
- Password management
- Session refresh
- OAuth readiness

---

## Application Identity Layer

Handled by:

- Prisma
- PostgreSQL

Responsibilities:

- User profiles
- Business memberships
- Roles
- Onboarding state
- Application permissions

---

## Authentication Flow

```
User
 |
 v
Supabase Auth
 |
 v
Authenticated Session
 |
 v
UserProfile
 |
 v
BusinessMember
 |
 v
Business Access
```

---

# 3. Authentication Provider

## Primary Provider

Supabase Auth

Reasons:

- PostgreSQL native integration
- JWT support
- Secure session handling
- OAuth compatibility
- Scalable infrastructure

---

# 4. User Identity Model

Atlas maintains two identities.

## 4.1 Supabase Auth User

Managed by Supabase.

Contains:

```
id
email
encrypted password
provider
created_at
last_sign_in
```

---

## 4.2 Atlas UserProfile

Managed by Prisma.

```prisma
model UserProfile {
  id                    String   @id
  email                 String   @unique
  fullName              String?
  avatarUrl             String?
  onboardingStep        Int      @default(1)
  onboardingCompletedAt DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  memberships BusinessMember[]
}
```

Relationship:

```
Supabase Auth User
        |
        |
        v
   UserProfile
```

The Supabase user ID is the primary identity reference.

---

# 5. Signup Flow

## MVP Flow

```
User enters signup details
        |
        v
POST /api/auth/signup
        |
        v
Supabase createUser()
        |
        v
Create UserProfile
        |
        v
Redirect to onboarding
```

---

## Signup Responsibilities

The signup endpoint must:

1. Validate user input
2. Create Supabase account
3. Create UserProfile
4. Initialize onboarding state
5. Establish session
6. Redirect user

---

# 6. Login Flow

```
User enters credentials
        |
        v
POST /api/auth/login
        |
        v
Supabase signIn()
        |
        v
Validate session
        |
        v
Fetch UserProfile
        |
        v
Redirect
```

---

# 7. Session Management

Atlas uses Supabase managed sessions.

Session contains:

```
user_id
email
access_token
refresh_token
expiry
```

---

## Session Lifecycle

```
Request
 |
 v
Proxy Middleware
 |
 v
Validate Session
 |
 v
Allow / Reject
```

---

# 8. Route Protection

## Protected Routes

```
/dashboard/*
/settings/*
/business/*
/api/private/*
```

Requirements:

```
Valid Session
+
Existing UserProfile
```

---

## Public Routes

```
/
/login
/signup
/auth/*
```

---

# 9. Proxy Authentication Rules

The proxy layer handles:

- Session refresh
- Route protection
- Redirect logic

Rules:

```
IF no session
    redirect /login

IF session exists
    continue

IF profile missing
    redirect onboarding
```

---

# 10. Onboarding Authentication State

New user lifecycle:

```
Signup
 |
 v
Authenticated User
 |
 v
Onboarding
 |
 v
Complete Setup
 |
 v
Dashboard
```

Completion creates:

```
UserProfile
+
Business
+
BusinessMember
+
Branch
+
AuditLog
```

inside a single database transaction.

---

# 11. Multi Tenant Authentication Model

Atlas supports users belonging to multiple businesses.

Example:

```
User A

 |
 +---- Business Alpha
 |          |
 |          OWNER
 |
 |
 +---- Business Beta
            |
            MEMBER
```

Access is determined by membership.

---

# 12. Authorization Foundation

Authentication answers:

```
Who is the user?
```

Authorization answers:

```
What can the user do?
```

These systems remain separate.

---

# 13. Role System

Initial roles:

```
OWNER
ADMIN
MEMBER
```

Example permissions:

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| Manage Business | Yes | Yes | No |
| Invite Users | Yes | Yes | No |
| View Data | Yes | Yes | Yes |
| Delete Business | Yes | No | No |

---

# 14. Future Authentication Extensions

## OAuth Providers

Future support:

- Google
- Microsoft
- Apple

---

## Enterprise Authentication

Future:

- SAML
- OIDC
- Enterprise SSO

---

## Security Enhancements

Future:

- MFA
- Device management
- Login history
- Suspicious activity detection

---

# 15. Error Handling

All authentication APIs use a consistent format.

Example:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

# 16. Security Rules

Never expose:

```
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
```

to client-side code.

---

Client allowed:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

Server allowed:

```
Service role operations
Database access
Admin operations
```

---

# 17. Authentication Folder Structure

Recommended:

```
src/
 |
 ├── app/
 |    |
 |    ├── login/
 |    ├── signup/
 |    └── auth/
 |
 ├── modules/
 |    |
 |    └── auth/
 |         |
 |         ├── components/
 |         ├── actions/
 |         ├── validators/
 |         └── services/
 |
 ├── lib/
 |    |
 |    ├── supabase/
 |    └── db/
 |
 └── proxy.ts
```

---

# 18. Development Rules

Every authentication change must:

- Pass TypeScript validation
- Pass ESLint
- Maintain server/client separation
- Protect sensitive environment variables
- Include error handling
- Preserve multi-tenant compatibility

---

# 19. Authentication Roadmap

## Phase 1

Completed:

- Supabase Auth integration
- Signup
- Login
- Session handling
- UserProfile creation

---

## Phase 2

Next:

- Password reset
- Profile management
- Avatar upload
- Session controls

---

## Phase 3

Enterprise:

- OAuth providers
- MFA
- SSO
- Advanced security controls

---

# Conclusion

Atlas authentication is designed as a scalable SaaS identity system.

Supabase manages authentication and security.

Atlas manages users, businesses, memberships, and permissions.

This separation allows Atlas to scale from a single-business application into a complete multi-tenant SaaS platform.