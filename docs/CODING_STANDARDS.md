# CODING_STANDARDS.md

# Project Atlas Coding Standards

Version: 1.0  
Status: Engineering Standard  
Document Type: Development Rules & Best Practices  
Last Updated: July 2026

---

# 1. Purpose

This document defines coding standards for Project Atlas.

The purpose is to maintain:

- Consistent code quality
- Predictable architecture
- Easier collaboration
- AI-assisted development compatibility
- Long-term maintainability

All contributors and AI coding agents must follow these standards.

---

# 2. Core Development Principles

Project Atlas follows these principles:

## Clean Architecture

Code should be:

- Modular
- Separated by responsibility
- Easy to test
- Easy to extend

---

## Type Safety First

Avoid:

```ts
any

Prefer:

unknown

with proper validation.

Explicit Over Implicit

Prefer readable code.

Avoid:

Hidden side effects
Magic values
Complex one-line logic
Security By Default

Never trust:

Client input
URL parameters
User-provided IDs

Always validate server-side.

3. Technology Standards
Core Stack

Project Atlas uses:

Frontend:
Next.js
React
TypeScript
TailwindCSS

Backend:
Next.js Server Actions
API Routes

Database:
PostgreSQL
Prisma ORM

Authentication:
Supabase Auth

Validation:
Zod
4. TypeScript Standards
Strict Mode

Always keep:

{
 "strict": true
}

enabled.

Type Naming

Use PascalCase:

Good:

type UserProfile = {}

interface BusinessMember {}

Bad:

type user_profile = {}
Variable Naming

Use camelCase:

Good:

const businessId = "123"

Bad:

const BusinessID = "123"
Boolean Naming

Use descriptive prefixes:

Good:

const isActive = true

const hasPermission = true

const canEdit = true

Bad:

const active = true
5. React Component Standards
Component Naming

Use PascalCase.

Example:

BusinessCard.tsx

UserProfileForm.tsx
Component Structure

Recommended:

import statements


types


constants


component


helper functions


export

Example:

type Props = {
 title:string
}

export function Card({title}:Props){

 return (
   <div>
     {title}
   </div>
 )
}
6. Component Rules
Keep Components Small

Avoid:

1000+ line components

Split into:

Component

|

Sub Components

|

Hooks

|

Utilities
Prefer Composition

Good:

<Card>
 <Header/>
 <Body/>
</Card>

Avoid:

<Card header body footer />
7. Server Component Rules

Default:

Use Server Components.

Benefits:

Better performance
Smaller bundles
Secure data access

Use Client Components only when needed:

Examples:

useState
useEffect
Browser APIs
Interactive UI

Client components must include:

"use client"

at the top.

8. Folder Naming Standards

Use lowercase folders:

Good:

src/modules/auth
src/modules/business

Bad:

src/modules/Auth

Files:

Use kebab-case where appropriate:

user-profile.ts

auth-service.ts

Components:

PascalCase:

UserCard.tsx
9. Module Structure Standards

Every module should follow:

module-name/

components/

hooks/

services/

schemas/

types/

utils/


Example:

modules/business

components/
BusinessForm.tsx

services/
business-service.ts

schemas/
business.schema.ts

types/
business.types.ts
10. API Standards

Every API endpoint must:

Authenticate user
Validate input
Check authorization
Execute business logic
Return consistent response

Example flow:

Request

↓

Authentication

↓

Validation

↓

Permission Check

↓

Service Layer

↓

Database

↓

Response
11. API Response Format

Success:

{
 "success": true,
 "data": {}
}

Error:

{
 "success": false,
 "error": {
   "code":"INVALID_INPUT",
   "message":"Invalid request"
 }
}
12. Validation Standards

All external input must be validated.

Use:

Zod schemas

Example:

const schema = z.object({
 email:z.string().email()
})

Never trust:

Forms
Query params
API payloads
13. Database Standards
Prisma Usage

Never access Prisma directly inside UI components.

Bad:

Component

↓

Prisma

Good:

Component

↓

Service

↓

Prisma
14. Tenant Data Rules

Every tenant-owned database query must include:

businessId

Example:

await prisma.customer.findMany({
 where:{
  businessId
 }
})

Never:

findMany()

without tenant filtering.

15. Database Migration Rules

Before migration:

Check:

Existing data impact
Backward compatibility
Index requirements

Never:

Delete production columns blindly
Modify migrations after deployment
16. Error Handling Standards

Never:

catch(error){
 console.log(error)
}

Use:

catch(error){

 logger.error(error)

 throw new AppError()

}
17. Logging Standards

Logs should include:

Timestamp
User ID
Business ID
Action
Error details

Never log:

Passwords
Tokens
Sensitive user data
18. Environment Variables

Never hardcode:

API keys

Secrets

Database URLs

Use:

.env

.env.local

Required:

Document variables in:

.env.example
19. Git Standards
Commit Format

Use:

type(scope): message

Examples:

feat(auth): add login flow

fix(onboarding): preserve wizard state

docs(api): update API design

Commit types:

feat
fix
docs
refactor
test
chore
20. Pull Request Standards

Every PR should include:

Description
Screenshots if UI changes
Testing performed
Migration notes

Before merge:

Required:

npm run lint

npm run build

Tests passing
21. AI Coding Agent Rules

AI-generated code must:

Follow Existing Architecture

Never introduce:

New patterns without approval
Duplicate services
Duplicate utilities
Before Editing

AI must:

Read relevant documentation
Understand existing patterns
Modify minimum required files
After Editing

AI must verify:

Lint

Type Check

Build

Tests
22. Code Review Checklist

Review:

Architecture
Does it follow module structure?
Security
Is authorization checked?
Database
Is tenant isolation maintained?
Performance
Are queries optimized?
Maintainability
Is the code readable?
23. Definition of Clean Code

Clean code means:

Easy to understand
Easy to modify
Easy to test
Safe to extend
24. Final Rule

When choosing between:

Fast implementation

and

Maintainable architecture

Project Atlas chooses maintainable architecture.

The goal is not only to build features.

The goal is to build a platform that can scale for years.