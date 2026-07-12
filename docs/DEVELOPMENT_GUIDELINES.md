# Development Guidelines Document

## 1. Overview

Project Atlas development guidelines define the engineering standards, coding practices, architectural rules, and collaboration principles required to maintain a scalable SaaS platform.

The goal is to ensure:

- Consistent code quality
- Maintainable architecture
- Faster development
- Reduced technical debt
- Easier onboarding of developers

---

# 2. Core Development Principles

Project Atlas follows these principles:

## Simplicity First

Prefer:

- Clear solutions
- Minimal complexity
- Maintainable code

Avoid:

- Over-engineering
- Premature optimization
- Unnecessary abstractions

---

## Feature Driven Development

Development should follow:


Requirement

↓

Architecture Decision

↓

Implementation

↓

Testing

↓

Documentation


---

## Security By Default

Every feature must consider:

- Authentication
- Authorization
- Data isolation
- Input validation

---

# 3. Project Structure Guidelines

Project Atlas follows a modular architecture.


src

├── app
│
├── modules
│
├── components
│
├── lib
│
├── hooks
│
├── types
│
└── utils


---

# 4. Module Organization

Business domains should live inside modules.

Example:


modules/

auth/

business/

branch/

dashboard/

billing/


Each module contains:


module/

├── components

├── actions

├── services

├── validators

├── types


---

# 5. Naming Conventions

## Files

Use:


kebab-case


Example:


user-profile.ts


---

## Components

Use:


PascalCase


Example:


UserProfileCard.tsx


---

## Functions

Use:


camelCase


Example:


createBusiness()


---

## Constants

Use:


UPPER_SNAKE_CASE


Example:


MAX_LOGIN_ATTEMPTS


---

# 6. TypeScript Guidelines

## Strict Typing

Avoid:

```ts
any

Prefer:

unknown

with proper validation.

Define Interfaces

Example:

interface BusinessData {
  name: string;
  slug: string;
}
Function Return Types

Important business functions should define return types.

Example:

async function createBusiness(): Promise<Business>
7. React Guidelines
Component Rules

Components should:

Have one responsibility
Avoid large files
Separate business logic

Avoid:

500+ line components

Prefer:

Small reusable components
8. Server Components

Default:

Use Server Components.

Use Client Components only when requiring:

Browser APIs
State
Effects
User interaction

Example:

Server:

DashboardPage.tsx

Client:

BusinessForm.tsx
9. State Management Guidelines

Use:

Local State

For:

Forms
UI states
Temporary data
Server State

For:

Database data
API responses
Persistent State

For:

Authentication
User preferences

Avoid unnecessary global state.

10. API Development Rules

Every API endpoint must include:

Authentication Check

Example:

Is user logged in?
Authorization Check

Example:

Does user belong to business?
Validation

Example:

Is input valid?
Error Handling

Example:

Return meaningful status codes
11. API Response Standards

Success:

{
  "success": true,
  "data": {}
}

Error:

{
  "success": false,
  "error": {
    "message": "Invalid request"
  }
}
12. Database Guidelines
Prisma Usage

All database access should go through Prisma.

Avoid:

Direct SQL inside components
Transactions

Use transactions for multi-step operations.

Example:

Create Business

+

Create Owner Membership

+

Create Branch

+

Create Audit Log
Query Optimization

Always consider:

Indexes
Relations
Query size
13. Multi Tenant Rules

Critical rule:

Every business-related query must include:

businessId

Never allow:

User A

↓

Business B Data
14. Authentication Guidelines

Authentication flow:

Supabase Auth

↓

Session

↓

UserProfile

↓

Business Membership

Never:

Trust frontend user data
Store passwords manually
Skip server validation
15. Validation Guidelines

Use:

Zod

for:

API inputs
Forms
Environment variables

Example:

const schema = z.object({
 name: z.string().min(2)
})
16. Error Handling

Errors should be:

Logged

For developers.

Friendly

For users.

Avoid exposing:

Database errors
Stack traces
Internal details
17. Git Guidelines
Branch Naming

Examples:

feature/user-dashboard

bugfix/login-error

hotfix/security-patch
18. Commit Messages

Use:

type: description

Examples:

feat: add business onboarding

fix: resolve auth redirect issue

docs: update database design
19. Pull Request Guidelines

Every PR should contain:

Description

What changed.

Reason

Why it changed.

Testing

How it was verified.

Example:

npm run lint

npx tsc --noEmit
20. Environment Rules

Never commit:

.env
.env.local

Required:

.env.example

with placeholder values.

21. Documentation Rules

Every major feature requires:

Architecture update

API documentation

Database changes

Testing notes
22. Code Review Checklist

Review:

Architecture
Does it follow module structure?
Security
Authentication checked?
Authorization checked?
Database
Tenant isolation preserved?
Performance
Queries optimized?
23. Dependency Management

Before adding packages:

Check:

Maintenance status
Bundle size
Security issues
Long-term necessity
24. Production Readiness Rules

Before merging:

Required:

npm run lint

npx tsc --noEmit

npm run build
25. Technical Debt Management

Technical debt should be:

Documented
Prioritized
Scheduled

Avoid leaving unknown issues.

26. AI Assisted Development Guidelines

AI tools may assist with:

Code generation
Documentation
Debugging
Refactoring

However:

Developer must verify:

Architecture compatibility
Security
Performance
Correctness
27. Future Developer Onboarding

A new developer should understand:

Architecture
Database design
Authentication flow
API patterns
Deployment process

Before contributing.

Conclusion

Project Atlas development guidelines establish a consistent engineering culture focused on:

Clean architecture
Secure development
Maintainable code
Scalable SaaS practices

Following these guidelines ensures the platform remains reliable as the product grows.